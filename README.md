# Telegram Scheduler

Schedule Telegram messages once, daily, or weekly — powered by Next.js 14, Firebase Firestore, and Vercel Cron.

## Features

- Schedule messages to any Telegram chat, group, or channel
- Recurring options: once / daily / weekly
- Live message list with status (pending / sent / failed)
- Cron job fires every minute via Vercel Cron
- Secured `/api/cron` endpoint with `CRON_SECRET`

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd telegram-scheduler
npm install
```

### 2. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Run `/newbot` and follow the steps
3. Copy the **Bot Token**

### 3. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create project
2. Enable **Firestore Database** (start in production mode)
3. Go to **Project Settings → Service Accounts → Generate New Private Key**
4. Download the JSON file — you'll need `project_id`, `client_email`, and `private_key`

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`.

> **Note on `FIREBASE_PRIVATE_KEY`:** Paste the key exactly as it appears in the JSON file, including the `\n` characters. Wrap in double quotes in the `.env.local` file.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Vercel Cron won't fire locally. To test the cron manually, call:
> ```
> GET /api/cron
> Authorization: Bearer your_cron_secret
> ```

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Vercel will automatically pick up the cron config from `vercel.json` and trigger `/api/cron` every minute.

---

## Project Structure

```
/
├── app/
│   ├── page.tsx              # Main UI
│   ├── layout.tsx            # Root layout
│   ├── globals.css
│   └── api/
│       ├── schedule/route.ts # POST: save message, GET: list messages
│       └── cron/route.ts     # Vercel Cron handler
├── components/
│   ├── MessageForm.tsx       # Schedule form
│   └── MessageList.tsx       # Messages table
├── lib/
│   ├── firebase.ts           # Firebase Admin init
│   └── telegram.ts           # Telegram Bot API
├── types/
│   └── index.ts              # Shared TypeScript types
├── vercel.json               # Cron schedule config
└── .env.example
```

---

## Firestore Collection Schema

Collection: `scheduled_messages`

| Field | Type | Description |
|---|---|---|
| chatId | string | Telegram chat/group ID |
| message | string | Message text (HTML supported) |
| scheduledAt | string | ISO 8601 datetime |
| recurring | string | `once` / `daily` / `weekly` |
| status | string | `pending` / `sent` / `failed` |
| createdAt | string | ISO 8601 |
| sentAt | string? | When it was sent |
| errorMessage | string? | Error details if failed |
| nextRunAt | string? | Next scheduled run for recurring |

---

## Security

- The `/api/cron` endpoint requires `Authorization: Bearer <CRON_SECRET>` 
- Vercel automatically adds this header when invoking cron jobs
- Firebase Admin SDK runs server-side only — credentials are never exposed to the client
