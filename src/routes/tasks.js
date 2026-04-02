const express = require('express');
const store = require('../store');

const router = express.Router();

// GET /api/tasks — list all
router.get('/', (req, res) => {
  res.json(store.getAll());
});

// GET /api/tasks/:id — get one
router.get('/:id', (req, res) => {
  const task = store.getById(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /api/tasks — create
router.post('/', (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const task = store.create({ title, description: description ?? '', done: false });
  res.status(201).json(task);
});

// PUT /api/tasks/:id — replace
router.put('/:id', (req, res) => {
  const { title, description, done } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const task = store.update(Number(req.params.id), { title, description: description ?? '', done: !!done });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// PATCH /api/tasks/:id — partial update
router.patch('/:id', (req, res) => {
  const task = store.update(Number(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// DELETE /api/tasks/:id — delete
router.delete('/:id', (req, res) => {
  const removed = store.remove(Number(req.params.id));
  if (!removed) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
});

module.exports = router;
