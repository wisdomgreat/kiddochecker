# Phase 1: NFC "Tap & Go" Scanning - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate native NFC "Tap & Go" hardware scanning into the KiddoChecker Kiosk Check-In terminal page (`src/components/kiosk/KioskCheckInSystem.tsx`). When an NFC tag (representing a parent or staff member) is tapped against the reader, it must automatically authenticate that user, load their family/shift data, and transition to their corresponding check-in or shift select screens without manual phone/PIN entry.

</domain>

<decisions>
## Implementation Decisions

### 1. Database Schema Alignment
- **D-01:** Add `nfc_uid` text column to the `public.profiles` table in Azure Database for PostgreSQL.
- **D-02:** Update `server/index.js` startup migrations to programmatically run `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nfc_uid TEXT;` on server start, ensuring environment parity.

### 2. Frontend Hook and API Usage
- **D-03:** Utilize Chrome's native Web NFC API via the custom React hook `@/hooks/useNFC.ts` within the Kiosk component.
- **D-04:** Initialize scanning automatically upon Kiosk component mount if NFC is supported, maintaining a persistent background scanner listener.
- **D-05:** Map incoming serial numbers to parent/staff accounts by checking both `supabase.from('profiles').select('*').eq('nfc_uid', serial)` and fallback bridge endpoints.

### 3. UI and User Flow
- **D-06:** Provide visual indicators (e.g., NFC status badges, toast notifications) indicating NFC reader state: "NFC Reader Active" vs "NFC Not Supported".
- **D-07:** Add an admin/staff trigger for linking/registering a physical NFC card to an existing user profile directly from the Kiosk dashboard interface.

### the agent's Discretion
- Spacing, colors, and precise visual placement of the NFC status badge/button.
- Standard error messages when scanning fails.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Kiosk & Device Setup
- [PROJECT.md](file:///.planning/PROJECT.md) — Living context, constraints, and architecture summary.
- [REQUIREMENTS.md](file:///.planning/REQUIREMENTS.md) §HW-INT-01 — Hardware integration requirements for NFC.
- [KioskCheckInSystem.tsx](file:///c:/Users/wisdo/Documents/GitHub/kiddochecker/src/components/kiosk/KioskCheckInSystem.tsx) — Main entry point for kiosk UI check-in flow.
- [useNFC.ts](file:///c:/Users/wisdo/Documents/GitHub/kiddochecker/src/hooks/useNFC.ts) — The browser Web NFC hook implementation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useNFC` hook: Built-in React hook utilizing Web NFC `NDEFReader`. 
- `safeRPC` helper in `KioskCheckInSystem.tsx`: Resilient postgres RPC wrapper.

### Established Patterns
- State checking: Utilizing reactive state (`parentLoggedIn`, `staffAuthed`) to route layout transitions post-auth.

### Integration Points
- `/server/index.js` migrations: Setup phase database columns dynamically.
- `KioskCheckInSystem.tsx` event listeners.

</code_context>

<deferred>
## Deferred Ideas

- NFC badge printing — Out of scope (deferred to future printer layout enhancements).
- Multi-token mapping — Only a single NFC card is mapped per profile for now.

</deferred>

---

*Phase: 01-nfc-tap-go-scanning*
*Context gathered: 2026-05-17*
