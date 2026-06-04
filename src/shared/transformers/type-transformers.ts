/**
 * Type Transformers
 * Utility functions for automatic type transformation in DTOs
 * Follows Single Responsibility Principle - each function has one clear purpose
 */

/**
 * Transform string to number with proper validation
 * Follows Single Responsibility Principle - focused only on string to number transformation
 * 
 * @param value - The value to transform
 * @returns number | undefined - Transformed number or undefined if invalid
 * 
 * @example
 * transformToNumber({ value: "3.56" }) // returns 3.56
 * transformToNumber({ value: "invalid" }) // returns undefined
 * transformToNumber({ value: "" }) // returns undefined
 */
export const transformToNumber = ({ value }: { value: any }): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

/**
 * Transform string to integer with proper validation
 * Follows Single Responsibility Principle - focused only on string to integer transformation
 * 
 * @param value - The value to transform
 * @returns number | undefined - Transformed integer or undefined if invalid
 * 
 * @example
 * transformToInteger({ value: "2024" }) // returns 2024
 * transformToInteger({ value: "3.56" }) // returns 3
 * transformToInteger({ value: "invalid" }) // returns undefined
 */
export const transformToInteger = ({ value }: { value: any }): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
};

/**
 * Transform string to boolean with proper validation
 * Follows Single Responsibility Principle - focused only on string to boolean transformation
 * 
 * @param value - The value to transform
 * @returns boolean | undefined - Transformed boolean or undefined if invalid
 * 
 * @example
 * transformToBoolean({ value: "true" }) // returns true
 * transformToBoolean({ value: "false" }) // returns false
 * transformToBoolean({ value: "1" }) // returns true
 * transformToBoolean({ value: "0" }) // returns false
 * transformToBoolean({ value: "invalid" }) // returns undefined
 */
export const transformToBoolean = ({ value }: { value: any }): boolean | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') return true;
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') return false;
  }
  return undefined;
};

/**
 * Transform string to date with proper validation
 * Follows Single Responsibility Principle - focused only on string to date transformation
 * 
 * @param value - The value to transform
 * @returns Date | undefined - Transformed date or undefined if invalid
 * 
 * @example
 * transformToDate({ value: "2024-01-01" }) // returns Date object
 * transformToDate({ value: "invalid" }) // returns undefined
 */
export const transformToDate = ({ value }: { value: any }): Date | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

/**
 * Transform string to array with proper validation
 * Follows Single Responsibility Principle - focused only on string to array transformation
 * 
 * @param value - The value to transform
 * @returns any[] | undefined - Transformed array or undefined if invalid
 * 
 * @example
 * transformToArray({ value: "item1,item2,item3" }) // returns ["item1", "item2", "item3"]
 * transformToArray({ value: [] }) // returns []
 * transformToArray({ value: "invalid" }) // returns undefined
 */
export const transformToArray = ({ value }: { value: any }): any[] | undefined => {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    if (value === '') return [];
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  return undefined;
};

/**
 * Transform string to lowercase with proper validation
 * Follows Single Responsibility Principle - focused only on string to lowercase transformation
 * 
 * @param value - The value to transform
 * @returns string | undefined - Transformed lowercase string or undefined if invalid
 * 
 * @example
 * transformToLowercase({ value: "HELLO" }) // returns "hello"
 * transformToLowercase({ value: "Hello World" }) // returns "hello world"
 */
export const transformToLowercase = ({ value }: { value: any }): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'string') return value.toLowerCase();
  return undefined;
};

/**
 * Transform string to uppercase with proper validation
 * Follows Single Responsibility Principle - focused only on string to uppercase transformation
 * 
 * @param value - The value to transform
 * @returns string | undefined - Transformed uppercase string or undefined if invalid
 * 
 * @example
 * transformToUppercase({ value: "hello" }) // returns "HELLO"
 * transformToUppercase({ value: "hello world" }) // returns "HELLO WORLD"
 */
export const transformToUppercase = ({ value }: { value: any }): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'string') return value.toUpperCase();
  return undefined;
};
