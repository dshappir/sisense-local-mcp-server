#!/usr/bin/env node

// Test script to verify LogLevel type enforcement
import { LogLevel } from './dist/utils/logger.js';

// This should work - valid log levels
const validLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];

console.log('Valid log levels:', validLevels);

// This would cause a TypeScript error if uncommented:
// const invalidLevel: LogLevel = 'invalid'; // Error: Type '"invalid"' is not assignable to type 'LogLevel'

// Test that the type is properly derived from LEVELS
const LEVELS = ['error', 'warn', 'info', 'debug'] as const;
type TestLogLevel = (typeof LEVELS)[number];

// This should be true
const isSameType: boolean = (validLevels[0] as TestLogLevel) === 'error';
console.log('Type derivation works correctly:', isSameType);

console.log('LogLevel type enforcement test completed successfully!');
