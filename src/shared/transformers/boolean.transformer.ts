import { Transform } from "class-transformer";

/**
 * transform string ke boolean untuk query parameter, menerima berbagai representasi umum (true/false, 1/0, yes/no, on/off).
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
 * transform string ke boolean secara ketat, hanya menerima string 'true'/'false'.
 */
export const TransformToBooleanStrict = Transform(({ value }) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
});

/**
 * transform string ke boolean dengan fallback ke defaultValue kalau tidak cocok.
 */
export const TransformToBooleanWithDefault = (defaultValue: boolean) =>
  Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    if (value === "1") return true;
    if (value === "0") return false;
    return defaultValue;
  });
