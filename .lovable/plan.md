

# Fix: Staff Document Upload Failure

## Root Cause

Two issues are preventing staff document uploads:

1. **`user_roles` table has no UPDATE policy for staff users on their own row.** After a successful storage upload and `staff_documents` insert, the code calls:
   ```typescript
   await supabase.from('user_roles').update({ verification_status: 'pending' })
     .eq('user_id', user.id).eq('verification_status', 'unverified');
   ```
   This silently fails (RLS denies it), and depending on error handling may cause the entire mutation to appear to fail.

2. **Storage `staff_upload_own_files` only grants INSERT** — no UPDATE policy. Supabase storage uses multipart uploads for larger files, which may require UPDATE on `storage.objects`. This would cause uploads over ~6MB to fail.

## Fix Plan

### 1. SQL Migration — Add missing RLS policies

- Add a policy on `user_roles` allowing staff to UPDATE **only** `verification_status` on their own row (using a restricted `WITH CHECK` that prevents role escalation).
- Add a storage UPDATE policy for staff to update their own files in the `staff-documents` bucket.
- Add a storage DELETE policy for staff to delete/replace their own files.

### 2. Code Fix — Make verification status update non-blocking

In `src/hooks/useStaffVerification.ts`, wrap the `user_roles` update in a try/catch so that even if it fails, the document upload still succeeds. The admin will see the document regardless when reviewing pending verifications.

### Files Modified
- `src/hooks/useStaffVerification.ts` — wrap verification_status update in try/catch
- SQL migration — add 3 RLS policies

