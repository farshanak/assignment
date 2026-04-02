/**
 * PATTERN: API Integration Test
 *
 * Location: tests/integration/*.integration.test.js
 * When: Testing HTTP contracts — request/response shape, status codes
 * Uses: supertest against the real Express app
 */
'use strict';
const request = require('supertest');
const app = require('../../src/index');

describe('Resource API', () => {
  it('GET /resource returns 200', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
  });

  it('POST /resource with invalid body returns 400', async () => {
    const res = await request(app).post('/api/tasks').send({});
    expect(res.status).toBe(400);
  });
});
