/**
 * kumpulan fungsi transform untuk konversi tipe otomatis di dto (dipakai bareng @Transform dari class-transformer).
 */

/**
 * transform string ke number, undefined kalau kosong/null/invalid.
 */
export const transformToNumber = ({
  value
}: {
  value: any;
}): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

/**
 * transform string ke integer, undefined kalau kosong/null/invalid.
 */
export const transformToInteger = ({
  value
}: {
  value: any;
}): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
};

/**
 * transform string ke boolean. menerima "true"/"1"/"yes" dan "false"/"0"/"no" (case-insensitive), selain itu undefined.
 */
export const transformToBoolean = ({
  value
}: {
  value: any;
}): boolean | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes")
      return true;
    if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no")
      return false;
  }
  return undefined;
};

/**
 * transform string ke Date, undefined kalau kosong/null/invalid.
 */
export const transformToDate = ({
  value
}: {
  value: any;
}): Date | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

/**
 * transform string comma-separated ke array; array langsung dikembalikan apa adanya.
 */
export const transformToArray = ({
  value
}: {
  value: any;
}): any[] | undefined => {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    if (value === "") return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
};

/**
 * transform string ke lowercase, undefined kalau kosong/null/invalid.
 */
export const transformToLowercase = ({
  value
}: {
  value: any;
}): string | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string") return value.toLowerCase();
  return undefined;
};

/**
 * transform string ke uppercase, undefined kalau kosong/null/invalid.
 */
export const transformToUppercase = ({
  value
}: {
  value: any;
}): string | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string") return value.toUpperCase();
  return undefined;
};
