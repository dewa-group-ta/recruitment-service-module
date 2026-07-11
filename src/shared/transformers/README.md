# Shared Transformers

Utility functions untuk transformasi otomatis tipe data dalam DTO. File ini berisi fungsi-fungsi yang dapat digunakan di seluruh aplikasi untuk mengkonversi string menjadi tipe data yang sesuai.

## 📁 Struktur File

```
src/shared/transformers/
├── index.ts                 # Export semua transformers
├── type-transformers.ts     # Implementasi transformers
└── README.md               # Dokumentasi ini
```

## 🔧 Available Transformers

### 1. `transformToNumber`

Mengubah string menjadi number (float).

```typescript
import { transformToNumber } from '@/shared/transformers';

@Transform(transformToNumber)
@IsNumber({ maxDecimalPlaces: 2 })
gpa?: number;
```

**Contoh:**

- `"3.56"` → `3.56`
- `"3"` → `3`
- `""` → `undefined`
- `"invalid"` → `undefined`

### 2. `transformToInteger`

Mengubah string menjadi integer.

```typescript
import { transformToInteger } from '@/shared/transformers';

@Transform(transformToInteger)
@IsNumber()
year: number;
```

**Contoh:**

- `"2024"` → `2024`
- `"3.56"` → `3`
- `""` → `undefined`

### 3. `transformToBoolean`

Mengubah string menjadi boolean.

```typescript
import { transformToBoolean } from '@/shared/transformers';

@Transform(transformToBoolean)
@IsBoolean()
isActive?: boolean;
```

**Contoh:**

- `"true"` → `true`
- `"false"` → `false`
- `"1"` → `true`
- `"0"` → `false`
- `"yes"` → `true`
- `"no"` → `false`

### 4. `transformToDate`

Mengubah string menjadi Date object.

```typescript
import { transformToDate } from '@/shared/transformers';

@Transform(transformToDate)
@IsDateString()
createdAt?: Date;
```

**Contoh:**

- `"2024-01-01"` → `Date object`
- `"invalid"` → `undefined`

### 5. `transformToArray`

Mengubah string menjadi array.

```typescript
import { transformToArray } from '@/shared/transformers';

@Transform(transformToArray)
@IsArray()
tags?: string[];
```

**Contoh:**

- `"item1,item2,item3"` → `["item1", "item2", "item3"]`
- `""` → `[]`

### 6. `transformToLowercase`

Mengubah string menjadi lowercase.

```typescript
import { transformToLowercase } from '@/shared/transformers';

@Transform(transformToLowercase)
@IsString()
status?: string;
```

**Contoh:**

- `"HELLO"` → `"hello"`
- `"Hello World"` → `"hello world"`

### 7. `transformToUppercase`

Mengubah string menjadi uppercase.

```typescript
import { transformToUppercase } from '@/shared/transformers';

@Transform(transformToUppercase)
@IsString()
code?: string;
```

**Contoh:**

- `"hello"` → `"HELLO"`
- `"hello world"` → `"HELLO WORLD"`

## 📝 Cara Penggunaan

### Import Transformers

```typescript
import {
  transformToNumber,
  transformToInteger,
  transformToBoolean
} from "@/shared/transformers";
```

### Gunakan dalam DTO

```typescript
export class ExampleDto {
  @ApiProperty({
    description: "GPA",
    example: 3.56,
    required: false
  })
  @IsOptional()
  @Transform(transformToNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  gpa?: number;

  @ApiProperty({
    description: "Year",
    example: 2024
  })
  @Transform(transformToInteger)
  @IsNumber()
  year: number;

  @ApiProperty({
    description: "Is Active",
    example: true
  })
  @IsOptional()
  @Transform(transformToBoolean)
  @IsBoolean()
  isActive?: boolean;
}
```

## 🎯 Keuntungan

1. **Reusable**: Dapat digunakan di seluruh aplikasi
2. **Konsisten**: Implementasi yang sama di semua DTO
3. **Type Safe**: Tetap mempertahankan TypeScript types
4. **Validasi**: Automatic validation untuk invalid values
5. **Maintainable**: Mudah di-maintain dan di-update

## 🔄 Contoh Alur Data

**Frontend mengirim:**

```json
{
  "gpa": "3.56",
  "year": "2024",
  "isActive": "true"
}
```

**Backend otomatis convert ke:**

```json
{
  "gpa": 3.56,
  "year": 2024,
  "isActive": true
}
```

## 🚀 Best Practices

1. **Gunakan yang sesuai**: Pilih transformer yang tepat untuk tipe data
2. **Kombinasi dengan validation**: Selalu gunakan dengan decorator validation
3. **Error handling**: Transformer akan return `undefined` untuk invalid values
4. **Testing**: Test semua edge cases untuk memastikan behavior yang diinginkan

## 🧪 Testing

```typescript
import { transformToNumber } from "@/shared/transformers";

describe("transformToNumber", () => {
  it("should convert valid string to number", () => {
    expect(transformToNumber({ value: "3.56" })).toBe(3.56);
  });

  it("should return undefined for invalid string", () => {
    expect(transformToNumber({ value: "invalid" })).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(transformToNumber({ value: "" })).toBeUndefined();
  });
});
```
