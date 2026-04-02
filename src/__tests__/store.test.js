'use strict';
const store = require('../store');

beforeEach(() => {
  // Reset the store between tests by replacing internal state
  const all = store.getAll();
  all.forEach((t) => store.remove(t.id));
});

test('create returns a task with id and createdAt', () => {
  const task = store.create({ title: 'Test task', description: '', done: false });
  expect(task.id).toBeDefined();
  expect(task.title).toBe('Test task');
  expect(task.createdAt).toBeDefined();
});

test('getAll returns all created tasks', () => {
  store.create({ title: 'A', description: '', done: false });
  store.create({ title: 'B', description: '', done: false });
  expect(store.getAll().length).toBeGreaterThanOrEqual(2);
});

test('getById returns the correct task', () => {
  const task = store.create({ title: 'Find me', description: '', done: false });
  expect(store.getById(task.id)).toEqual(task);
});

test('getById returns undefined for missing id', () => {
  expect(store.getById(99999)).toBeUndefined();
});

test('update modifies a task', () => {
  const task = store.create({ title: 'Original', description: '', done: false });
  const updated = store.update(task.id, { title: 'Updated', description: '', done: true });
  expect(updated.title).toBe('Updated');
  expect(updated.done).toBe(true);
  expect(updated.updatedAt).toBeDefined();
});

test('update returns null for missing id', () => {
  expect(store.update(99999, { title: 'Ghost' })).toBeNull();
});

test('remove deletes a task', () => {
  const task = store.create({ title: 'Delete me', description: '', done: false });
  expect(store.remove(task.id)).toBe(true);
  expect(store.getById(task.id)).toBeUndefined();
});

test('remove returns false for missing id', () => {
  expect(store.remove(99999)).toBe(false);
});
