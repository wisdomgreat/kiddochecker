

# Fix Plan: Build Errors + Password Reset

## Problem Summary

1. **Login issue**: `wisdom_borntobegreat@yahoo.com` exists in the database with `super_admin` role and confirmed email, but the password is wrong (Supabase returns `400: Invalid login credentials`).

2. **21 TypeScript build errors** from two root causes:
   - The database `app_role` enum has 6 values (`admin`, `staff`, `parent`, `super_admin`, `teacher`, `teacher_assistant`) but `src/types/events.ts` defines `AppRole` with 8 values (adds `volunteer`, `kiosk`). This causes type mismatches everywhere `AppRole` is used with Supabase queries.
   - `CheckOutPage.tsx` accesses `data.children` on a `{ success: boolean; error?: string }` return type
   - `EnhancedReportsPage.tsx` uses `Badge` component without importing it

---

## Fix 1: Add Missing Enum Values to Database

Run a SQL migration to add `kiosk` and `volunteer` to the `app_role` enum:

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kiosk';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';
```

This makes the database enum match the frontend `AppRole` type. After the migration, the Supabase types file will auto-regenerate and all the `AppRole` type mismatch errors will resolve.

**Files this fixes** (14 errors):
- `src/components/admin/AddUserModal.tsx` (line 87)
- `src/components/admin/EditUserModal.tsx` (line 72)
- `src/components/admin/EnhancedUserManagement.tsx` (lines 133, 165)
- `src/components/admin/UserCreationModal.tsx` (line 91)
- `src/components/roles/RoleForm.tsx` (lines 62, 73)
- `src/pages/RolePermissionsManagement.tsx` (line 61)
- `src/services/userRoleService.ts` (lines 50, 61)
- `src/utils/roleUtils.ts` (lines 13, 25)

## Fix 2: KioskCheckInSystem `as any` Casts

The kiosk component already uses `as any` casts on lines 91 and 284. After the enum migration, these `TS2589` infinite type instantiation errors should resolve since `events` table and related queries will properly type-check.

## Fix 3: EditStaffForm `is_super_admin` Error

**File**: `src/components/staff/EditStaffForm.tsx` (line 102)

The `updates` object includes `is_super_admin` which isn't in the `StaffMember` update type. Remove `is_super_admin` from the updates object since staff role updates should go through `user_roles` table, not the staff update mutation.

## Fix 4: CheckOutPage `data.children` Error

**File**: `src/pages/CheckOutPage.tsx` (lines 75-78)

`AttendanceService.checkOutChild()` returns `{ success: boolean; error?: string }` -- it does NOT return `children` data. Fix the `onSuccess` handler to use a generic success message instead of trying to access child name from the result.

## Fix 5: EnhancedReportsPage Missing `Badge` Import

**File**: `src/pages/EnhancedReportsPage.tsx`

Add `import { Badge } from '@/components/ui/badge';` to the imports section.

## Fix 6: Reset Password for wisdom_borntobegreat@yahoo.com

Create a one-time-use edge function `reset-password` that uses the service role key to call `supabase.auth.admin.updateUserById()` to set a new password. After deploying, call it via `curl_edge_functions` to reset the password to a known value, then inform the user.

---

## Implementation Order

1. SQL migration (add `kiosk`, `volunteer` to enum)
2. Fix `EditStaffForm.tsx` -- remove `is_super_admin` from updates
3. Fix `CheckOutPage.tsx` -- remove `data.children` reference
4. Fix `EnhancedReportsPage.tsx` -- add Badge import
5. Create + deploy `reset-password` edge function
6. Call the edge function to reset the password
7. Delete the edge function (security -- shouldn't remain deployed)

