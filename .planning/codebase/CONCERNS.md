# Technical Concerns & Debt

This document tracks known issues, technical debt, and areas requiring future hardening or refactoring in the KiddoChecker project.

## Identified Technical Debt

- **Legacy Supabase Dependencies:** The `@supabase/supabase-js` library remains in `package.json` and some parts of the codebase. This needs to be systematically migrated to use the Bridge API exclusively to avoid environment configuration drift.
- **Backend Logging:** While `morgan` is integrated, many logs remain as standard `console.log`. Migrating to a structured logger (like `winston` or `pino`) would improve diagnostic speed in production.
- **Frontend State Complexity:** Components like `KioskCheckInSystem.tsx` are large (>1300 lines). Future refactoring should break these into smaller, more maintainable hooks and components.

## Technical Risks

- **Azure Deployment Instability:** CI/CD pipelines have shown unreliability during migration (e.g., Docker container update failures). This necessitates careful manual oversight of deployments.
- **Vite 6/TypeScript 5.7 Sync:** The build environment was recently stabilized after an experimental version update failure. Maintain strict version pinning (`--save-exact`) for these core packages.

## Future Hardening

- **SQL Injection Guardrails:** Although using `pg` pool with parameter binding, a full security audit of the `Bridge API` SQL string generation is recommended.
- **Rate Limiting Refinement:** The current 10-req/15-min limit on auth routes is a starting point and may need adjustment based on real-world usage patterns.

---
*Last updated: 2026-05-16*
