#!/usr/bin/env node

// Test script to verify JSON handling
import { safeStringify } from './dist/utils/json.js';

console.log('Testing safeStringify with various data types...');

// Test 1: Normal object
const normalObj = { name: 'test', value: 123 };
console.log('Normal object:', safeStringify(normalObj));

// Test 2: Array
const normalArray = [1, 2, 3, 'test'];
console.log('Normal array:', safeStringify(normalArray));

// Test 3: Circular reference
const circularObj = { name: 'test' };
circularObj.self = circularObj;
console.log('Circular reference:', safeStringify(circularObj));

// Test 4: Function
const funcObj = { name: 'test', fn: () => console.log('test') };
console.log('Function:', safeStringify(funcObj));

// Test 5: Undefined/null
console.log('Undefined:', safeStringify(undefined));
console.log('Null:', safeStringify(null));

// Test 6: Complex nested structure
const complexObj = {
  name: 'test',
  data: {
    items: [1, 2, { nested: true }],
    metadata: {
      created: new Date(),
      tags: ['tag1', 'tag2'],
    },
  },
};
console.log('Complex object:', safeStringify(complexObj, 2));

console.log('All tests completed successfully!');
