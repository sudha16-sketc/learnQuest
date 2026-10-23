import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/index.js';

test('LearnQuest API Integration Tests', async (t) => {
  let authToken = '';
  let userId = '';
  let sessionId = '';
  const testEmail = `student_${Date.now()}@learnquest.io`;
  const testUsername = `explorer_${Date.now()}`;
  const testPassword = 'Password123!';

  await t.test('GET /health returns healthy status and MST network details', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.service, 'LearnQuest API');
    assert.ok(res.body.mstNetwork);
    assert.ok(res.body.chainId);
  });

  await t.test('POST /api/auth/register creates a new student user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: testPassword
      });

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
      .send({
        email: testEmail,
        username: testUsername,
        password: testPassword
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/auth/login authenticates student and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        login: testEmail,
        password: testPassword
      });

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

  await t.test('GET /api/topics returns available blockchain learning topics', async () => {
    const res = await request(app).get('/api/topics');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.topics));
    assert.ok(res.body.topics.length > 0);
  });

  await t.test('POST /api/ai/questions generates structured questions with fallback', async () => {
    const res = await request(app)
      .post('/api/ai/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        topic: 'Blockchain Fundamentals',
        difficulty: 'beginner',
        count: 2
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.questions);
    assert.equal(res.body.data.questions.length, 2);
    assert.equal(res.body.data.questions[0].options.length, 4);
  });

  await t.test('POST /api/learning/sessions starts an active learning session', async () => {
    const res = await request(app)
      .post('/api/learning/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        topicId: 'blockchain-fundamentals',
        difficulty: 'beginner'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.session.id);
    sessionId = res.body.session.id;
  });

  await t.test('POST /api/learning/sessions/:id/answers validates answer, awards XP, and enforces idempotency', async () => {
    const idempotencyKey = `idem-${Date.now()}`;
    const answerPayload = {
      questionId: 'q-begin-001',
      concept: 'blocks',
      chosenOption: 0,
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

    // Replay same idempotency request
    const res2 = await request(app)
      .post(`/api/learning/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-idempotency-key', idempotencyKey)
      .send(answerPayload);

    assert.equal(res2.status, 200);
    assert.equal(res2.body.idempotencyKey, idempotencyKey);
  });

  await t.test('GET /api/blockchain/config returns MST network and contract addresses', async () => {
    const res = await request(app).get('/api/blockchain/config');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.network.chainId);
    assert.ok(res.body.contracts.token);
  });
});
