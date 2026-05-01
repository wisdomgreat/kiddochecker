# System Architecture

## Overview
KiddoChecker is a modern, reactive web application designed for high-stakes childcare environments. It prioritizes data integrity, physical presence verification, and forensic accountability.

## Tech Stack
### Frontend
- **Framework**: React 18 with Vite for ultra-fast builds and HMR.
- **Language**: TypeScript for type-safe development.
- **Styling**: Vanilla CSS + Tailwind CSS for a custom "Premium Glassmorphism" aesthetic.
- **Components**: Radix UI primitives via Shadcn UI.
- **State Management**:
  - **Server State**: TanStack Query (React Query) for caching, optimistic updates, and background fetching.
  - **Global State**: React Context for Auth, Themes, and Language localization.
- **Animations**: Framer Motion for high-end micro-interactions.
- **Icons**: Lucide React for consistent, professional iconography.

### Backend (Supabase)
- **Database**: PostgreSQL (Relational) with complex PL/pgSQL logic.
- **Realtime**: WebSockets for live attendance and messaging feeds.
- **Auth**: JWT-based authentication with MFA support.
- **Storage**: AWS S3-compatible storage for medical records and photos.
- **Edge Functions**: Deno-based serverless functions for email automation and heavy compute.

## Component Architecture
The app follows a **Atomic/Molecular/Page** structure:
- **`src/components/ui`**: Atomic primitives (Buttons, Inputs).
- **`src/components/[feature]`**: Business-specific molecules (e.g., `CheckInDialog`).
- **`src/pages`**: Page orchestrators that handle routing and data fetching.
- **`src/services`**: Pure logic layer that interfaces with Supabase RPCs and APIs.

### Layout System
The application utilizes a **Unified Layout Engine** to ensure a consistent, non-flickering user experience:
- **`UnifiedDashboardLayout.tsx`**: The primary container for all authenticated dashboard views. It integrates the `AppSidebar`, `SidebarProvider`, and dynamic breadcrumbs.
- **Legacy Migration**: All core profile and administrative pages (UserProfile, TeacherProfile, RolesPage, StaffPage) have been migrated from the legacy `MainLayout` to the `UnifiedDashboardLayout` to eliminate UI "flashing" during navigation.

## Environment & Routing
- **Routing**: React Router 6 with nested routes and role-based protection via `RoleBasedRoute.tsx`.
- **Environment**: Managed via `.env` files (VITE_ prefix) with strict typing for Supabase keys.
