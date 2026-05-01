# Frontend Structure & Development Guide

## 1. Directory Organization
- **`src/components`**: Feature-grouped UI components.
  - `ui/`: Radix/Shadcn primitives.
  - `layout/`: Shared navigation and shells (e.g., `UnifiedDashboardLayout`).
  - `attendance/`: Check-in dialogs, timelines.
- **`src/pages`**: Entry points for routes.
- **`src/hooks`**: Custom stateful logic (e.g., `useAttendance` handles real-time sync).
- **`src/services`**: API abstraction layer (e.g., `AttendanceService.ts`).
- **`src/context`**: Global providers (Auth, Localization).

## 2. Global State & Providers
### `AuthContext`
The most critical provider. It handles:
- Supabase session management.
- Dynamic permission resolution (Roles + Groups).
- `hasPermission(name)` helper for UI gating.

### `ThemeContext`
Manages visual modes (Light/Dark/Glass) and design tokens.

## 3. Real-time Architecture
We use Supabase Realtime (WebSockets) for live UI updates:
- **Attendance Feed**: Listens to changes in the `attendance` table.
- **Messaging**: Listens to the `messages` channel for instant chat updates.
- **Implementation**: See `src/hooks/useRealtimeAttendance.ts`.

## 4. Design System (Aesthetics)
KiddoChecker uses a **High-Gloss Glassmorphism** design.
- **Tokens**: Defined in `tailwind.config.js` and `index.css`.
- **Blur**: Extensive use of `backdrop-blur-md` and `backdrop-filter`.
- **Shadows**: Custom tiered shadows for depth.
- **Icons**: Strictly `lucide-react`.

## 5. Form Validation
All forms are validated using **Zod** schemas and **React Hook Form**.
- Schemas are located in `src/types/schemas.ts` (if available) or inline for smaller components.

## 6. Routing Strategy
- **Protected Routes**: Gated by `RoleBasedRoute.tsx`.
- **Kiosk Route**: A dedicated high-performance route (`/kiosk`) optimized for tablet/touch hardware.
