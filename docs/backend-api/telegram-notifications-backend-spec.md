# Telegram Admin Notifications — Frontend Feature Spec

## Overview

The frontend sends admin notifications via Telegram in two scenarios. Previously this was done by calling the Telegram API directly from the browser. The bot token was compromised, so this has been moved to the backend. The frontend now calls `POST /api/notifications/telegram/` and the backend is responsible for delivering the notification.

---

## Notification 1 — Publish Request

### When it triggers

The user is on the event management page for a **draft, public** event. They click the **"Publish"** button in the top bar.

### What the user sees

1. The publish button is visible only when: the user has edit rights, the event privacy is `public`, and the event status is `draft`.
2. On click, the frontend invites `admin@goevent.com` as a collaborator with the message `"{Event Title} requests review for publish"`.
3. If the invite succeeds (or admin is already a collaborator), the user sees a success toast: **"Event submitted for review! Admin will be notified."**
4. The notification is sent in the background — the user never sees an error if it fails.

### What the frontend sends to the backend

```json
POST /api/notifications/telegram/
{
  "type": "publish_request",
  "event_id": "<uuid>"
}
```

### Context the admin needs to act on this

- Event title
- Event ID
- Email of the user who requested
- A direct link to the event in Django admin

---

## Notification 2 — Admin Help Request

### When it triggers

The user is on the **Collaborators** tab of the event management page. They open the invite modal, enter `admin@goevent.com` as the email, and include a message that contains the phrase `"asks admin for help"`.

### What the user sees

1. The invite is submitted normally.
2. On success, the user sees the standard collaborator invite success toast.
3. The Telegram notification fires in the background — invisible to the user.

### What the frontend sends to the backend

```json
POST /api/notifications/telegram/
{
  "type": "admin_help",
  "event_id": "<uuid>",
  "message": "<the message the user typed>"
}
```

### Context the admin needs to act on this

- Event title
- Event ID
- Email of the user who needs help
- The message the user wrote

---

## Notes for the Backend Team

- Both calls are authenticated — the backend can derive the requesting user from the JWT token.
- Telegram errors should never surface to the user. The frontend ignores the response.
- The old `VITE_TELEGRAM_BOT_TOKEN` and `VITE_TELEGRAM_ADMIN_CHAT_ID` frontend env vars have been removed. The token must live server-side only.
