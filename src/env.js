'use strict';
// src/env.js — Fail-fast environment validation
// Import this module at app startup; it throws if required vars are missing.

const REQUIRED = [
  // Add required vars here, e.g.: 'DATABASE_URL', 'API_KEY'
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
    'Copy .env.example to .env and fill in the values.'
  );
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || 'localhost',
};
