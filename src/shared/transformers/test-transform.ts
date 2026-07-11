/**
 * script manual untuk mengetes fungsi transformer (tidak dipakai oleh aplikasi).
 */

import { transformToNumber, transformToInteger } from "./type-transformers";

console.log("Testing transformToNumber:");
console.log(
  'transformToNumber({ value: "3.63" }):',
  transformToNumber({ value: "3.63" })
);
console.log(
  'transformToNumber({ value: "3" }):',
  transformToNumber({ value: "3" })
);
console.log(
  'transformToNumber({ value: "" }):',
  transformToNumber({ value: "" })
);
console.log(
  "transformToNumber({ value: null }):",
  transformToNumber({ value: null })
);
console.log(
  "transformToNumber({ value: undefined }):",
  transformToNumber({ value: undefined })
);
console.log(
  'transformToNumber({ value: "invalid" }):',
  transformToNumber({ value: "invalid" })
);

console.log("\nTesting transformToInteger:");
console.log(
  'transformToInteger({ value: "2024" }):',
  transformToInteger({ value: "2024" })
);
console.log(
  'transformToInteger({ value: "3.63" }):',
  transformToInteger({ value: "3.63" })
);
console.log(
  'transformToInteger({ value: "" }):',
  transformToInteger({ value: "" })
);
console.log(
  "transformToInteger({ value: null }):",
  transformToInteger({ value: null })
);
console.log(
  "transformToInteger({ value: undefined }):",
  transformToInteger({ value: undefined })
);
console.log(
  'transformToInteger({ value: "invalid" }):',
  transformToInteger({ value: "invalid" })
);
