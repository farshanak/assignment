const express = require('express');
const tasksRouter = require('./routes/tasks');
const env = require('./env');

const app = express();
const PORT = env.port;

app.use(express.json());

app.use('/api/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
