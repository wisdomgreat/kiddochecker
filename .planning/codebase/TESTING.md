# Testing Strategy

This document outlines the testing methodologies and verification procedures for KiddoChecker.

## Current Testing Maturity

KiddoChecker primarily relies on **Manual Verification (UAT)** and **Environment Validation** given the highly interactive nature of the Kiosk and Printer integration.

## Manual Testing (Kiosk Flow)

1.  **Authentication:** Verify that Parent PIN entry correctly logs in the user and persists across refresh.
2.  **Child Filter:** Confirm that the "Bulletproof Filter" correctly displays only the children belonging to the authenticated parent in the Self Check-Out list.
3.  **Check-In/Out Events:** Verify that every check-in/out event results in a successful record in the `attendance` table in Azure PostgreSQL.

## Backend Verification

- **Schema Check:** The `server/index.js` includes automated schema bootstrapping. This should be verified in logs on startup: `✓ All required tables, roles, and functions are present.`
- **RPC Validation:** Test RPC signatures manually via the `Bridge API` endpoints when new database functions are added.

## UI/UX Quality Checks

- **Aesthetics Audit:** Ensure 6-pillar visual excellence (vibrant colors, smooth transitions, mobile responsiveness).
- **SEO/Metadata:** Verify that page titles and meta descriptions are descriptive and present.

---
*Last updated: 2026-05-16*
