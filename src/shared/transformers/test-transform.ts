/**
 * Test file for transformers
 * This file tests the transformer functions to ensure they work correctly
 */

import { transformToNumber, transformToInteger } from './type-transformers';

// Test transformToNumber
console.log('Testing transformToNumber:');
console.log('transformToNumber({ value: "3.63" }):', transformToNumber({ value: "3.63" }));
console.log('transformToNumber({ value: "3" }):', transformToNumber({ value: "3" }));
console.log('transformToNumber({ value: "" }):', transformToNumber({ value: "" }));
console.log('transformToNumber({ value: null }):', transformToNumber({ value: null }));
console.log('transformToNumber({ value: undefined }):', transformToNumber({ value: undefined }));
console.log('transformToNumber({ value: "invalid" }):', transformToNumber({ value: "invalid" }));

// Test transformToInteger
console.log('\nTesting transformToInteger:');
console.log('transformToInteger({ value: "2024" }):', transformToInteger({ value: "2024" }));
console.log('transformToInteger({ value: "3.63" }):', transformToInteger({ value: "3.63" }));
console.log('transformToInteger({ value: "" }):', transformToInteger({ value: "" }));
console.log('transformToInteger({ value: null }):', transformToInteger({ value: null }));
console.log('transformToInteger({ value: undefined }):', transformToInteger({ value: undefined }));
console.log('transformToInteger({ value: "invalid" }):', transformToInteger({ value: "invalid" }));
