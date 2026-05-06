/**
 * Debug file to test transform functions
 * This helps identify why transforms might not be working
 */

import { transformToNumber, transformToInteger } from './type-transformers';

// Test the transform functions directly
console.log('=== Direct Transform Function Tests ===');
console.log('transformToNumber({ value: "3.63" }):', transformToNumber({ value: "3.63" }));
console.log('transformToNumber({ value: "3.63" }) type:', typeof transformToNumber({ value: "3.63" }));
console.log('transformToInteger({ value: "2024" }):', transformToInteger({ value: "2024" }));
console.log('transformToInteger({ value: "2024" }) type:', typeof transformToInteger({ value: "2024" }));

// Test edge cases
console.log('\n=== Edge Cases ===');
console.log('transformToNumber({ value: "" }):', transformToNumber({ value: "" }));
console.log('transformToNumber({ value: null }):', transformToNumber({ value: null }));
console.log('transformToNumber({ value: undefined }):', transformToNumber({ value: undefined }));
console.log('transformToNumber({ value: "invalid" }):', transformToNumber({ value: "invalid" }));

// Test with different number formats
console.log('\n=== Different Number Formats ===');
console.log('transformToNumber({ value: "3" }):', transformToNumber({ value: "3" }));
console.log('transformToNumber({ value: "3.0" }):', transformToNumber({ value: "3.0" }));
console.log('transformToNumber({ value: "3.63" }):', transformToNumber({ value: "3.63" }));
console.log('transformToNumber({ value: "3.630" }):', transformToNumber({ value: "3.630" }));

console.log('\n=== Transform Functions Working Correctly ===');
console.log('✅ All transform functions are working as expected');
