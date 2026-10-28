import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { ethers } from 'ethers';

process.env.AI_PROVIDER = 'curated';
process.env.GEMINI_API_KEY = '';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/index.js');
const { aiService } = await import('../src/services/ai/index.js');

test('LearnQuest API integration tests (shared web/mobile contract)', async (t) => {
  let authToken = '';
  let userId = '';
  let sessionId = '';
  const testEmail = `student_${Date.now()}@learnquest.io`;
  const testUsername = `explorer_${Date.now()}`;
  const testPassword = 'Password123!';

  await t.test('GET /health reports database and AI status without secrets', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.service, 'LearnQuest API');
    assert.ok(res.body.mstNetwork);
    assert.ok(res.body.chainId);
    assert.ok(['postgresql', 'in-memory'].includes(res.body.database.mode));
    assert.equal(res.body.ai.provider, 'curated');
    assert.equal(JSON.stringify(res.body).includes('apiKey'), false);
  });

  await t.test('POST /api/auth/register creates a new student user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, username: testUsername, password: testPassword });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmail);
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  await t.test('POST /api/auth/register rejects duplicate email or username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, username: testUsername, password: testPassword });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/auth/login authenticates student and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: testEmail, password: testPassword });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
  });

  await t.test('GET /api/auth/me returns authenticated student profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.id, userId);
  });

  await t.test('GET /api/topics returns topics with level metadata', async () => {
    const res = await request(app).get('/api/topics');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.topics));
    assert.ok(res.body.topics.length > 0);
    assert.ok(Array.isArray(res.body.topics[0].levels));
  });

  await t.test('GET /api/ai/status returns safe provider metadata', async () => {
    const res = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.ai.provider, 'curated');
    assert.equal(res.body.ai.fallback, 'curated_curriculum');
  });

  await t.test('POST /api/ai/questions returns validated questions without answer keys', async () => {
    const res = await request(app)
      .post('/api/ai/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ topic: 'Blockchain Fundamentals', difficulty: 'beginner', count: 2 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.questions);
    assert.equal(res.body.data.questions.length, 2);
    assert.equal(res.body.data.questions[0].options.length, 4);
    assert.equal('correctOptionIndex' in res.body.data.questions[0], false);
    assert.equal(res.body.data.degraded, true);
    assert.equal(res.body.data.source, 'curated_curriculum');
  });

  await t.test('POST /api/ai/questions can issue a full 13-question level set', async () => {
    const res = await request(app)
      .post('/api/ai/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ topic: 'Blockchain Fundamentals', difficulty: 'advanced', count: 13 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.questions.length, 13);
    const ids = new Set(res.body.data.questions.map(question => question.id));
    assert.equal(ids.size, 13);
    res.body.data.questions.forEach(question => {
      assert.equal('correctOptionIndex' in question, false);
      assert.equal(question.options.length, 4);
    });
  });

  await t.test('POST /api/ai/boss-question returns a boss question without its answer key', async () => {
    const res = await request(app)
      .post('/api/ai/boss-question')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ levelNumber: 3, difficulty: 'intermediate' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.question.isBoss, true);
    assert.equal(res.body.data.question.id, 'q-boss-003');
    assert.equal('correctOptionIndex' in res.body.data.question, false);
    assert.equal(res.body.data.question.options.length, 4);
  });

  await t.test('POST /api/ai/hints and explanations use a validated fallback', async () => {
    const hintRes = await request(app)
      .post('/api/ai/hints')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ concept: 'blocks', question: 'What is in a block?' });
    assert.equal(hintRes.status, 200);
    assert.ok(hintRes.body.data.hint.length > 3);

    const explanationRes = await request(app)
      .post('/api/ai/explanations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ concept: 'blocks', chosenAnswer: 'Wrong', correctAnswer: 'Right' });
    assert.equal(explanationRes.status, 200);
    assert.ok(explanationRes.body.data.explanation.length > 5);
  });

  await t.test('POST /api/learning/sessions starts an active learning session', async () => {
    const res = await request(app)
      .post('/api/learning/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ topicId: 'blockchain-fundamentals', difficulty: 'beginner' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.session.id);
    sessionId = res.body.session.id;
  });

  await t.test('Answer validation rejects a question that is not in the verified bank', async () => {
    const res = await request(app)
      .post(`/api/learning/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        questionId: 'unknown-question',
        concept: 'blocks',
        chosenOption: 0,
        hintsUsed: 0,
        timeSpentMs: 1000,
        idempotencyKey: `unknown-${Date.now()}`
      });
    assert.equal(res.status, 409);
  });

  await t.test('Incorrect answer returns the shuffled correct index, explanation, and no XP', async () => {
    // The server shuffles options deterministically per question. Read the
    // authoritative shuffled answer key the same way validation does so this
    // test never depends on the original authored option order.
    const resolved = aiService.resolveQuestionAnswer('q-begin-002');
    const chosenOption = (resolved.correctOptionIndex + 1) % resolved.options.length;

    const res = await request(app)
      .post(`/api/learning/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        questionId: 'q-begin-002',
        concept: 'hashing',
        chosenOption,
        hintsUsed: 0,
        timeSpentMs: 3400,
        idempotencyKey: `wrong-${Date.now()}`
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.isCorrect, false);
    assert.equal(res.body.correctOptionIndex, resolved.correctOptionIndex);
    assert.equal(res.body.xpAwarded, 0);
    assert.ok(res.body.explanation);
  });

  await t.test('Correct answer awards XP and enforces answer idempotency', async () => {
    const idempotencyKey = `idem-${Date.now()}`;
    const resolved = aiService.resolveQuestionAnswer('q-begin-001');
    const answerPayload = {
      questionId: 'q-begin-001',
      concept: 'blocks',
      chosenOption: resolved.correctOptionIndex,
      hintsUsed: 0,
      timeSpentMs: 4500,
      idempotencyKey
    };

    const res1 = await request(app)
      .post(`/api/learning/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-idempotency-key', idempotencyKey)
      .send(answerPayload);

    assert.equal(res1.status, 200);
    assert.equal(res1.body.success, true);
    assert.equal(res1.body.isCorrect, true);
    assert.equal(res1.body.xpAwarded, 10);
    assert.equal(res1.body.tokensEntitled, '1.00');

    const res2 = await request(app)
      .post(`/api/learning/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-idempotency-key', idempotencyKey)
      .send(answerPayload);

    assert.equal(res2.status, 200);
    assert.equal(res2.body.idempotencyKey, idempotencyKey);
    assert.equal(res2.body.xpAwarded, 10);
  });

  await t.test('Duplicate submissions with a new idempotency key cannot farm XP', async () => {
    const resolved = aiService.resolveQuestionAnswer('q-begin-001');
    const res = await request(app)
      .post(`/api/learning/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        questionId: 'q-begin-001',
        concept: 'blocks',
        chosenOption: resolved.correctOptionIndex,
        hintsUsed: 0,
        timeSpentMs: 4500,
        idempotencyKey: `duplicate-${Date.now()}`
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.alreadyAnswered, true);
    assert.equal(res.body.xpAwarded, 0);
  });

  await t.test('POST complete awards bonus once and is idempotent', async () => {
    const first = await request(app)
      .post(`/api/learning/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(first.status, 200);
    assert.equal(first.body.bonusXP, 50);
    assert.equal(first.body.bonusTokens, '5.00');

    const second = await request(app)
      .post(`/api/learning/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(second.status, 200);
    assert.equal(second.body.alreadyCompleted, true);
    assert.equal(second.body.bonusXP, 0);
  });

  await t.test('GET progress reflects XP and completed levels for the same account', async () => {
    const res = await request(app)
      .get('/api/learning/progress')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.progress.totalXP, 60);
    assert.equal(res.body.progress.completedLevels, 1);
    assert.equal(res.body.progress.playerLevel, 1);
  });

  await t.test('GET rewards balance and pending entitlements reflect persisted rewards', async () => {
    const balanceRes = await request(app)
      .get('/api/rewards/balance')
      .set('Authorization', `Bearer ${authToken}`);
    assert.equal(balanceRes.status, 200);
    assert.equal(balanceRes.body.balance.gameplayXP, 60);
    assert.equal(balanceRes.body.balance.pendingClaimableTokens, '6.00');

    const pendingRes = await request(app)
      .get('/api/rewards/pending')
      .set('Authorization', `Bearer ${authToken}`);
    assert.equal(pendingRes.status, 200);
    assert.equal(pendingRes.body.pending.length, 2);

    const ledgerRes = await request(app)
      .get('/api/rewards/ledger')
      .set('Authorization', `Bearer ${authToken}`);
    assert.equal(ledgerRes.status, 200);
    assert.ok(ledgerRes.body.ledger.length >= 2);
  });

  await t.test('Wallet challenge/signature linking and signed voucher issuance work', async () => {
    const wallet = ethers.Wallet.createRandom();
    const challengeRes = await request(app)
      .post('/api/auth/wallet-challenge')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ address: wallet.address, chainId: 91562037 });

    assert.equal(challengeRes.status, 200);
    const signature = await wallet.signMessage(challengeRes.body.challenge);

    const linkRes = await request(app)
      .post('/api/auth/link-wallet')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ address: wallet.address, signature, challenge: challengeRes.body.challenge });
    assert.equal(linkRes.status, 200);
    assert.equal(linkRes.body.wallet.address, wallet.address.toLowerCase());
    assert.equal(linkRes.body.wallet.address.toLowerCase(), wallet.address.toLowerCase());

    const pendingRes = await request(app)
      .get('/api/rewards/pending')
      .set('Authorization', `Bearer ${authToken}`);
    const entitlementId = pendingRes.body.pending[0].id;

    const voucherRes = await request(app)
      .post('/api/rewards/claim-voucher')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ entitlementId });

    assert.equal(voucherRes.status, 200);
    assert.equal(voucherRes.body.voucher.user, wallet.address.toLowerCase());
    assert.ok(voucherRes.body.voucher.signature.startsWith('0x'));
  });

  await t.test('GET /api/store/items returns catalog and auth is required', async () => {
    const unauthorized = await request(app).get('/api/store/items');
    assert.equal(unauthorized.status, 401);

    const res = await request(app)
      .get('/api/store/items')
      .set('Authorization', `Bearer ${authToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.items.length >= 4);
  });

  await t.test('GET /api/blockchain/config returns MST network and contract addresses', async () => {
    const res = await request(app).get('/api/blockchain/config');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.network.chainId);
    assert.ok(res.body.contracts.token);
  });
});
