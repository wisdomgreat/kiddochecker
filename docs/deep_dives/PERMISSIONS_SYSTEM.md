# Permissions & Authorization Deep Dive

## Overview
KiddoChecker uses a multi-layered authorization system that combines standard Role-Based Access Control (RBAC) with additive Security Groups (GBAC - Group-Based Access Control).

## 1. Database Schema
The system relies on several core tables in the `public` schema:
- `permissions`: The atomic unit of access (e.g., `audit.view_forensics`).
- `custom_roles`: User-defined roles that extend base templates (Admin, Staff, etc.).
- `role_permissions`: Mapping of permissions to custom roles.
- `security_groups`: Additive buckets for permissions (e.g., "Special Projects").
- `group_permissions`: Mapping of permissions to security groups.
- `user_roles`: Assigns a single custom role to a user.
- `user_security_groups`: Assigns multiple security groups to a user.

## 2. The Permission Resolution Logic
When a user logs in, `AuthContext.tsx` fetches their effective permissions through a two-step resolution process:

1. **Role Permissions**: Fetches permissions linked to the user's `custom_role`.
2. **Group Permissions**: Fetches permissions linked to all `security_groups` the user belongs to.

The final `userPermissions` array is a **union** of both sets.

## 3. Frontend Enforcement
Permissions are enforced in the UI via three main mechanisms:

### A. Role-Based Routing
`src/components/auth/RoleBasedRoute.tsx` protects entire pages.
```tsx
<RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
  <RolesPage />
</RoleBasedRoute>
```

### B. The `hasPermission` Helper
Available via the `useAuth` hook, this allows for granular UI toggling.
```tsx
const { hasPermission } = useAuth();

{hasPermission('audit.view_forensics') && <AuditLogView />}
```

### C. Sidebar Filtering
`src/components/layout/AppSidebar.tsx` dynamically hides navigation items based on the user's effective permissions.

## 4. Administrative Interface
The **Security Governance** screen (`src/pages/RolesPage.tsx`) provides a central command center for:
- Defining new Custom Roles.
- Managing Security Groups.
- Visualizing access via the **Global Permission Matrix**.

## 5. Security Protocols
- **Atomic Updates**: Permission changes trigger immediate cache invalidation via TanStack Query.
- **Server-Side Enforcement**: All sensitive Supabase RPCs re-validate permissions using `public.check_user_permission(perm_name)` internally.
