import test from 'node:test';
import assert from 'node:assert/strict';
import { GeminiProvider, AIProviderError } from '../src/services/ai/gemini-provider.js';
import { AIService } from '../src/services/ai/index.js';

function makeQuestion(index = 0) {
  return {
    id: `q-${index + 1}`,
    concept: 'blocks',
    type: 'multiple_choice',
    question: 'What links blocks together cryptographically?',
    options: ['Previous block hash', 'A password', 'A profile picture', 'An email address'],
    correctOptionIndex: 0,
    explanation: 'Each block commits to the previous block hash.',
    hint: 'Think about the chain of hashes.',
    difficultyScore: 2
  };
}

function makeResponse(overrides = {}) {
  return {
    topic: 'Blockchain Fundamentals',
    difficulty: 'beginner',
    questions: [makeQuestion(0)],
    ...overrides
  };
}

function fakeClient(handler) {
  const calls = [];
  return {
    calls,
    models: {
      generateContent(params) {
        const callIndex = calls.length;
        calls.push(params);
        return handler(params, callIndex);
      }
    }
  };
}

test('GeminiProvider returns validated structured questions', async () => {
  const client = fakeClient(() => ({ text: JSON.stringify(makeResponse()) }));
  const provider = new GeminiProvider({ model: 'gemini-3.8-flash', client, maxRetries: 0 });

  const result = await provider.generateQuestions({
    topic: 'Blockchain Fundamentals',
    difficulty: 'beginner',
    count: 1
  });

  assert.equal(result.questions.length, 1);
  assert.equal(result.source, 'gemini:gemini-3.8-flash');
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].model, 'gemini-3.8-flash');
  assert.equal(client.calls[0].config.responseMimeType, 'application/json');
  assert.ok(client.calls[0].config.responseJsonSchema);
  assert.ok(client.calls[0].config.abortSignal);
});

test('GeminiProvider retries transient errors and then succeeds', async () => {
  const client = fakeClient((_, callIndex) => {
    if (callIndex === 0) {
      const err = new Error('quota exhausted');
      err.status = 429;
      throw err;
    }
    return { text: JSON.stringify(makeResponse()) };
  });
  const provider = new GeminiProvider({
    model: 'gemini-3.8-flash',
    client,
    maxRetries: 2,
    retryBaseDelayMs: 1
  });

  const result = await provider.generateQuestions({ topic: 'Blocks', difficulty: 'beginner', count: 1 });
  assert.equal(result.questions.length, 1);
  assert.equal(client.calls.length, 2);
});

test('GeminiProvider rejects malformed JSON after bounded retries', async () => {
  const client = fakeClient(() => ({ text: '{not-json' }));
  const provider = new GeminiProvider({
    model: 'gemini-3.8-flash',
    client,
    maxRetries: 2,
    retryBaseDelayMs: 1
  });

  await assert.rejects(
    () => provider.generateQuestions({ topic: 'Blocks', difficulty: 'beginner', count: 1 }),
    err => err instanceof AIProviderError && err.code === 'AI_MALFORMED_JSON'
  );
  assert.equal(client.calls.length, 3);
});

test('GeminiProvider does not retry authentication failures', async () => {
  const client = fakeClient(() => {
    const err = new Error('API key not valid');
    err.status = 400;
    throw err;
  });
  const provider = new GeminiProvider({
    model: 'gemini-3.8-flash',
    client,
    maxRetries: 2,
    retryBaseDelayMs: 1
  });

  await assert.rejects(
    () => provider.generateQuestions({ topic: 'Blocks', difficulty: 'beginner', count: 1 }),
    err => err instanceof AIProviderError && err.code === 'AI_AUTH_ERROR'
  );
  assert.equal(client.calls.length, 1);
});

test('GeminiProvider rejects empty responses', async () => {
  const client = fakeClient(() => ({ text: '   ' }));
  const provider = new GeminiProvider({ model: 'gemini-3.8-flash', client, maxRetries: 0 });

  await assert.rejects(
    () => provider.generateHint({ concept: 'blocks', question: 'What links blocks?' }),
    err => err instanceof AIProviderError && err.code === 'AI_EMPTY_RESPONSE'
  );
});

test('GeminiProvider enforces a timeout', async () => {
  const client = fakeClient(() => new Promise(() => {}));
  const provider = new GeminiProvider({
    model: 'gemini-3.8-flash',
    client,
    timeoutMs: 20,
    maxRetries: 0
  });

  await assert.rejects(
    () => provider.generateHint({ concept: 'blocks', question: 'What links blocks?' }),
    err => err instanceof AIProviderError && err.code === 'AI_TIMEOUT'
  );
});

test('GeminiProvider validates explanation and hint schemas', async () => {
  const explanationClient = fakeClient(() => ({
    text: JSON.stringify({ explanation: 'Hashes commit to previous blocks.', keyTakeaway: 'Hashes link blocks.' })
  }));
  const explanationProvider = new GeminiProvider({ model: 'gemini-3.8-flash', client: explanationClient, maxRetries: 0 });
  const explanation = await explanationProvider.generateExplanation({
    concept: 'blocks',
    chosenAnswer: 'A password',
    correctAnswer: 'Previous block hash'
  });
  assert.equal(explanation.explanation, 'Hashes commit to previous blocks.');

  const hintClient = fakeClient(() => ({ text: JSON.stringify({ hint: 'Follow the chain of hashes.' }) }));
  const hintProvider = new GeminiProvider({ model: 'gemini-3.8-flash', client: hintClient, maxRetries: 0 });
  const hint = await hintProvider.generateHint({ concept: 'blocks', question: 'What links blocks?' });
  assert.equal(hint.hint, 'Follow the chain of hashes.');
});

test('AIService strips answer keys, registers them server-side, and caches batches', async () => {
  let calls = 0;
  const geminiProvider = {
    async generateQuestions() {
      calls++;
      return {
        topic: 'Blockchain Fundamentals',
        difficulty: 'beginner',
        questions: [makeQuestion(0)],
        source: 'gemini:gemini-3.8-flash'
      };
    }
  };
  const service = new AIService({ geminiProvider, cacheTtlMs: 60000, cacheMaxEntries: 10 });

  const first = await service.generateQuestions({
    topic: 'Blockchain Fundamentals',
    difficulty: 'beginner',
    count: 1
  });
  assert.equal('correctOptionIndex' in first.questions[0], false);
  assert.match(first.questions[0].id, /^q-g-/);

  const answer = service.resolveQuestionAnswer(first.questions[0].id);
  assert.equal(answer.correctOptionIndex, 0);
  assert.equal(answer.options.length, 4);

  const second = await service.generateQuestions({
    topic: 'Blockchain Fundamentals',
    difficulty: 'beginner',
    count: 1
  });
  assert.equal(second.fromCache, true);
  assert.equal(calls, 1);
});

test('AIService reports degraded curated fallback when Gemini fails', async () => {
  const geminiProvider = {
    async generateQuestions() {
      throw new AIProviderError('Gemini is temporarily unavailable.', {
        code: 'AI_UPSTREAM_ERROR',
        retryable: true
      });
    }
  };
  const service = new AIService({ geminiProvider, cacheTtlMs: 60000, cacheMaxEntries: 10 });
  const result = await service.generateQuestions({
    topic: 'Blockchain Fundamentals',
    difficulty: 'beginner',
    count: 2
  });

  assert.equal(result.source, 'curated_curriculum');
  assert.equal(result.degraded, true);
  assert.equal(result.fallbackReason, 'AI_UPSTREAM_ERROR');
  assert.equal(result.questions.length, 2);
  assert.equal('correctOptionIndex' in result.questions[0], false);
  assert.ok(service.resolveQuestionAnswer(result.questions[0].id));
});
