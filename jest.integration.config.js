'use strict';
/**
 * Jest config for integration tests only.
 * Reports coverage without global threshold enforcement —
 * integration tests alone won't cover 80% of all source (expected).
 * Full threshold enforcement lives in jest.config.js (the "test" CI job).
 */

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/__tests__/**'],
  coverageDirectory: 'coverage-integration',
  coverageReporters: ['text-summary'],
};

module.exports = config;
