#!/usr/bin/env bash
set -e
echo "Validating config files..."
node -e "require('./eslint.config.js')" || { echo "FATAL: eslint.config.js failed to load"; exit 1; }
node -e "require('./jest.config.js')" || { echo "FATAL: jest.config.js failed to load"; exit 1; }
echo "Config files valid"
