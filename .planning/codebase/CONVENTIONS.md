# Coding Conventions

This document tracks the established coding standards and development patterns used in KiddoChecker.

## General Principles

- **TypeScript First:** All new components and utility functions must be fully typed. Use `interface` over `type` for model definitions.
- **Component Design:** Prefer functional components with hooks. Large components should be broken down into specialized sub-components within their respective directory.
- **Style Consistency:** Use TailwindCSS for all styling. Rely on Shadcn UI primitives for accessibility and UI consistency.

## Backend (Bridge API) Patterns

- **Explicit SQL Casting:** All PostgreSQL parameters in RPC-style handlers MUST be explicitly cast (e.g., `$1::uuid`, `$2::text`) to prevent type-mismatch errors in the Azure PostgreSQL environment.
- **Error Handling:** Use `try/catch` blocks around database queries with meaningful `console.log` prefixes for debugging (e.g., `[Bridge API Error]`).

## State Management (TanStack Query)

- **Query Key Strategy:** Use descriptive, array-based query keys for caching and invalidation: `['attendance-report', dateRange]`.
- **Loading States:** Every data-driven component must handle loading and empty states using a consistent UI pattern (e.g., skeleton loaders or `Loader2` from Lucide).

## Project Metadata

- **Date Format:** Use ISO-8601 strings for data passing; use `date-fns` for localized formatting in the UI.

---
*Last updated: 2026-05-16*
