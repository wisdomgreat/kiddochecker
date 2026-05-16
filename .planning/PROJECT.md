# KiddoChecker Production Stabilization & Hardware Integration

## What This Is

KiddoChecker is a secure, professional child check-in/out and digital signature tracking system designed for childcare operators and Ofsted compliance. The platform features an interactive kiosk for parents and staff, automated hardware integration, dynamic executive analytics, and strict audit-ready digital signature collection.

## Core Value

Provide a completely reliable, zero-downtime, and Ofsted-compliant child attendance tracking loop that guarantees no child checked-in goes missing from the checkout screen, fully backed by robust backend security.

## Requirements

### Validated

- ✓ **Type-Cast Postgres RPC Handlers** — Strict parameter casting (`::uuid`, `::text`) across all bridge endpoints to prevent PostgreSQL function mismatch crashes on Azure.
- ✓ **Bulletproof Frontend Filter** — Set-based Child ID matching to ensure checked-in children reliably display on the parent's checkout list regardless of session synchronization.
- ✓ **Parent PIN Session Restoration** — Persistent authentication utilizing browser `localStorage` to automatically restore PIN sessions upon accidental refresh or navigation.
- ✓ **Root & Server Dependency Update** — Restored frontend runtime stability to latest stable package versions (Vite 6, TypeScript 5.7) and updated backend libraries.
- ✓ **Backend Security Hardening** — Implemented `helmet` HTTP headers, `morgan` combined request logging, and `express-rate-limit` for authentication route rate-limiting.

### Active

- [ ] **NFC "Tap & Go" Scanning** — Integrate hardware-level NFC reader listeners directly into the Kiosk component to trigger automatic check-in/out workflows without manual typing.
- [ ] **$0-cost Print Proxy Service** — Build a lightweight network-connected printer integration (silent fallback pattern) to trigger physical label printing on a Brother QL-820NWB network printer during check-in.
- [ ] **Location-Based IP Lockdown** — Secure terminal operations by restricting Kiosk login capabilities to verified physical network locations based on IP address ranges.
- [ ] **Executive Liability Audit Trail** — Implement an advanced dashboard reporting tab displaying a tamper-proof digital signature ledger with verification status, plus hourly automated schema and DB-connection integrity checks.
- [ ] **CI/CD Pipeline Repair & Hardening** — Fix the broken GitHub Actions deployment workflow (`deploy-bridge-api` and SWA CI/CD integration) to allow reliable, automated container app updates alongside direct manual deployment fallback.

### Out of Scope

- **Biometric Face Recognition** — Excluded due to privacy concerns and extra hardware overhead; network NFC and PIN are highly sufficient.
- **SMS/Email Broadcast Marketing** — Deferred to future marketing phases; Twilio and Resend are restricted strictly to security OTPs and check-in confirmation flows.

## Context

KiddoChecker was successfully migrated to a private, secure Azure VNet environment (Azure Container Apps, Static Web Apps, and Azure PostgreSQL Flexible Server). During deployment, critical outages occurred due to type casting mismatch issues in Postgres RPC functions, broken Vite builds due to experimental package updates, and missing checkout child lists caused by complex DB join queries. The system is currently stabilized using manual Docker-to-ACR pushes, but requires hardware integrations, compliance audit logs, and workflow automation repair.

## Constraints

- **Tech Stack**: Strict React 18 / Vite 6 / TypeScript 5.7 / Express Node backend.
- **Azure Environment**: Compute is restricted to private Azure Container Apps; DB uses secure internal VNet IPs.
- **Ofsted Compliance**: Requires cryptographic-grade logging and digital signature capture for liability tracking.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Shift to Frontend Filter | Bypassed buggy parent_id DB joins by doing set-based ID matching directly in React. | ✓ Good |
| Strict RPC Parameter Casting | Solved type-mismatch function call errors by appending explicit casts in SQL. | ✓ Good |
| Deploy to ACR directly | Bypassed failing GitHub Actions to restore instant production runtime stability. | ✓ Good |

---
*Last updated: 2026-05-17 after Initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
