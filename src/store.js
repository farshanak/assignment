// In-memory data store
let tasks = [];
let nextId = 1;

module.exports = {
  getAll: () => tasks,
  getById: (id) => tasks.find((t) => t.id === id),
  create: (data) => {
    const task = { id: nextId++, ...data, createdAt: new Date().toISOString() };
    tasks.push(task);
    return task;
  },
  update: (id, data) => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...data, updatedAt: new Date().toISOString() };
    return tasks[index];
  },
  remove: (id) => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },
};
