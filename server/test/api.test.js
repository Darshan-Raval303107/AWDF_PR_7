process.env.NODE_ENV = 'test';

import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { aiRateLimitCache } from '../routes/aiRoutes.js';

const { default: app } = await import('../server.js');

describe('API Endpoints Automated Test Suite', () => {
  const originalFetch = globalThis.fetch;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const testSecret = process.env.JWT_SECRET || 'test_jwt_secret_for_tests';
  process.env.JWT_SECRET = testSecret;

  const user1Id = '507f1f77bcf86cd799439011';
  const user2Id = '507f1f77bcf86cd799439022';

  const validTokenUser1 = jwt.sign(
    { id: user1Id, email: 'user1@example.com' },
    testSecret,
    { expiresIn: '1h' }
  );

  const validTokenUser2 = jwt.sign(
    { id: user2Id, email: 'user2@example.com' },
    testSecret,
    { expiresIn: '1h' }
  );

  const mockSuccessfulGeminiResponse = (text) => {
    return async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text }]
              }
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
  };

  before(() => {
    // Mock User.findById so authenticated route tests do not depend on a live MongoDB connection
    mock.method(User, 'findById', (id) => ({
      select: () =>
        Promise.resolve({
          _id: id || user1Id,
          email: `${id || user1Id}@example.com`
        })
    }));
  });

  after(() => {
    globalThis.fetch = originalFetch;
    if (originalGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    aiRateLimitCache.flushAll();
    mock.reset();
  });

  // --- Existing Practical 7-12 tests preserved ---
  it('GET /health returns HTTP 200 and expected health status', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'Server running');
    assert.strictEqual(res.body.database, 'AWDF_PR_7');
    assert.strictEqual(typeof res.body.dbConnected, 'boolean');
  });

  it('GET /api/tasks without Authorization header returns HTTP 401 and authentication error', async () => {
    const res = await request(app).get('/api/tasks');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Access denied. Missing or malformed token.');
  });

  // --- Practical 13 AI Integration (Gemini) tests with mocked external requests ---
  it('POST /api/ai/generate-description without Authorization header returns HTTP 401', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Deploy to Cloud' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Access denied. Missing or malformed token.');
  });

  it('POST /api/ai/generate-description with missing title returns HTTP 400', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validTokenUser1}`)
      .send({ title: '' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Task title is required.');
  });

  it('POST /api/ai/generate-description when GEMINI_API_KEY is missing returns HTTP 500', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validTokenUser1}`)
      .send({ title: 'Deploy to Cloud' });
    assert.strictEqual(res.status, 500);
    assert.match(res.body.error, /Gemini API key is not configured/);
  });

  it('POST /api/ai/generate-description returns HTTP 502 when Gemini API returns an upstream error', async () => {
    process.env.GEMINI_API_KEY = 'mock_test_key';
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded' }
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );

    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validTokenUser1}`)
      .send({ title: 'Deploy to Cloud' });

    assert.strictEqual(res.status, 502);
    assert.strictEqual(
      res.body.error,
      'AI service request failed. Please verify API key, billing, or try again later.'
    );
  });

  it('POST /api/ai/generate-description returns HTTP 200 with complete description on Gemini success', async () => {
    process.env.GEMINI_API_KEY = 'mock_test_key';
    const mockGeneratedText =
      'Review core React concepts including state management, props, and hooks. Practice building responsive components with Vite and test them thoroughly. Ensure all lifecycle methods and performance optimizations are understood before the exam.';

    globalThis.fetch = async (url, options) => {
      assert.ok(String(url).includes('gemini-3.8-flash:generateContent'));
      assert.strictEqual(options.headers['x-goog-api-key'], 'mock_test_key');
      const body = JSON.parse(options.body);
      assert.ok(body.contents[0].parts[0].text.includes('Unique Task Title For Success Test'));

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: mockGeneratedText }]
              }
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validTokenUser1}`)
      .send({ title: 'Unique Task Title For Success Test' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.description, mockGeneratedText);
    assert.strictEqual(res.body.generatedBy, 'ai');
    assert.ok(/[.!?]$/.test(res.body.description), 'Description must end with proper punctuation');
  });

  it('POST /api/ai/generate-description trims trailing incomplete sentence while preserving complete sentences', async () => {
    process.env.GEMINI_API_KEY = 'mock_test_key';
    const rawCutoffText =
      'Review core React concepts including state management and hooks. Practice building functional components with Vite. Read about';
    const expectedCleanedText =
      'Review core React concepts including state management and hooks. Practice building functional components with Vite.';

    globalThis.fetch = mockSuccessfulGeminiResponse(rawCutoffText);

    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validTokenUser1}`)
      .send({ title: 'Task Truncation Test' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.description, expectedCleanedText);
    assert.ok(/[.!?]$/.test(res.body.description));
  });

  it('POST /api/ai/generate-description safely rejects incomplete fragment without terminal punctuation', async () => {
    process.env.GEMINI_API_KEY = 'mock_test_key';
    const fragmentWithoutAnySentence = 'Review core React concepts including';

    globalThis.fetch = mockSuccessfulGeminiResponse(fragmentWithoutAnySentence);

    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validTokenUser1}`)
      .send({ title: 'Task Fragment Rejection Test' });

    assert.strictEqual(res.status, 502);
    assert.strictEqual(
      res.body.error,
      'AI service returned an incomplete description. Please try again.'
    );
  });

  // --- Server-Side Rate Limiting (60-second cooldown per user & task title) ---
  describe('Server-Side Rate Limiting (60-second cooldown)', () => {
    const rateLimitTaskTitle = 'Prepare sprint review slides';
    const defaultMockText =
      'Gather sprint metrics and task completion stats. Draft slides highlighting achievements and blockers. Rehearse presentation for the stakeholder meeting.';

    before(() => {
      process.env.GEMINI_API_KEY = 'mock_test_key';
      aiRateLimitCache.flushAll();
    });

    it('1. First request succeeds and receives HTTP 200', async () => {
      globalThis.fetch = mockSuccessfulGeminiResponse(defaultMockText);

      const res = await request(app)
        .post('/api/ai/generate-description')
        .set('Authorization', `Bearer ${validTokenUser1}`)
        .send({ title: rateLimitTaskTitle });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.description, defaultMockText);
    });

    it('2. Repeated request for the same user and title within 60s returns HTTP 429', async () => {
      globalThis.fetch = mockSuccessfulGeminiResponse(defaultMockText);

      const res = await request(app)
        .post('/api/ai/generate-description')
        .set('Authorization', `Bearer ${validTokenUser1}`)
        .send({ title: rateLimitTaskTitle });

      assert.strictEqual(res.status, 429);
      assert.strictEqual(
        res.body.error,
        'Please wait 1 minute before generating another description for this task.'
      );
    });

    it('3. Request for a different task title by the same user is allowed', async () => {
      globalThis.fetch = mockSuccessfulGeminiResponse(defaultMockText);

      const res = await request(app)
        .post('/api/ai/generate-description')
        .set('Authorization', `Bearer ${validTokenUser1}`)
        .send({ title: 'A completely different task title' });

      assert.strictEqual(res.status, 200);
    });

    it('4. A different authenticated user can request the same title without being rate-limited', async () => {
      globalThis.fetch = mockSuccessfulGeminiResponse(defaultMockText);

      const res = await request(app)
        .post('/api/ai/generate-description')
        .set('Authorization', `Bearer ${validTokenUser2}`)
        .send({ title: rateLimitTaskTitle });

      assert.strictEqual(res.status, 200);
    });

    it('5. Request is allowed again after the 60-second cooldown expires', async () => {
      globalThis.fetch = mockSuccessfulGeminiResponse(defaultMockText);

      // Simulate the 60-second TTL expiration using the cache instance
      const cacheKey = `ai_cooldown:${user1Id}:${rateLimitTaskTitle.toLowerCase()}`;
      aiRateLimitCache.ttl(cacheKey, -1);

      const res = await request(app)
        .post('/api/ai/generate-description')
        .set('Authorization', `Bearer ${validTokenUser1}`)
        .send({ title: rateLimitTaskTitle });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.description, defaultMockText);
    });
  });
});
