import { config } from '../../config/index.js';
import { GeminiProvider, AIProviderError } from './gemini-provider.js';
import { CuratedProvider, CURATED_BLOCKCHAIN_CURRICULUM } from './curated-provider.js';

const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_CACHE_MAX_ENTRIES = 200;

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function publicQuestion(question) {
  const { correctOptionIndex, ...safeQuestion } = question;
  return safeQuestion;
}

export class QuestionBank {
  constructor({ ttlMs = 30 * 60 * 1000, maxEntries = 1000 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  set(question) {
    if (!question?.id || !Number.isInteger(question.correctOptionIndex)) return;
    this.prune();
    if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }
    this.entries.set(question.id, {
      question: clone(question),
      expiresAt: Date.now() + this.ttlMs
    });
  }

  get(questionId) {
    const entry = this.entries.get(questionId);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(questionId);
      return null;
    }
    return clone(entry.question);
  }

  prune() {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  get size() {
    return this.entries.size;
  }
}

function curatedLookup(questionId) {
  if (!questionId) return null;
  for (const pool of Object.values(CURATED_BLOCKCHAIN_CURRICULUM)) {
    const match = pool.find(question => question.id === questionId);
    if (match) return clone(match);
  }
  return null;
}

export class AIService {
  constructor({
    geminiProvider = null,
    curatedProvider = new CuratedProvider(),
    cacheTtlMs = config.ai.cacheTtlMs,
    cacheMaxEntries = config.ai.cacheMaxEntries,
    now = () => Date.now()
  } = {}) {
    this.curatedProvider = curatedProvider;
    this.cache = new Map();
    this.cacheTtlMs = cacheTtlMs || DEFAULT_CACHE_TTL_MS;
    this.cacheMaxEntries = cacheMaxEntries || DEFAULT_CACHE_MAX_ENTRIES;
    this.questionBank = new QuestionBank({ ttlMs: this.cacheTtlMs * 3 });
    this.lastGeminiError = null;
    this.now = now;
    this.geminiProvider = geminiProvider;

    if (!this.geminiProvider && config.ai.provider === 'gemini' && config.ai.apiKey) {
      try {
        this.geminiProvider = new GeminiProvider({
          apiKey: config.ai.apiKey,
          model: config.ai.model,
          timeoutMs: config.ai.timeoutMs,
          maxRetries: config.ai.maxRetries
        });
      } catch (err) {
        this.lastGeminiError = {
          code: err.code || 'AI_INIT_FAILED',
          message: 'Gemini provider could not be initialized.'
        };
      }
    }
  }

  getCacheKey(topic, difficulty, count, learningObjective = '') {
    return `${String(topic).toLowerCase().trim()}:${difficulty}:${count}:${String(learningObjective).toLowerCase().trim()}`;
  }

  getCached(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.cache.delete(key);
      return null;
    }
    return clone(entry.value);
  }

  setCached(key, value) {
    if (this.cache.size >= this.cacheMaxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value: clone(value),
      expiresAt: this.now() + this.cacheTtlMs
    });
  }

  isGeminiAvailable() {
    return Boolean(this.geminiProvider) && config.ai.provider === 'gemini';
  }

  getStatus() {
    const configured = Boolean(config.ai.apiKey) && config.ai.provider === 'gemini';
    return {
      provider: config.ai.provider,
      model: config.ai.model,
      configured,
      active: this.isGeminiAvailable(),
      fallback: 'curated_curriculum',
      timeoutMs: config.ai.timeoutMs,
      cacheEntries: this.cache.size,
      questionBankEntries: this.questionBank.size,
      lastError: this.lastGeminiError ? { code: this.lastGeminiError.code } : null
    };
  }

  rememberGeminiError(err) {
    const safe = err instanceof AIProviderError ? err : null;
    this.lastGeminiError = {
      code: safe?.code || 'AI_PROVIDER_ERROR',
      message: safe?.message || 'Gemini request failed.'
    };
    console.warn(`[AI Service] Gemini unavailable (${this.lastGeminiError.code}). Serving verified curated curriculum.`);
  }

  registerQuestions(questions, { rewriteIds = false } = {}) {
    const batchTag = `${this.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    return questions.map((question, index) => {
      const normalized = {
        ...question,
        id: rewriteIds ? `q-g-${batchTag}-${index + 1}` : question.id
      };
      this.questionBank.set(normalized);
      return normalized;
    });
  }

  resolveQuestionAnswer(questionId) {
    const fromBank = this.questionBank.get(questionId);
    if (fromBank) return fromBank;
    return curatedLookup(questionId);
  }

  async generateQuestions({ topic, difficulty = 'beginner', learningObjective, count = 3 }) {
    const cacheKey = this.getCacheKey(topic, difficulty, count, learningObjective);
    const cached = this.getCached(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    if (this.isGeminiAvailable()) {
      try {
        console.log(`[AI Service] Generating questions via Gemini (${config.ai.model})...`);
        const result = await this.geminiProvider.generateQuestions({
          topic,
          difficulty,
          learningObjective,
          count
        });
        const questions = this.registerQuestions(result.questions, { rewriteIds: true });
        const payload = { ...result, questions: questions.map(publicQuestion) };
        this.setCached(cacheKey, payload);
        this.lastGeminiError = null;
        return payload;
      } catch (err) {
        this.rememberGeminiError(err);
      }
    } else {
      this.lastGeminiError = {
        code: config.ai.provider !== 'gemini' ? 'AI_PROVIDER_DISABLED' : 'AI_NOT_CONFIGURED',
        message: 'Gemini is not configured on the server.'
      };
    }

    const fallback = await this.curatedProvider.generateQuestions({ topic, difficulty, count });
    const questions = this.registerQuestions(fallback.questions);
    const payload = {
      ...fallback,
      questions: questions.map(publicQuestion),
      source: 'curated_curriculum',
      degraded: true,
      fallbackReason: this.lastGeminiError?.code || 'AI_UNAVAILABLE'
    };
    this.setCached(cacheKey, payload);
    return payload;
  }

  async generateExplanation({ concept, chosenAnswer, correctAnswer }) {
    if (this.isGeminiAvailable()) {
      try {
        return await this.geminiProvider.generateExplanation({ concept, chosenAnswer, correctAnswer });
      } catch (err) {
        this.rememberGeminiError(err);
      }
    }
    const fallback = await this.curatedProvider.generateExplanation({ concept, chosenAnswer, correctAnswer });
    return {
      ...fallback,
      source: 'curated_curriculum',
      degraded: true,
      fallbackReason: this.lastGeminiError?.code || 'AI_UNAVAILABLE'
    };
  }

  async generateHint({ concept, question }) {
    if (this.isGeminiAvailable()) {
      try {
        return await this.geminiProvider.generateHint({ concept, question });
      } catch (err) {
        this.rememberGeminiError(err);
      }
    }
    const fallback = await this.curatedProvider.generateHint({ concept, question });
    return {
      ...fallback,
      source: 'curated_curriculum',
      degraded: true,
      fallbackReason: this.lastGeminiError?.code || 'AI_UNAVAILABLE'
    };
  }

  async generateRemedialQuestion({ concept, difficulty }) {
    if (this.isGeminiAvailable()) {
      try {
        const result = await this.geminiProvider.generateRemedialQuestion({ concept, difficulty });
        const [question] = this.registerQuestions([result], { rewriteIds: true });
        return publicQuestion(question);
      } catch (err) {
        this.rememberGeminiError(err);
      }
    }
    const fallback = await this.curatedProvider.generateRemedialQuestion({ concept, difficulty });
    const [question] = this.registerQuestions([fallback]);
    return {
      ...publicQuestion(question),
      source: 'curated_curriculum',
      degraded: true,
      fallbackReason: this.lastGeminiError?.code || 'AI_UNAVAILABLE'
    };
  }
}

export const aiService = new AIService();
