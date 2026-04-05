# 🏠 The Family Hub

A warm, personal platform where family members post weekly life updates, and grandparents automatically receive a beautifully formatted email digest every Sunday morning — no website visit required.

## Features

- **Family Member Portal** — Pick your avatar from a grid, enter your PIN, and share updates with text, photos, location, and weather
- **Weekly Feed** — See everyone's updates from this week, react with emoji
- **Weekly Email Digest** — Beautifully formatted HTML email sent automatically to grandparents
- **Friday Reminders** — Gentle nudge emails to members who haven't posted yet
- **Admin Panel** — Manage members, configure digest settings, preview & manually send emails
- **Stretch goals** — Emoji reactions ❤️😂🥰👏🎉 and birthday tracking in the digest 🎂

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Email | Resend |
| Photos | Multer + Sharp (resize to 800px) |
| Scheduling | node-cron |
| Auth | express-session + bcryptjs |

## Setup

### 1. Install dependencies

```bash
# From the family-hub/ directory
npm install
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx    # Get from https://resend.com
BASE_URL=http://localhost:3000     # Your public URL in production
SESSION_SECRET=some-random-string
PORT=3000
```

### 3. Run in development

```bash
npm run dev
```

This starts:
- Express server on port 3000 (with `--watch` for auto-reload)
- Vite dev server on port 5173 (proxies `/api` to Express)

Open: http://localhost:5173

### 4. Production build

```bash
npm run build   # Builds React app to client/dist/
npm start       # Express serves client/dist + API on PORT
```

## Default Accounts

The database is seeded with sample family members on first run:

| Name | Emoji | PIN | Role |
|------|-------|-----|------|
| Grandma Rose | 👵 | `0000` | **Admin** |
| Marco | 🧑 | `1234` | Member |
| Sofia | 👩 | `1234` | Member |
| Luca | 👦 | `1234` | Member |
| Elena | 👧 | `1234` | Member |
| Nino | 🧔 | `1234` | Member |
| Chloe | 👱‍♀️ | `1234` | Member |
| Theo | 🧒 | `1234` | Member |

## Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add it to `.env` as `RESEND_API_KEY`
4. In the Admin Panel → Settings, enter the grandparent email address
5. Use "Send Test" to verify the email looks correct

> **Note**: During development, Resend's free tier sends from `onboarding@resend.dev`. For production, add and verify your own domain.

## Email Schedule

| Email | Schedule | Condition |
|-------|----------|-----------|
| Weekly Digest | Configurable (default Sunday 9:00 AM UTC) | Always sent |
| Friday Reminders | Every Friday 10:00 AM UTC | Only to members who haven't posted this week |

## Project Structure

```
family-hub/
├── client/                  React frontend (Vite + Tailwind)
│   └── src/
│       ├── components/
│       │   ├── LoginScreen.jsx    — Avatar grid + PIN pad
│       │   ├── PostUpdate.jsx     — Update form with photo upload
│       │   ├── WeekFeed.jsx       — This week's updates + reactions
│       │   ├── MyHistory.jsx      — Member's own update history
│       │   ├── AdminPanel.jsx     — Admin settings & controls
│       │   ├── DigestPreview.jsx  — Iframe preview of digest email
│       │   ├── MemberManager.jsx  — Add/remove/reset members
│       │   └── Layout.jsx         — Nav shell
│       └── App.jsx
├── server/
│   ├── index.js             Express app + cron setup
│   ├── db.js                SQLite init + seed data
│   ├── routes/
│   │   ├── auth.js          Login/logout/me
│   │   ├── updates.js       CRUD + reactions
│   │   └── admin.js         Admin endpoints
│   ├── email/
│   │   ├── digest.js        Build digest HTML + send
│   │   └── reminder.js      Build reminder email + send
│   └── middleware/
│       └── auth.js          requireAuth / requireAdmin
├── uploads/                 Photo storage (gitignored)
├── family-hub.db            SQLite database (auto-created)
├── .env.example
└── package.json
```

## Design Philosophy

The UI uses:
- **Caveat** (Google Fonts) — handwritten headers for a personal feel
- **Source Serif 4** — warm, readable body text
- **Cream backgrounds** (`#FFF8F0`) — soft, paper-like aesthetic
- Each family member has a unique accent color
- Mobile-first, large touch targets
- Emoji-based avatars — simple and expressive

## API Reference

```
POST   /api/auth/login              Login with memberId + PIN
POST   /api/auth/logout             Clear session
GET    /api/auth/me                 Current user

GET    /api/members                 All members (no PINs)
GET    /api/updates/week            This week's updates + reactions
GET    /api/updates/mine            Current user's history
POST   /api/updates                 Post update (multipart)
POST   /api/updates/:id/react       Toggle emoji reaction

GET    /api/admin/settings          Get digest settings
PUT    /api/admin/settings          Update digest settings
POST   /api/admin/preview           Get digest HTML preview
POST   /api/admin/send-test         Send test digest to email
POST   /api/admin/send-now          Send digest immediately
POST   /api/admin/send-reminders    Send Friday reminders now
GET    /api/admin/members           All members (admin view)
POST   /api/admin/members           Add new member
DELETE /api/admin/members/:id       Remove member
PUT    /api/admin/members/:id/reset-pin   Reset PIN
```
