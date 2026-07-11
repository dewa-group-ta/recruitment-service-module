import { Transform } from "class-transformer";

/**
 * transform string kosong jadi null, supaya tidak dikirim sebagai nilai enum ke database.
 */
export function EmptyStringToNull() {
  return Transform(({ value }) => {
    if (value === "" || (typeof value === "string" && value.trim() === "")) {
      return null;
    }
    return value;
  });
}
