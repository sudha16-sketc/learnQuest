import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AI_PROVIDER = 'curated';
process.env.GEMINI_API_KEY = '';

const {
  AIService,
  shuffleQuestionOptions,
  publicQuestion
} = await import('../src/services/ai/index.js');
const {
  CURATED_BLOCKCHAIN_CURRICULUM,
  getBossQuestion
} = await import('../src/services/ai/curated-provider.js');

test('answer randomization keeps the same layout for the same question id', () => {
  const source = CURATED_BLOCKCHAIN_CURRICULUM.beginner[0];
  const first = shuffleQuestionOptions(source);
  const second = shuffleQuestionOptions(source);

  assert.deepEqual(first, second);
  assert.notStrictEqual(first.options, source.options);
  assert.deepEqual([...first.options].sort(), [...source.options].sort());
  assert.equal(first.options[first.correctOptionIndex], source.options[source.correctOptionIndex]);
});

test('answer randomization distributes correct answers across all four positions', () => {
  const positions = new Set();
  for (const pool of Object.values(CURATED_BLOCKCHAIN_CURRICULUM)) {
    for (const question of pool) {
      const shuffled = shuffleQuestionOptions(question);
      assert.ok(Number.isInteger(shuffled.correctOptionIndex));
      assert.ok(shuffled.correctOptionIndex >= 0 && shuffled.correctOptionIndex <= 3);
      positions.add(shuffled.correctOptionIndex);
    }
  }
  assert.equal(positions.size, 4);
});

test('public questions never expose the correct answer key', () => {
  const shuffled = shuffleQuestionOptions(CURATED_BLOCKCHAIN_CURRICULUM.beginner[1]);
  const safe = publicQuestion(shuffled);

  assert.equal('correctOptionIndex' in safe, false);
  assert.equal(safe.id, shuffled.id);
  assert.deepEqual(safe.options, shuffled.options);
});

test('registered questions resolve to the same shuffled answer key', () => {
  const service = new AIService({ geminiProvider: null });
  const [registered] = service.registerQuestions([CURATED_BLOCKCHAIN_CURRICULUM.beginner[2]]);
  const resolved = service.resolveQuestionAnswer(registered.id);

  assert.equal(resolved.id, registered.id);
  assert.equal(resolved.correctOptionIndex, registered.correctOptionIndex);
  assert.deepEqual(resolved.options, registered.options);
});

test('expired bank entries fall back to the identical deterministic shuffle', () => {
  const service = new AIService({ geminiProvider: null });
  const source = CURATED_BLOCKCHAIN_CURRICULUM.beginner[3];
  const expected = shuffleQuestionOptions(source);

  const resolved = service.resolveQuestionAnswer(source.id);
  assert.equal(resolved.correctOptionIndex, expected.correctOptionIndex);
  assert.deepEqual(resolved.options, expected.options);
});

test('boss questions are shuffled and resolvable by id', async () => {
  const service = new AIService({ geminiProvider: null });
  const boss = await service.generateBossQuestion({ levelNumber: 4 });
  const resolved = service.resolveQuestionAnswer(boss.id);
  const authored = getBossQuestion(4);

  assert.equal('correctOptionIndex' in boss, false);
  assert.equal(resolved.id, boss.id);
  assert.ok(Number.isInteger(resolved.correctOptionIndex));
  assert.equal(resolved.options[resolved.correctOptionIndex], authored.options[authored.correctOptionIndex]);
  assert.deepEqual(resolved.options, boss.options);
});

test('malformed questions are returned untouched instead of throwing', () => {
  const invalid = { id: 'broken', options: ['only-one'] };
  assert.equal(shuffleQuestionOptions(invalid), invalid);
  assert.equal(shuffleQuestionOptions(null), null);
});
