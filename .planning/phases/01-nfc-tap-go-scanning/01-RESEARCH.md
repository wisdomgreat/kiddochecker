# Phase 1: NFC "Tap & Go" Scanning - Research Notes

## 1. Database Parity and Migration Path

### Target Table: `public.profiles`
The profiles table stores personal identification parameters for parents, staff, teachers, and admins. To support native physical cards and device emulation, a unique identifier is needed.

### Mitigation / SQL Migration:
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nfc_uid TEXT UNIQUE;
```
Adding `nfc_uid TEXT UNIQUE` ensures fast B-Tree lookups while enforcing a constraint that no two profiles map to the same physical security credential.

This migration step will be integrated directly into the `runMigrations` block in `/server/index.js` to ensure the Azure PostgreSQL database matches this state upon server boot or container recycling.

---

## 2. Browser native Web NFC Hook Analysis

The hook `@/hooks/useNFC.ts` encapsulates Chrome/Edge/Samsung Internet's native **Web NFC NDEFReader API**.

### System Architecture Constraints:
- **Web NFC Support:** Only available in Secure Contexts (HTTPS) and supported primarily on Chromium-based Android browsers. Perfect for Samsung Galaxy Tab Active5.
- **Background Listeners:** The hook handles `NDEFReader.scan()`, firing `reading` and `readingerror` listeners.
- **Event Lifecycle:**
  1. Kiosk mounts → Check `'NDEFReader' in window`
  2. If supported, auto-initialize `startScanning()` in a `useEffect` loop.
  3. Keep the reader scanning continuously, handling background reads silently.
  4. Ensure proper cleanup of listeners when the component unmounts to prevent memory leaks or dual-scanning.

---

## 3. Native Check-In Integration Flow

### Active Scanning Mode Matrix

| Kiosk UI State | Scan Action | Outcome / Transition |
|---|---|---|
| **Idle Screen (ActiveTab = Parent/Youth)** | Unregistered Tag | Trigger "Card not recognized" toast. |
| **Idle Screen (ActiveTab = Parent/Youth)** | Registered Parent Tag | Authenticate Parent → Fetch kids → Route to selection dashboard. |
| **Idle Screen (ActiveTab = Parent/Youth)** | Registered Staff Tag | Authenticate Staff → Load shifts → Route to Staff shift select. |
| **Staff Register Mode (isRegisteringNFC = uuid)** | Any Tag | Update `nfc_uid = tag_serial` for targeted profile → Clear registering state → Toast success. |

---

## 4. Verification Strategies

1. **Local Migration Verification:** Run the Node.js server, verify that the startup migration executes and adds `nfc_uid` to the PostgreSQL schema.
2. **NFC Hook Injection:** Mock the `NDEFReader` in browser environments or add debug test buttons on the local Kiosk interface to simulate physical card taps (`mockNfcScan(serial)`).
3. **Manual Check-In E2E Pass:** Link a test card serial, tap, and verify immediate transition to the children selection screen.
