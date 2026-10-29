process.env.NODE_ENV = 'test';

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

const { default: app } = await import('../server.js');

describe('API Endpoints Automated Test Suite', () => {
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
});

