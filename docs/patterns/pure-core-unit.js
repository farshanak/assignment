/**
 * PATTERN: Pure Core Unit Test
 *
 * Location: tests/unit/*.test.js
 * When: Code has NO I/O, NO external imports, NO side effects
 * Example: store.js, env.js, utility functions
 */
'use strict';
// Example: const myUtil = require('../../src/utils/myUtil');

describe('PureCoreUnit', () => {
  it('returns correct result for valid input', () => {
    // ARRANGE: Plain data, no mocks
    const input = 42;
    // ACT
    const result = input * 2;
    // ASSERT
    expect(result).toBe(84);
  });

  it('handles edge case: zero', () => {
    expect(0 * 2).toBe(0);
  });
});
