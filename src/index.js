const express = require('express');
const tasksRouter = require('./routes/tasks');
const env = require('./env');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/tasks', tasksRouter);

// Only start the server when this file is run directly (not when required in tests)
if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

module.exports = app;
