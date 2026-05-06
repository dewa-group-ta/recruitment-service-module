# Transformasi Otomatis String ke Number/Boolean

> ⚠️ **DEPRECATED**: Utility functions telah dipindahkan ke `/src/shared/transformers/`
> 
> Silakan gunakan import dari shared transformers:
> ```typescript
> import { transformToNumber, transformToInteger, transformToBoolean } from '@/shared/transformers';
> ```

File ini menjelaskan cara menggunakan transformasi otomatis dari string ke tipe data lain dalam DTO.

## Utility Functions yang Tersedia

> 📝 **Note**: Semua utility functions sekarang tersedia di `/src/shared/transformers/`

### 1. `transformToNumber`
Mengubah string menjadi number (float) dengan validasi.

```typescript
@Transform(transformToNumber)
@IsNumber({ maxDecimalPlaces: 2 })
gpa?: number;
```

**Contoh Input/Output:**
- `"3.56"` → `3.56`
- `"3"` → `3`
- `""` → `undefined`
- `null` → `undefined`
- `"invalid"` → `undefined`

### 2. `transformToInteger`
Mengubah string menjadi integer dengan validasi.

```typescript
@Transform(transformToInteger)
@IsNumber()
year: number;
```

**Contoh Input/Output:**
- `"2024"` → `2024`
- `"3.56"` → `3` (dibulatkan ke bawah)
- `""` → `undefined`
- `null` → `undefined`
- `"invalid"` → `undefined`

### 3. `transformToBoolean`
Mengubah string menjadi boolean dengan validasi.

```typescript
@Transform(transformToBoolean)
@IsBoolean()
isActive?: boolean;
```

**Contoh Input/Output:**
- `"true"` → `true`
- `"false"` → `false`
- `"1"` → `true`
- `"0"` → `false`
- `"yes"` → `true`
- `"no"` → `false`
- `""` → `undefined`
- `null` → `undefined`

## Cara Penggunaan

### Untuk Field Number (Float)
```typescript
@ApiProperty({
  description: "GPA",
  example: 3.56,
  required: false
})
@IsOptional()
@Transform(transformToNumber)
@IsNumber({ maxDecimalPlaces: 2 })
gpa?: number;
```

### Untuk Field Integer
```typescript
@ApiProperty({
  description: "Year",
  example: 2024
})
@Transform(transformToInteger)
@IsNumber()
year: number;
```

### Untuk Field Boolean
```typescript
@ApiProperty({
  description: "Is Active",
  example: true
})
@IsOptional()
@Transform(transformToBoolean)
@IsBoolean()
isActive?: boolean;
```

## Keuntungan

1. **Otomatis**: Frontend bisa mengirim string, backend otomatis convert ke number/boolean
2. **Validasi**: Invalid values akan menjadi `undefined` atau `null`
3. **Konsisten**: Menggunakan utility function yang sama di seluruh aplikasi
4. **Type Safety**: Tetap mempertahankan type safety dengan TypeScript

## Contoh Penggunaan dari Frontend

```typescript
// Frontend bisa mengirim string
const formData = {
  gpa: "3.56",        // String
  year: "2024",       // String
  isActive: "true"    // String
}

// Backend akan otomatis convert ke:
// {
//   gpa: 3.56,        // Number
//   year: 2024,       // Number
//   isActive: true    // Boolean
// }
```

## Error Handling

Jika transformasi gagal, field akan menjadi `undefined` dan validation akan menangani error sesuai dengan decorator yang digunakan (`@IsOptional()`, `@IsNumber()`, dll).
