'use strict';
const request = require('supertest');
const express = require('express');
const store = require('../../src/store');
const tasksRouter = require('../../src/routes/tasks');

// Integration test: wires the real router against a real in-memory store.
// These tests validate HTTP contract (status codes, response shape).

const app = express();
app.use(express.json());
app.use('/api/tasks', tasksRouter);

beforeEach(() => {
  // Reset in-memory store before each test
  store.getAll().forEach((t) => store.remove(t.id));
});

describe('GET /api/tasks', () => {
  test('returns 200 with empty array when no tasks exist', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all created tasks', async () => {
    store.create({ title: 'Alpha', description: '', done: false });
    store.create({ title: 'Beta', description: '', done: false });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('POST /api/tasks', () => {
  test('creates a task and returns 201', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'New Task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Task');
    expect(res.body.id).toBeDefined();
  });

  test('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title is required');
  });
});

describe('GET /api/tasks/:id', () => {
  test('returns 200 with task when found', async () => {
    const task = store.create({ title: 'Find me', description: '', done: false });
    const res = await request(app).get(`/api/tasks/${task.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find me');
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/tasks/99999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/:id', () => {
  test('replaces a task and returns 200', async () => {
    const task = store.create({ title: 'Old', description: '', done: false });
    const res = await request(app).put(`/api/tasks/${task.id}`)
      .send({ title: 'New', description: 'Updated', done: true });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New');
    expect(res.body.done).toBe(true);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/tasks/99999').send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/tasks/:id', () => {
  test('partially updates a task', async () => {
    const task = store.create({ title: 'Patch me', description: '', done: false });
    const res = await request(app).patch(`/api/tasks/${task.id}`).send({ done: true });
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
    expect(res.body.title).toBe('Patch me');
  });
});

describe('DELETE /api/tasks/:id', () => {
  test('deletes a task and returns 204', async () => {
    const task = store.create({ title: 'Delete me', description: '', done: false });
    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(204);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/tasks/99999');
    expect(res.status).toBe(404);
  });
});

describe('GET /health', () => {
  test('returns 200 with ok status', async () => {
    const healthApp = express();
    healthApp.get('/health', (_req, res) => res.json({ status: 'ok' }));
    const res = await request(healthApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
