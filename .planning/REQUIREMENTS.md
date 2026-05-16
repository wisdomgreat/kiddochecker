# Requirements: KiddoChecker

**Defined:** 2026-05-17
**Core Value:** Provide a completely reliable, zero-downtime, and Ofsted-compliant child attendance tracking loop that guarantees no child checked-in goes missing from the checkout screen, fully backed by robust backend security.

## v1 Requirements

### Hardware Integration (HW-INT)

- [ ] **HW-INT-01**: Kiosk frontend implements an active NFC scanner listener for automatic check-in/out triggers without manual typing.
- [ ] **HW-INT-02**: Check-in triggers physical label printing to a Brother QL-820NWB network printer using a $0-cost Print Proxy service with dynamic manual fallback option.

### Terminal & Backend Security (SEC)

- [ ] **SEC-01**: Secure kiosk login by restricting access exclusively to verified physical network locations using incoming IP address blocks.
- [ ] **SEC-02**: Secure backend Express API using `helmet` HTTP headers, `morgan` transaction logs, and `express-rate-limit` (10 requests per 15 minutes limit) on sensitive authentication paths.

### Ofsted Compliance & Executive Dashboard (COMP)

- [ ] **COMP-01**: Executive dashboard includes a dedicated compliance tab showing a full, searchable audit trail of all check-in/out events.
- [ ] **COMP-02**: Check-out digital signature data is cryptographically displayed in the reports panel with full verification logs.
- [ ] **COMP-03**: Automated backend cron-job performs hourly connection checks and database schema validations, logging alerts for any unauthorized changes.

### Pipeline Automation (CI-CD)

- [ ] **CI-CD-01**: Debug and stabilize the GitHub Actions bridge-api pipeline (`deploy-bridge-api`) to build and push container images cleanly to Azure ACR.
- [ ] **CI-CD-02**: Fix the failing Azure Static Web Apps build/deploy CI/CD workflow to ensure automatic frontend deployment on branch push.
- [ ] **CI-CD-03**: Provide a clean production deployment fallback script for manual direct ACR building and Azure Container App image updating.

## v2 Requirements

### Analytics & Alerts

- **ANAL-01**: Real-time push notifications to parents when child is checked in/out.
- **ANAL-02**: AI-powered peak hour attendance prediction visualization in executive dashboards.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Biometric Face Verification | High privacy compliance burden and unnecessary hardware footprint. |
| In-app Bulk Email Marketing | Kept communication services strictly dedicated to transaction alerts and compliance logs. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HW-INT-01 | Phase 1: Kiosk Hardware (NFC) | Pending |
| HW-INT-02 | Phase 2: Kiosk Hardware (Printing) | Pending |
| SEC-01 | Phase 3: Location Security & IP Lockdown | Pending |
| SEC-02 | Phase 4: Backend Security | Complete (Pre-initialized) |
| COMP-01 | Phase 5: Executive Compliance | Pending |
| COMP-02 | Phase 5: Executive Compliance | Pending |
| COMP-03 | Phase 5: Executive Compliance | Pending |
| CI-CD-01 | Phase 6: Pipeline Hardening | Pending |
| CI-CD-02 | Phase 6: Pipeline Hardening | Pending |
| CI-CD-03 | Phase 6: Pipeline Hardening | Complete (Pre-initialized) |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-17*
*Last updated: 2026-05-17 after Initial Definition*
