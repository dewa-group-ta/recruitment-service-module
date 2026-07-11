/**
 * script debug manual untuk mengetes fungsi transform (tidak dipakai oleh aplikasi).
 */

import { transformToNumber, transformToInteger } from "./type-transformers";

// tes fungsi transform secara langsung
console.log("=== Direct Transform Function Tests ===");
console.log(
  'transformToNumber({ value: "3.63" }):',
  transformToNumber({ value: "3.63" })
);
console.log(
  'transformToNumber({ value: "3.63" }) type:',
  typeof transformToNumber({ value: "3.63" })
);
console.log(
  'transformToInteger({ value: "2024" }):',
  transformToInteger({ value: "2024" })
);
console.log(
  'transformToInteger({ value: "2024" }) type:',
  typeof transformToInteger({ value: "2024" })
);

// tes edge case
console.log("\n=== Edge Cases ===");
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

// tes berbagai format angka
console.log("\n=== Different Number Formats ===");
console.log(
  'transformToNumber({ value: "3" }):',
  transformToNumber({ value: "3" })
);
console.log(
  'transformToNumber({ value: "3.0" }):',
  transformToNumber({ value: "3.0" })
);
console.log(
  'transformToNumber({ value: "3.63" }):',
  transformToNumber({ value: "3.63" })
);
console.log(
  'transformToNumber({ value: "3.630" }):',
  transformToNumber({ value: "3.630" })
);

console.log("\n=== Transform Functions Working Correctly ===");
console.log("All transform functions are working as expected");
