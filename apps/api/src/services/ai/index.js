import { config } from '../../config/index.js';
import { GeminiProvider, AIProviderError } from './gemini-provider.js';
import {
  CuratedProvider,
  CURATED_BLOCKCHAIN_CURRICULUM,
  CURATED_BOSS_QUESTIONS,
  getBossQuestion
} from './curated-provider.js';

const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_CACHE_MAX_ENTRIES = 200;

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

/**
 * Deterministic Fisher-Yates shuffle using a simple seeded PRNG derived from
 * the question id string. This guarantees the same shuffle for the same
 * question every time (stable across server restarts) while keeping correct
 * answer position unpredictable to clients.
 */
function seededRandom(seed) {
  // Convert string seed to a 32-bit integer via djb2 hash
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  // Mulberry32 PRNG
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleQuestionOptions(question) {
  if (
    !question ||
    !Array.isArray(question.options) ||
    !Number.isInteger(question.correctOptionIndex)
  ) {
    return question;
  }

  const options = [...question.options];
  const rand = seededRandom(String(question.id));
  const indices = options.map((_, i) => i);

  // Fisher-Yates shuffle using seeded PRNG
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffledOptions = indices.map(i => options[i]);
  const newCorrectIndex = indices.indexOf(question.correctOptionIndex);

  return { ...question, options: shuffledOptions, correctOptionIndex: newCorrectIndex };
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
  for (const boss of Object.values(CURATED_BOSS_QUESTIONS)) {
    if (boss.id === questionId) return clone(boss);
  }
  const bossMatch = /^q-boss-(\d+)$/.exec(questionId);
  if (bossMatch) return clone(getBossQuestion(Number(bossMatch[1])));
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
      const withId = {
        ...question,
        id: rewriteIds ? `q-g-${batchTag}-${index + 1}` : question.id
      };
      // Shuffle options deterministically so the correct answer is never always index 0.
      // The shuffled correctOptionIndex is what gets stored server-side for validation.
      const normalized = shuffleQuestionOptions(withId);
      this.questionBank.set(normalized);
      return normalized;
    });
  }

  resolveQuestionAnswer(questionId) {
    const fromBank = this.questionBank.get(questionId);
    if (fromBank) return fromBank;

    // The bank entry may have expired while a client still holds the issued
    // (already shuffled) question. Re-derive the exact same deterministic
    // shuffle so validation stays aligned with what the client displayed.
    const curated = curatedLookup(questionId);
    return curated ? shuffleQuestionOptions(curated) : null;
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

        // Gemini occasionally returns fewer items than requested. Top up from
        // the curated pool so every level always has its full question set.
        if (questions.length < count) {
          const usedText = new Set(questions.map(question => question.question));
          const fallback = await this.curatedProvider.generateQuestions({
            topic,
            difficulty,
            count: Math.min(CURATED_BLOCKCHAIN_CURRICULUM[difficulty]?.length || count, count + usedText.size)
          });
          const extras = fallback.questions
            .filter(question => !usedText.has(question.question))
            .slice(0, count - questions.length);
          if (extras.length) {
            questions.push(...this.registerQuestions(extras, { rewriteIds: true }));
          }
        }

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

  async generateBossQuestion({ levelNumber = 1 }) {
    const result = await this.curatedProvider.generateBossQuestion({ levelNumber });
    const [question] = this.registerQuestions([result]);
    return {
      ...publicQuestion(question),
      source: 'curated_curriculum',
      degraded: true,
      fallbackReason: this.lastGeminiError?.code || 'AI_UNAVAILABLE',
      isBoss: true
    };
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

export { shuffleQuestionOptions, publicQuestion };
