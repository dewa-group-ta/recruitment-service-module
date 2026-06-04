# Bug Fix: Date Conversion Error

## Issue
```
TypeError: application.expectedStartDate?.toISOString is not a function
```

## Root Cause
The error occurred because `application.expectedStartDate` was not always a Date object. It could be:
- A string (already in ISO format)
- null or undefined
- Some other type

The code was trying to call `.toISOString()` on non-Date objects, causing the error.

## Solution
1. **Added a helper method** `toISOString()` to safely handle date conversion:
   ```typescript
   private toISOString(date: any): string {
     if (!date) return '';
     if (date instanceof Date) return date.toISOString();
     if (typeof date === 'string') return date;
     return '';
   }
   ```

2. **Updated all date conversions** to use the helper method:
   - `expectedStartDate` conversion
   - Address `createdAt`, `updatedAt`, `deletedAt` conversions

3. **Added proper null checks** for optional date fields:
   ```typescript
   expectedStartDate: application.expectedStartDate ? 
     this.toISOString(application.expectedStartDate) : undefined
   ```

## Files Modified
- `src/modules/candidates/services/candidates.service.ts`

## Testing
- Created and ran test script to verify date conversion logic
- All date conversion scenarios now handle properly:
  - Date objects → ISO string
  - String dates → return as-is
  - null/undefined → empty string or undefined
  - Invalid types → empty string

## Result
✅ The API now safely handles all date field types without throwing errors.

## Prevention
- Always check data types before calling Date methods
- Use helper functions for common conversions
- Add proper type guards for optional fields
