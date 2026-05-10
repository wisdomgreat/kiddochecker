# Messaging Architecture Deep Dive

## Overview
KiddoChecker's messaging system is designed for secure, role-restricted communication between parents, staff, and administrators. It supports direct messages, broadcast announcements, and automatic ticket escalations.

## 1. Messaging Model
Messages are stored in the `messages` table with the following key fields:
- `sender_id`: Reference to `profiles.id`.
- `recipient_id`: Reference to `profiles.id` (null for broadcasts).
- `content`: The message text.
- `type`: `direct`, `broadcast`, or `system_alert`.
- `is_broadcast`: Boolean flag for organization-wide alerts.
- `metadata`: JSONB field for tracking escalations or attachments.

## 2. Access Control (RLS)
Security is strictly enforced at the database level:
- **Parents**: Can only see messages where they are the sender or the explicit recipient. They can also see `broadcast` messages.
- **Staff**: Can see messages related to their assigned children/families.
- **Admins**: Can see all message traffic for oversight.

## 3. Real-time Communication
The system utilizes Supabase Realtime (Postgres Changes) to provide live message feeds.
- **Hook**: `src/hooks/useMessages.ts` subscribes to the `messages` table.
- **UI**: Components in `src/components/messages/` react instantly to new incoming payloads.

## 4. Broadcast & Escalation Logic
- **Broadcasting**: Only users with the `messaging.broadcast` permission can send organization-wide alerts.
- **Ticket Escalation**: Parents can escalate issues to a "Manager" or "Super Admin" via a specialized `system_alert` type, which triggers notifications for all users with the `management.view_tickets` permission.

## 5. UI Components
- `MessagesPage.tsx`: The main dashboard for staff/admins.
- `ParentMessagesPage.tsx`: A simplified, family-focused view for parents.
- `MessageInput.tsx`: Handles multi-role logic for choosing recipients or broadcast targets.
