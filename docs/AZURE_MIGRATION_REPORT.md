# Azure Migration Implementation Report

## Executive Summary
The KiddoChecker platform has successfully transitioned from a Supabase-backed architecture to a secure, VNet-isolated Azure environment. This report documents the technical implementation of the **Identity Bridge**, the **Frontend Proxy**, and the **6-Week Lazy Migration** strategy.

## 1. Technical Architecture
### 1.1 Azure Data Bridge API
- **Purpose**: Acts as a secure intermediary between the Frontend and the Azure PostgreSQL database.
- **Identity Provider**: Microsoft Entra External ID (CIAM) using MSAL.
- **Auto-Migration**: Implemented a "Self-Healing" startup logic that automatically applies required SQL patches (e.g., `azure_oid` column) upon server restart.
- **Mutation Support**: Full support for `SELECT`, `INSERT`, `UPDATE`, `DELETE`, and `RPC` calls.

### 1.2 Frontend Universal Proxy
- **Implementation**: `src/integrations/supabase/bridgeProxy.ts`
- **Strategy**: Intercepts all existing `supabase.from()` and `supabase.rpc()` calls and redirects them to the Azure Bridge API.
- **Benefit**: Zero code changes required in over 100+ UI components.

## 2. User Migration Strategy (The 1,000 Users)
### 2.1 The "Lazy Link" Window (6 Weeks)
- **Mechanism**: On first login via Azure, the Bridge API matches the user's **Email** against the existing database.
- **Persistence**: Once matched, the user's **Azure OID** is saved to the `profiles` table.
- **Data Continuity**: All historical logs, permissions, and records (linked via the original UUID) remain intact.

### 2.2 Password & 2FA Handling
- **Passwordless Flow**: Users utilize **Email One-Time Passcode (OTP)** for their first Azure login, bypassing the need for password migration.
- **MFA Enforcement**: Role-based MFA is enforced for Admins, Staff, Teachers, and Volunteers via Azure Conditional Access.

## 3. Infrastructure Status
- **Database**: Azure PostgreSQL Flexible Server (VNet isolated).
- **Backend**: Azure Container Apps (`ca-data-bridge-api`).
- **Frontend**: Azure Static Web Apps (with local/Vercel parity).

## 4. Post-Migration Checklist (6 Weeks Out)
- [ ] Monitor `azure_oid` population in the `profiles` table.
- [ ] Verify Kiosk re-authentication status.
- [ ] After 6 weeks: Decommission Supabase Auth and Database.
- [ ] After 6 weeks: Remove the `bridgeProxy` and finalize direct Bridge API calls.

---
**Date**: 2026-05-02
**Status**: LIVE (Migration Window Open)
