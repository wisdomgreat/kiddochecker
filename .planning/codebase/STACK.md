# Tech Stack

This document outlines the core technologies, runtimes, and dependencies used in the KiddoChecker project.

## Core Runtime & Languages

- **Frontend Runtime:** Node.js v25+ (Development) / Modern Browsers (Production)
- **Backend Runtime:** Node.js v25+ (Azure Container Apps)
- **Languages:** 
  - TypeScript 5.9.3 (Frontend)
  - JavaScript / CommonJS (Backend Bridge API)
- **Framework:** React 18.3.1
- **Build Tool:** Vite 6.4.2

## Frontend Stack

- **UI Framework:** Shadcn UI (Radix UI primitives)
- **Styling:** TailwindCSS 3.4.11
- **State Management:** TanStack Query v5 (React Query)
- **Routing:** React Router DOM v6
- **Form Management:** React Hook Form + Zod
- **Animations:** GSAP 3.15, Framer Motion 11
- **Icons:** Lucide React

## Backend Stack

- **Server:** Express.js
- **API Pattern:** RESTful Bridge API
- **Database Client:** `pg` (node-postgres)
- **Auth:** MSAL (Microsoft Authentication Library) for React/Browser
- **Security Middleware:** 
  - `helmet` (Security headers)
  - `morgan` (Request logging)
  - `express-rate-limit` (Auth route protection)

## Infrastructure

- **Cloud Provider:** Azure
- **Compute:** Azure Container Apps (Bridge API)
- **Hosting:** Azure Static Web Apps (Frontend)
- **Database:** Azure Database for PostgreSQL (Flexible Server)
- **Container Registry:** Azure Container Registry (ACR)

## Dependencies

- **Total Dependencies:** ~80 direct dependencies
- **Key Packages:**
  - `@supabase/supabase-js`: (Legacy/Bridge fallback)
  - `date-fns`: Date manipulation
  - `dompurify`: Content sanitization
  - `html5-qrcode`: QR scanning logic
  - `react-signature-canvas`: Kiosk checkout signatures

---
*Last updated: 2026-05-16*
