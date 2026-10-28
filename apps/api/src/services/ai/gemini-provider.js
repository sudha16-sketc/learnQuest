import { GoogleGenAI } from '@google/genai';
import { IAIProvider } from './ai-provider.interface.js';
import {
  QuestionGenerationResponseSchema,
  QuestionItemSchema,
  ExplanationResponseSchema,
  HintResponseSchema
} from '@learnquest/validation';

export class AIProviderError extends Error {
  constructor(message, { code = 'AI_PROVIDER_ERROR', statusCode = 502, retryable = false, cause } = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.cause = cause;
  }
}

const QUESTION_ITEM_JSON_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'A short unique identifier for the question.' },
    concept: { type: 'string', description: 'A concise concept name, using snake_case where helpful.' },
    type: { type: 'string', enum: ['multiple_choice'] },
    question: { type: 'string', description: 'A clear, engaging multiple-choice question.' },
    options: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: { type: 'string' },
      description: 'Exactly four plausible answer options.'
    },
    correctOptionIndex: {
      type: 'integer',
      minimum: 0,
      maximum: 3,
      description: 'Zero-based index of the correct option.'
    },
    explanation: { type: 'string', description: 'A concise explanation of the correct answer.' },
    hint: { type: 'string', description: 'A helpful hint that does not reveal the exact answer.' },
    difficultyScore: { type: 'integer', minimum: 1, maximum: 10 }
  },
  required: [
    'id',
    'concept',
    'type',
    'question',
    'options',
    'correctOptionIndex',
    'explanation',
    'hint',
    'difficultyScore'
  ]
};

const QUESTIONS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
    questions: {
      type: 'array',
      items: QUESTION_ITEM_JSON_SCHEMA
    }
  },
  required: ['topic', 'difficulty', 'questions']
};

const EXPLANATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    explanation: { type: 'string' },
    keyTakeaway: { type: 'string' }
  },
  required: ['explanation', 'keyTakeaway']
};

const HINT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    hint: { type: 'string' }
  },
  required: ['hint']
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function asStatus(err) {
  const raw = err?.status ?? err?.statusCode ?? err?.code;
  const status = Number(raw);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

function classifyProviderError(err) {
  if (err instanceof AIProviderError) return err;

  const status = asStatus(err);
  const rawMessage = String(err?.message || '');
  const lower = rawMessage.toLowerCase();

  if (err?.name === 'AbortError' || lower.includes('abort')) {
    return new AIProviderError('Gemini request timed out. Please try again.', {
      code: 'AI_TIMEOUT',
      statusCode: 504,
      retryable: true,
      cause: err
    });
  }

  if (status === 401 || status === 403 || lower.includes('api key') || lower.includes('permission')) {
    return new AIProviderError('Gemini authentication failed. Check the server GEMINI_API_KEY configuration.', {
      code: 'AI_AUTH_ERROR',
      statusCode: 502,
      retryable: false,
      cause: err
    });
  }

  if (status === 404 || lower.includes('model not found') || lower.includes('not supported')) {
    return new AIProviderError('The configured Gemini model is unavailable. Check GEMINI_MODEL.', {
      code: 'AI_MODEL_NOT_FOUND',
      statusCode: 502,
      retryable: false,
      cause: err
    });
  }

  if (status === 429 || lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted')) {
    return new AIProviderError('Gemini rate limit or quota exceeded. Please try again later.', {
      code: 'AI_RATE_LIMIT',
      statusCode: 503,
      retryable: true,
      cause: err
    });
  }

  if (status === 400) {
    return new AIProviderError('Gemini rejected the request. Check the server AI configuration.', {
      code: 'AI_BAD_REQUEST',
      statusCode: 502,
      retryable: false,
      cause: err
    });
  }

  if (status !== null && status >= 500) {
    return new AIProviderError('Gemini is temporarily unavailable. Please try again.', {
      code: 'AI_UPSTREAM_ERROR',
      statusCode: 503,
      retryable: true,
      cause: err
    });
  }

  return new AIProviderError('Gemini request failed. Please try again.', {
    code: 'AI_PROVIDER_ERROR',
    statusCode: 502,
    retryable: true,
    cause: err
  });
}

export class GeminiProvider extends IAIProvider {
  constructor({
    apiKey,
    model,
    timeoutMs = 20000,
    maxRetries = 2,
    client,
    retryBaseDelayMs = 350
  } = {}) {
    super();
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.maxRetries = Math.max(0, maxRetries);
    this.retryBaseDelayMs = retryBaseDelayMs;

    if (client) {
      this.client = client;
    } else {
      if (!apiKey) {
        throw new AIProviderError('Gemini API key is not configured on the server.', {
          code: 'AI_NOT_CONFIGURED',
          statusCode: 503,
          retryable: false
        });
      }
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  sanitizeInput(text, maxLength = 150) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/[`{}[\]<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
  }

  async callGemini({ prompt, systemInstruction, schema, temperature = 0.35 }) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      let timeoutId;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            reject(new AIProviderError('Gemini request timed out. Please try again.', {
              code: 'AI_TIMEOUT',
              statusCode: 504,
              retryable: true
            }));
          }, this.timeoutMs);
        });

        const request = this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
            abortSignal: controller.signal
          }
        });

        const response = await Promise.race([request, timeoutPromise]);
        const text = typeof response?.text === 'string' ? response.text.trim() : '';

        if (!text) {
          throw new AIProviderError('Gemini returned an empty response.', {
            code: 'AI_EMPTY_RESPONSE',
            statusCode: 502,
            retryable: true
          });
        }

        const cleaned = text
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (parseErr) {
          throw new AIProviderError('Gemini returned malformed JSON.', {
            code: 'AI_MALFORMED_JSON',
            statusCode: 502,
            retryable: true,
            cause: parseErr
          });
        }

        return parsed;
      } catch (err) {
        lastError = classifyProviderError(err);
        if (!lastError.retryable || attempt >= this.maxRetries) {
          throw lastError;
        }
        const delay = this.retryBaseDelayMs * (2 ** attempt) + Math.floor(Math.random() * 100);
        await sleep(delay);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError || new AIProviderError('Gemini request failed.');
  }

  validate(schema, data, operation) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const details = parsed.error.issues
        .slice(0, 3)
        .map(issue => `${issue.path.join('.') || 'response'}: ${issue.message}`)
        .join('; ');
      throw new AIProviderError(`Gemini returned a response that failed ${operation} validation (${details}).`, {
        code: 'AI_INVALID_RESPONSE',
        statusCode: 502,
        retryable: true
      });
    }
    return parsed.data;
  }

  async generateQuestions({ topic, difficulty = 'beginner', learningObjective = '', count = 3 }) {
    const cleanTopic = this.sanitizeInput(topic, 120);
    const cleanObjective = this.sanitizeInput(learningObjective, 180);
    const safeCount = Math.min(Math.max(Number(count) || 3, 1), 13);

    const systemInstruction = `You are an expert interactive educational game AI for LearnQuest.
Create accurate, original multiple-choice questions. Never include markdown or commentary.
Every question must have exactly four distinct options and exactly one correct answer.
Vary the position of the correct answer; do not always put it first.
Keep explanations and hints concise and pedagogically useful.`;

    const prompt = `Generate exactly ${safeCount} multiple-choice questions on the topic "${cleanTopic}" at "${difficulty}" difficulty.
Learning objective: ${cleanObjective || 'Master core concepts through interactive gameplay'}.
Return JSON with topic, difficulty, and a questions array. The id field must be unique within this batch.`;

    const schema = {
      ...QUESTIONS_JSON_SCHEMA,
      properties: {
        ...QUESTIONS_JSON_SCHEMA.properties,
        questions: {
          ...QUESTIONS_JSON_SCHEMA.properties.questions,
          minItems: safeCount,
          maxItems: safeCount
        }
      }
    };

    const raw = await this.callGemini({ prompt, systemInstruction, schema, temperature: 0.4 });
    const validated = this.validate(QuestionGenerationResponseSchema, raw, 'question generation');

    if (validated.questions.length !== safeCount) {
      throw new AIProviderError('Gemini returned an unexpected number of questions.', {
        code: 'AI_INVALID_RESPONSE',
        statusCode: 502,
        retryable: true
      });
    }

    return {
      ...validated,
      topic: validated.topic || cleanTopic,
      difficulty,
      source: `gemini:${this.model}`
    };
  }

  async generateExplanation({ concept, chosenAnswer, correctAnswer }) {
    const cleanConcept = this.sanitizeInput(concept, 120);
    const prompt = `A student answered a question about "${cleanConcept}".
They incorrectly selected: "${this.sanitizeInput(chosenAnswer, 120)}".
The correct answer is: "${this.sanitizeInput(correctAnswer, 120)}".
Explain in two friendly, educational sentences why their choice is incorrect and clarify the core concept.
Return JSON: {"explanation":"...","keyTakeaway":"..."}.`;

    const raw = await this.callGemini({
      prompt,
      systemInstruction: 'You are an encouraging educational coach. Return only the requested JSON object.',
      schema: EXPLANATION_JSON_SCHEMA,
      temperature: 0.3
    });

    return {
      ...this.validate(ExplanationResponseSchema, raw, 'explanation generation'),
      source: `gemini:${this.model}`
    };
  }

  async generateHint({ concept, question }) {
    const cleanConcept = this.sanitizeInput(concept, 120);
    const cleanQuestion = this.sanitizeInput(question, 300);
    const prompt = `Give a short one-sentence hint for this question on "${cleanConcept}": "${cleanQuestion}".
The hint must help the learner reason without revealing the exact answer.
Return JSON: {"hint":"..."}.`;

    const raw = await this.callGemini({
      prompt,
      systemInstruction: 'You are a helpful educational tutor. Return only the requested JSON object.',
      schema: HINT_JSON_SCHEMA,
      temperature: 0.3
    });

    return {
      ...this.validate(HintResponseSchema, raw, 'hint generation'),
      source: `gemini:${this.model}`
    };
  }

  async generateRemedialQuestion({ concept, difficulty = 'beginner' }) {
    const cleanConcept = this.sanitizeInput(concept, 120);
    const prompt = `Create one alternative multiple-choice question that tests the concept "${cleanConcept}" at "${difficulty}" difficulty.
Use a fresh scenario rather than repeating the original question.
Return only the question object with id, concept, type, question, options, correctOptionIndex, explanation, hint, and difficultyScore.`;

    const raw = await this.callGemini({
      prompt,
      systemInstruction: 'You are an educational assessment designer. Return only the requested JSON object.',
      schema: QUESTION_ITEM_JSON_SCHEMA,
      temperature: 0.5
    });

    return {
      ...this.validate(QuestionItemSchema, raw, 'remedial question generation'),
      source: `gemini:${this.model}`
    };
  }
}
