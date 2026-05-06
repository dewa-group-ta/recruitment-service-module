import { Transform } from "class-transformer";

/**
 * Transform string to boolean for query parameters
 * Handles common boolean string representations
 */
export const TransformToBoolean = Transform(({ value }) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  if (value === "1") return true;
  if (value === "0") return false;
  if (value === "yes") return true;
  if (value === "no") return false;
  if (value === "on") return true;
  if (value === "off") return false;
  return undefined;
});

/**
 * Transform string to boolean with strict validation
 * Only accepts 'true' and 'false' strings
 */
export const TransformToBooleanStrict = Transform(({ value }) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
});

/**
 * Transform string to boolean with default value
 * Returns default value if transformation fails
 */
export const TransformToBooleanWithDefault = (defaultValue: boolean) =>
  Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    if (value === "1") return true;
    if (value === "0") return false;
    return defaultValue;
  });
