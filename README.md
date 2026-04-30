<div align="center">
  <img src="./public/aloha.svg" alt="Aloha" width="96" height="96" />

  <h1>Aloha<span style="color:#4f46e5">.</span></h1>

  <p><em>The calm social media OS for people who'd rather be making the work than managing the posting of it.</em></p>

  <p>
    <a href="https://usealoha.app">usealoha.app</a>
    &nbsp;·&nbsp;
    <a href="https://usealoha.app/brand">Brand</a>
    &nbsp;·&nbsp;
    <a href="https://usealoha.app/manifesto">Manifesto</a>
  </p>
</div>

---

## What Aloha is

Aloha is a social media companion for creators, founders, and small teams who show up across many networks and would rather spend their energy on the work than on the logistics of posting it.

It's one composer that publishes everywhere, a calendar that breathes, a logic matrix that runs the small jobs you'd rather not think about, and an inbox that respects your attention. No dashboards that demand to be watched, no dark patterns that reward over-posting, no "explosive growth" anything.

## Why it exists

Most social tools are optimized to keep you posting more. We think that's the wrong goal. You don't need a louder megaphone — you need a quieter system so the signal you already have can get through.

Aloha is built around a few convictions:

- **Post less, say more.** The tool should earn its keep by saving you time, not demanding more of it.
- **Your voice, eight ways.** One post, formatted for every network, without losing what makes it yours.
- **The export button is the point.** Your posts, analytics, and audience belong to you. CSV, JSON, ICS — one click, no email-us-for-a-link.
- **We'll tell you to go elsewhere.** If another tool fits better, we'll say so.

<div align="center">
  <img src="./public/aloha.png" alt="" width="48" height="48" />
</div>

## What's inside

- **Composer** — write once, preview on every network, let Magic Refine trim where needed.
- **Calendar** — a month view that respects your timezone and shows you exactly what's going where and when.
- **Logic Matrix** — small, specific automations (welcome new subscribers, notify the team, weekly digests) that run in the background.
- **Inbox** — replies, mentions, and DMs from every channel, triaged in one place.
- **Link-in-bio** — a clean public page at `usealoha.app/u/yourhandle` for the links in your profile.
- **Analytics & exports** — real numbers, without the theater, and always yours to take with you.

The product lives at **[usealoha.app](https://usealoha.app)**. Free forever for three channels; paid plans for teams, agencies, and heavier workloads.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, React 19)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Drizzle ORM](https://orm.drizzle.team) on PostgreSQL
- [Auth.js / NextAuth v5](https://authjs.dev)
- [Upstash QStash](https://upstash.com/docs/qstash) for scheduled publishing
- [Google Gemini](https://ai.google.dev) for Magic Refine
- [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Outfit](https://fonts.google.com/specimen/Outfit), self-hosted via `next/font`

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) (or Node 20+ with your package manager of choice)
- A PostgreSQL database (local, [Neon](https://neon.tech), [Supabase](https://supabase.com), or similar)
- An [Upstash QStash](https://upstash.com/docs/qstash) account for scheduled posts
- A [Google AI Studio](https://aistudio.google.com/) key for Gemini
- OAuth app credentials for whichever providers you want to enable

### Install

```bash
git clone https://github.com/your-org/aloha.git
cd aloha
bun install
```

### Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
# Core
DATABASE_URL=postgres://...
APP_URL=http://localhost:5010
AUTH_SECRET=$(openssl rand -base64 32)

# OAuth (any subset you want to enable)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_LINKEDIN_ID=
AUTH_LINKEDIN_SECRET=
AUTH_TWITTER_ID=
AUTH_TWITTER_SECRET=

# AI
OPENROUTER_API_KEY=

# Scheduled jobs
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```

### Database

Push the schema to your database:

```bash
bunx drizzle-kit push
```

### Run it

```bash
bun dev
```

The app is now live at [http://localhost:5010](http://localhost:5010).

---

<div align="center">
  <sub>Made with uncomfortable amounts of coffee and care. · <a href="https://usealoha.app">usealoha.app</a></sub>
</div>
