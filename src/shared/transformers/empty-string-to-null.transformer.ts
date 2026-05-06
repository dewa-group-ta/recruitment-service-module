import { Transform } from "class-transformer";

/**
 * Transforms empty strings to null for enum fields
 * This prevents empty strings from being passed to database enum fields
 */
export function EmptyStringToNull() {
  return Transform(({ value }) => {
    if (value === "" || (typeof value === "string" && value.trim() === "")) {
      return null;
    }
    return value;
  });
}
