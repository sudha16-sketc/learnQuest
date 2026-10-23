import { config } from '../../config/index.js';
import { OllamaProvider } from './ollama-provider.js';
import { CuratedProvider } from './curated-provider.js';

export class AIService {
  constructor() {
    this.ollamaProvider = new OllamaProvider({
      baseUrl: config.ai.ollamaBaseUrl,
      model: config.ai.ollamaModel,
      timeoutMs: config.ai.timeoutMs
    });
    this.curatedProvider = new CuratedProvider();
    this.cache = new Map();
  }

  getCacheKey(topic, difficulty, count) {
    return `${topic.toLowerCase()}:${difficulty}:${count}`;
  }

  async generateQuestions({ topic, difficulty = 'beginner', learningObjective, count = 3 }) {
    const cacheKey = this.getCacheKey(topic, difficulty, count);
    if (this.cache.has(cacheKey)) {
      return {
        ...this.cache.get(cacheKey),
        fromCache: true
      };
    }

    if (config.ai.provider === 'ollama') {
      try {
        console.log(`[AI Service] Attempting inference via Ollama (${config.ai.ollamaModel} at ${config.ai.ollamaBaseUrl})...`);
        const result = await this.ollamaProvider.generateQuestions({
          topic,
          difficulty,
          learningObjective,
          count
        });
        this.cache.set(cacheKey, result);
        return result;
      } catch (err) {
        console.warn(`[AI Service] Ollama inference failed or unavailable (${err.message}). Seamlessly engaging verified curated curriculum.`);
      }
    }

    // Curated verified fallback
    const result = await this.curatedProvider.generateQuestions({ topic, difficulty, count });
    this.cache.set(cacheKey, result);
    return result;
  }

  async generateExplanation({ concept, chosenAnswer, correctAnswer }) {
    try {
      if (config.ai.provider === 'ollama') {
        return await this.ollamaProvider.generateExplanation({ concept, chosenAnswer, correctAnswer });
      }
    } catch (e) {
      console.warn('[AI Service] Ollama explanation failed, falling back.');
    }
    return this.curatedProvider.generateExplanation({ concept, chosenAnswer, correctAnswer });
  }

  async generateHint({ concept, question }) {
    try {
      if (config.ai.provider === 'ollama') {
        return await this.ollamaProvider.generateHint({ concept, question });
      }
    } catch (e) {
      console.warn('[AI Service] Ollama hint generation failed, falling back.');
    }
    return this.curatedProvider.generateHint({ concept, question });
  }

  async generateRemedialQuestion({ concept, difficulty }) {
    try {
      if (config.ai.provider === 'ollama') {
        return await this.ollamaProvider.generateRemedialQuestion({ concept, difficulty });
      }
    } catch (e) {
      console.warn('[AI Service] Ollama remedial question failed, falling back.');
    }
    return this.curatedProvider.generateRemedialQuestion({ concept, difficulty });
  }
}

export const aiService = new AIService();
