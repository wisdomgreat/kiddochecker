# Roadmap: KiddoChecker Production Stabilization & Hardware Integration

## Overview

Stabilize the KiddoChecker production infrastructure on Azure by implementing NFC and physical label printer hardware integration, locking down kiosk access geographically by IP, providing full compliance transaction ledgers for Ofsted, and fixing the broken automated deployment pipelines.

## Phases

- [ ] **Phase 1: NFC "Tap & Go" Scanning** - Integrate hardware NFC reader listeners inside the Kiosk check-in/out components.
- [ ] **Phase 2: $0-cost Print Proxy Integration** - Silent network printing for Brother QL-820NWB during check-in events.
- [ ] **Phase 3: Location Security & IP Lockdown** - Enforce kiosk authentication locks based on verified network IP blocks.
- [x] **Phase 4: Backend Security Hardening** - Secure Bridge API utilizing Express security middleware, Morgan logging, and auth route rate limits.
- [ ] **Phase 5: Ofsted-Ready Executive Compliance** - Cryptographic signature ledger and automated DB schema connection integrity checks.
- [ ] **Phase 6: CI-CD Pipeline Hardening** - Debug and repair the automated GitHub Actions SWA and Container App deployment pipelines.

---

## Phase Details

### Phase 1: NFC "Tap & Go" Scanning
**Goal**: Enable automatic, keyboardless child check-in and check-out via Kiosk terminal NFC scans.
**Depends on**: Nothing
**Requirements**: HW-INT-01
**Success Criteria**:
  1. Kiosk system initializes hardware-level NFC listeners successfully.
  2. Tapping a registered NFC device immediately identifies the child and triggers check-in/out without PIN entry.
**Plans**: 1 plan
- [ ] 01-01: Implement NFC scanner event listeners and Kiosk UI integrations.

### Phase 2: $0-cost Print Proxy Integration
**Goal**: Trigger automatic, silent child label printing on Brother QL-820NWB network printers.
**Depends on**: Phase 1
**Requirements**: HW-INT-02
**Success Criteria**:
  1. Check-in event successfully constructs and sends print payloads over local/private network proxy.
  2. Brother printer outputs correct name labels immediately, with a clean visual fallback button on screen if printer is offline.
**Plans**: 1 plan
- [ ] 02-01: Build Print Proxy client and silent network printer hook integration.

### Phase 3: Location Security & IP Lockdown
**Goal**: Restrict active kiosk check-ins to authorized physical facility locations.
**Depends on**: Phase 2
**Requirements**: SEC-01
**Success Criteria**:
  1. Kiosk PIN login requests from unauthorized IP addresses are automatically blocked with a clear terminal security notice.
  2. Admins can configure allowed IP ranges dynamically from the settings panel.
**Plans**: 1 plan
- [ ] 03-01: Implement IP verification middleware on Bridge API and admin management endpoints.

### Phase 4: Backend Security Hardening (COMPLETE)
**Goal**: Add required security layers to the private Express Bridge API.
**Depends on**: Nothing
**Requirements**: SEC-02
**Success Criteria**:
  1. API sets correct security headers via Helmet.
  2. Request details are logged to standard output using Morgan combined format.
  3. Bruteforce protection blocks IPs after 10 requests within a 15-minute window on auth routes.
**Plans**: Complete
- [x] 04-01: Install Express dependencies (helmet, morgan, express-rate-limit) and update server endpoint middleware.

### Phase 5: Ofsted-Ready Executive Compliance
**Goal**: Guarantee total data integrity and provide an immutable, verifiable ledger of check-in/out records.
**Depends on**: Phase 3
**Requirements**: COMP-01, COMP-02, COMP-03
**Success Criteria**:
  1. Executive reports display a searchable "Liability Audit Trail" ledger including child identity, staff, time, and verified digital signatures.
  2. Hourly background cron checks database schema and active pools, logging any drifts.
**Plans**: 2 plans
- [ ] 05-01: Build the searchable Liability Audit dashboard component and signature visualization.
- [ ] 05-02: Implement backend hourly db health monitoring cron-job.

### Phase 6: CI-CD Pipeline Hardening
**Goal**: Stabilize automated building and deploying of SWA frontend and ACA backend.
**Depends on**: Phase 5
**Requirements**: CI-CD-01, CI-CD-02, CI-CD-03
**Success Criteria**:
  1. GitHub Actions SWA workflow compiles frontend successfully without rolldown build failures.
  2. `deploy-bridge-api` workflow updates ACA backend container correctly on push.
**Plans**: 2 plans
- [ ] 06-01: Fix the Rolldown/Vite 6 packaging configuration in SWA pipeline.
- [ ] 06-02: Resolve ACA deploy token permissions and test automated container app updating.

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. NFC Scanning | 0/1 | Not started | - |
| 2. Print Proxy | 0/1 | Not started | - |
| 3. Location IP Lock | 0/1 | Not started | - |
| 4. Security Hardening | 1/1 | Complete | 2026-05-12 |
| 5. Compliance Reports | 0/2 | Not started | - |
| 6. CI-CD Pipelines | 0/2 | Not started | - |
