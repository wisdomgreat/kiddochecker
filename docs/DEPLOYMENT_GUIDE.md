# Deployment & Configuration Guide

## 1. Environment Variables
The application requires the following keys in a `.env` file:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 2. Supabase Setup
### Database Migrations
1. Install Supabase CLI.
2. Link your project: `supabase link --project-ref your-ref`.
3. Apply migrations: `supabase db push`.

### Storage Buckets
Ensure the following buckets exist and are public/private as specified:
- `child-photos`: Publicly readable.
- `medical-records`: Private (RLS protected).
- `staff-docs`: Private.

### Edge Functions
Deploy automated tasks (e.g., Resend email automation):
`supabase functions deploy notify-parent`

---

## 3. Build & Deployment (Vercel/Netlify)
1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Node Version**: 18.x or higher

## 4. Post-Deployment Checklist
- [ ] Verify `deviceId` is correctly persisted in `localStorage`.
- [ ] Test Realtime connection on the dashboard.
- [ ] Confirm "Deny-All" RLS is active by testing an unauthenticated request.
- [ ] Enroll the first Kiosk device via the **Terminal Management** page.

---

## 5. Maintenance
### Monitoring
Use the **System Health** page (`/system-monitoring`) to check:
- Database connectivity.
- Edge Function latency.
- Rate-limiting status.
