'use strict';

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  maxWorkers: '50%',

  // Test path patterns — separated by layer
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],

  // Exclude old test location (migrated to tests/)
  testPathIgnorePatterns: ['/node_modules/', '/src/__tests__/'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],

  // 80% floor on all metrics
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = config;
