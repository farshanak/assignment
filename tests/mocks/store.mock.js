'use strict';
/**
 * Shared Store Mock (Gold Standard)
 *
 * RULES:
 * 1. Single source of truth for store mocking
 * 2. Patch in beforeEach — do not modify between tests inline
 * 3. Reset with jest.resetAllMocks() in beforeEach
 */

const storeMock = {
  getAll: jest.fn().mockReturnValue([]),
  getById: jest.fn().mockReturnValue(undefined),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

module.exports = storeMock;
