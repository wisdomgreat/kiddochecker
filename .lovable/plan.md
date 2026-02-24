

# Comprehensive Application Audit & Fix Plan
## KiddoChecker - Church Children Check-In Management System

---

## Current Status Summary

The application has a solid foundation with most core pages implemented. However, there are several critical issues, missing functionality, and polish items that need to be addressed before deployment.

---

## FINDINGS: Issues Categorized by Severity

### CRITICAL ISSUES (Blocking deployment)

**1. Admin Sidebar Missing Navigation Links**
- The admin sidebar (`AppSidebar.tsx`) only has 4 links: Dashboard, User Management, Reports, Settings
- Missing links: Staff (`/staff`), Children (`/children`), Calendar (`/calendar`), Messages (`/messages`), Attendance (`/attendance`), Classes (`/classes`), Check-In Kiosk (`/check-in`)
- Staff/Teacher roles have NO sidebar at all - only admin and parent sidebars are defined
- This means staff/teachers who navigate to `staff-dashboard` see the admin sidebar (since `isAdmin` check fails, `isParent` may also fail, resulting in no menu items)

**2. CheckOutPage is Non-Functional**
- `CheckOutPage.tsx` is a static shell with no working search or QR scanner
- The Search button and "Start QR Scanner" button have no `onClick` handlers
- No integration with attendance data at all
- Route `/check-out` points to this broken page

**3. No Route Protection on Most Pages**
- Routes like `/staff`, `/children`, `/calendar`, `/messages`, `/attendance`, `/classes` have NO role-based protection
- Any authenticated user can access all admin pages directly by URL
- Only `UsersPage`, `ClassesPage`, `AttendancePage`, `AdminDashboardPage`, `ParentDashboardPage`, `StaffDashboardPage` have `RoleBasedRoute` wrappers

**4. Parent Messages Only Shows Sent Messages**
- `ParentMessages.tsx` queries `.eq('sender_id', user.id)` - only shows messages the parent sent
- Does NOT show messages received (`.eq('recipient_id', user.id)`)
- Parents can't see replies from staff

### HIGH PRIORITY ISSUES

**5. Staff/Teacher Sidebar Navigation Missing**
- `AppSidebar.tsx` only defines `adminItems` and `parentItems`
- Staff and teacher roles fall through to `parentItems` (line 79: `isAdmin ? adminItems : parentItems`)
- Staff/teachers see Parent portal navigation which is incorrect

**6. User Delete Doesn't Fully Work**
- `UsersPage.tsx` deletes from `user_roles` table but cannot delete from `auth.users`
- The user can still log in after "deletion" since their auth record remains
- Needs a server-side function (edge function) to properly delete users

**7. Staff "Add" Creates Auth User with Hardcoded Password**
- `useStaff.ts` creates staff via `supabase.auth.signUp` with `password: 'TempPass123!'`
- This is a security risk - hardcoded password in client code
- Also, creating a user via `signUp` may auto-sign-in the admin as the new user, breaking the session

**8. AppearanceSettings Uses localStorage Only**
- `AppearanceSettings.tsx` saves theme to localStorage, not to the database
- Settings are lost when switching browsers/devices
- Not synchronized with organization_settings table

**9. SecuritySettings Password Change**
- Uses `supabase.auth.updateUser` which requires the new password but doesn't verify the old password server-side
- The old password field exists in UI but may not be properly validated

### MEDIUM PRIORITY ISSUES

**10. Dashboard Cards Show No Live Statistics**
- `UnifiedDashboard.tsx` admin/staff/parent dashboards show only navigation cards
- No real-time counts (total children, today's attendance, pending messages, etc.)
- These are just link cards, not informative dashboard tiles

**11. Classes Page Missing Enrollment Count**
- `ClassesPage.tsx` shows `enrollment: 0` placeholder (line 35)
- Progress bar always shows 0% (line 199: `<Progress value={0} />`)
- No actual enrollment data fetched from attendance

**12. Calendar Events - No Role Protection**
- Calendar edit/delete operations use direct Supabase queries
- RLS policy on `calendar_events` requires `is_admin_user()` for management
- Non-admin users will get silent failures when trying to edit/delete events

**13. Reports Page - Date Range Calendar Picker Issue**
- `EnhancedReportsPage.tsx` uses `Calendar mode="range"` but the `react-day-picker` v8 Calendar component may have issues with range selection callback typing

**14. Landing Page Has No Auth Check**
- Authenticated users visiting `/landing` see the landing page instead of being redirected to their dashboard
- The `/` route (Index) redirects properly, but `/landing` does not

### LOW PRIORITY ISSUES

**15. Duplicate Pages That Should Be Cleaned Up**
- Multiple dashboard pages exist: `AdminDashboard.tsx`, `CleanAdminDashboard.tsx`, `ComprehensiveAdminDashboard.tsx`, `WorkingAdminDashboard.tsx`
- Multiple check-in/out implementations: `CheckInOutPage.tsx`, `CheckInProcess.tsx`, `CheckInProcessPage.tsx`, `CheckInSetupPage.tsx`
- Multiple staff dashboards: `StaffDashboard.tsx`, `ComprehensiveStaffDashboard.tsx`, `WorkingStaffDashboard.tsx`
- These unused files add confusion and should be archived

**16. Missing `isVolunteer` in UserProfile Type**
- `UserProfile` in `types/users.ts` doesn't have `isVolunteer` property
- `useUserRoles.ts` hardcodes `isVolunteer: false` on line 37

**17. Database Linter Warnings**
- Function search path mutable (security warning)
- RLS policy with overly permissive `USING (true)` on some tables
- Leaked password protection disabled
- Postgres version needs security patches

---

## FIX PLAN - 4 Phases

### Phase 1: Critical Navigation & Security Fixes (Estimated: 1 batch)

1. **Fix Admin Sidebar Navigation** - Add all missing links:
   - Classes (`/classes`), Attendance (`/attendance`), Staff (`/staff`), Children (`/children`), Calendar (`/calendar`), Messages (`/messages`), Check-In Kiosk (`/check-in`)
   
2. **Add Staff/Teacher Sidebar** - Create a dedicated `staffItems` array with appropriate links (Check-In, Children, Classes, Attendance, Messages, Calendar)

3. **Add Route Protection** - Wrap unprotected routes in `RoleBasedRoute`:
   - `/staff` - admin, super_admin, staff
   - `/children` - admin, super_admin, staff, teacher
   - `/calendar` - all authenticated
   - `/messages` - all authenticated
   - `/settings` - admin, super_admin

4. **Fix CheckOutPage** - Replace static shell with functional checkout using attendance data:
   - Search children by name with real data
   - Display currently checked-in children
   - "Check Out" button per child using `checkOut` mutation
   - OR redirect `/check-out` to the existing `KioskCheckInSystem` with a checkout mode

5. **Fix ParentMessages** - Update query to show both sent AND received messages using `.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

### Phase 2: Functionality Fixes (Estimated: 1 batch)

1. **Fix Staff Creation Security** - Replace `supabase.auth.signUp` with a Supabase Edge Function that:
   - Creates the user via admin API (service role key)
   - Sets the proper role
   - Sends an invitation email instead of using hardcoded password
   - Doesn't affect the admin's session

2. **Fix User Deletion** - Create an edge function `delete-user` that:
   - Uses the service role to delete from `auth.users`
   - Cascades to `user_roles`, `profiles` automatically
   - Can only be called by admins

3. **Add Dashboard Statistics** - Update `UnifiedDashboard.tsx` to show real counts:
   - Admin: Total users, total children, today's check-ins, pending messages
   - Staff: Today's check-ins, children in class, pending tasks
   - Parent: My children count, recent attendance, unread messages

4. **Fix Classes Enrollment** - Query attendance data to show actual enrollment per class and update Progress bar

### Phase 3: Polish & UX Improvements (Estimated: 1 batch)

1. **Add Landing Page Auth Redirect** - If user is authenticated on `/landing`, redirect to `/`

2. **Fix Calendar Role-Based Actions** - Hide edit/delete buttons for non-admin users, show toast errors for unauthorized operations

3. **Fix AppearanceSettings Persistence** - Save theme preferences to `organization_settings` or a new `user_preferences` table

4. **Fix SecuritySettings** - Validate old password properly before changing, add proper error messaging

5. **Add Staff Role to `isStaff` Check** - Ensure `UnifiedDashboard` correctly identifies staff/teacher/teacher_assistant users for the staff dashboard view

### Phase 4: Cleanup & Database Security (Estimated: 1 batch)

1. **Remove Unused Pages** - Delete or archive duplicate/unused page files:
   - Duplicate dashboards, check-in processes, staff dashboards
   
2. **Fix Database Linter Warnings**:
   - Set `search_path` on mutable functions
   - Review and tighten overly permissive RLS policies
   - Enable leaked password protection

3. **Add `isVolunteer` to UserProfile type** and populate from `useUserRoles`

4. **Final Testing Pass** - Verify all routes, buttons, forms, and data flows

---

## Technical Details

### Files to Modify per Phase

**Phase 1:**
- `src/components/layout/AppSidebar.tsx` - Add missing nav items, add staff sidebar
- `src/App.tsx` - Add RoleBasedRoute wrappers to unprotected routes
- `src/pages/CheckOutPage.tsx` - Complete rewrite with functional checkout
- `src/components/parent/ParentMessages.tsx` - Fix message query

**Phase 2:**
- `supabase/functions/manage-users/index.ts` - New edge function for user management
- `src/hooks/useStaff.ts` - Use edge function instead of signUp
- `src/pages/UsersPage.tsx` - Use edge function for deletion
- `src/components/dashboard/UnifiedDashboard.tsx` - Add real statistics
- `src/pages/ClassesPage.tsx` - Add enrollment data

**Phase 3:**
- `src/pages/LandingPage.tsx` - Auth redirect
- `src/pages/CalendarPage.tsx` - Role-based UI
- `src/components/settings/AppearanceSettings.tsx` - DB persistence
- `src/components/settings/SecuritySettings.tsx` - Password validation

**Phase 4:**
- Multiple file deletions
- SQL migration for database security fixes
- `src/types/users.ts` - Type updates

