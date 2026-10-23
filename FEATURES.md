# CodeTrack — Project Features

CodeTrack is a full-stack competitive programming companion. It connects to **Codeforces**, syncs your stats, and helps you track rating, contests, submissions, and progress in one place.

---

## Table of contents

1. [Overview](#overview)
2. [Authentication & security](#authentication--security)
3. [Landing (Home)](#landing-home)
4. [Dashboard](#dashboard)
5. [Profile](#profile)
6. [Analytics](#analytics)
7. [Contests](#contests)
8. [Settings](#settings)
9. [Codeforces integration](#codeforces-integration)
10. [Goals & achievements](#goals--achievements)
11. [UI / UX platform features](#ui--ux-platform-features)
12. [API surface](#api-surface)
13. [Tech stack](#tech-stack)

---

## Overview

| Area | What it does |
|------|----------------|
| **Auth** | Register, OTP email verify, JWT login/logout |
| **Dashboard** | Live CF overview: rating, streak, activity, charts |
| **Profile** | Personal info, avatar, CF connect/disconnect |
| **Analytics** | Deep stats, rating trend, contest table, activity |
| **Contests** | Upcoming rounds + your rated contest history |
| **Settings** | Account, appearance, notifications, sign out |
| **Sync** | Cache-first Codeforces sync for fast loads |

---

## Authentication & security

- **Registration** with email and password  
- **OTP email verification** before login (Nodemailer / Resend-style flow)  
- **JWT** session tokens stored client-side  
- **Bcrypt** password hashing  
- **Protected routes** for dashboard, profile, analytics, contests, settings  
- **Auth context** keeps token + user in sync (sidebar/navbar stay up to date)  
- **401 handling** clears session and redirects to login  
- Password change available via settings / user API  

---

## Landing (Home)

Public marketing page with:

- Hero and product branding (**CodeTrack**)  
- Feature highlights (account linking, progress tracking, contests)  
- How it works, FAQ, testimonials, CTA  
- Light/dark-aware layout  
- Navigation to Login / Register / Dashboard (when signed in)  

---

## Dashboard

Central hub after login.

### Metrics

- Current **rating**, **max rating**, **rank**, **contribution**  
- **Problems solved** (with difficulty breakdown when synced)  
- **Contest count**  
- **Current / longest streak**  
- Last sync time  

### Widgets

- **Rating chart** (Codeforces rating history)  
- **Recent activity** (latest submissions from DB)  
- **Topic / tag progress** (from accepted submissions)  
- Soft **refresh** (Ctrl/Cmd+R) without full page reload  
- Cache-first load: recent sync serves instantly; force refresh hits Codeforces  

### Empty / error states

- Prompt to connect Codeforces if none linked  
- Retry / force sync without hard page reload  

---

## Profile

### Personal information

- Name, email (read-only), bio, location  
- Social links: website, GitHub, Twitter/X  
- Avatar with initials fallback  
- Edit / save / cancel flow  
- Formatted “member since” date  

### Platform connections

- **Codeforces**  
  - Enter handle → connect (fast `user.info` + background full sync)  
  - Shows handle, rating, max rating, rank (CF color-coded)  
  - Open Codeforces profile link  
  - Disconnect  
- **LeetCode** username (optional, saved for display)  

### Security tab

- Registered email and join date  
- Guidance for password management  

### CF statistics block

- Current / max rating, rank / max rank when connected  

---

## Analytics

Performance deep-dive.

### Summary cards

- Current rating, max rating, problems solved, contests  
- Rating change vs last contest  
- Official **Codeforces rating colors** + monospace numerals  

### Charts & tables

- **Rating trend** chart over time  
- **Contest history** table  
  - Search, filter (up / down / flat)  
  - Rank, rating change, old → new rating  
  - Links to Codeforces contests  
- **Activity overview**  
  - Problems this week / month  
  - Streaks, contests entered, weekly goal progress  

### Data sources

- User cache + live **rating history** from Codeforces  
- Heatmap / submission aggregation from MongoDB  

---

## Contests

### Upcoming contests

- Next Codeforces rounds (sorted soonest-first, capped for speed)  
- Live **countdown**, duration, start time  
- Type badges (Div. 1–4, Edu, Global, etc.)  
- “Soon” / “Next up” highlights  
- Search + type filters  
- Open contest on Codeforces  

### Contest history

- Your rated contests (newest first)  
- Net rating, wins/losses summary  
- Search + up/down/flat filters  
- CF-colored ratings and deltas  
- Independent loading so a slow history call does not blank the page  

### Page KPIs

- Upcoming count, time until next, your contest count, net rating  

---

## Settings

### Account information

- Dynamic name, email, phone, location, bio  
- Avatar upload with preview  
- Formatted join date  
- Edit / save with validation  

### Appearance

- **Theme:** Light / Dark / System (live, persisted)  
- **Accent color** schemes  
- **Font size** (via CSS variable, layout-safe)  
- Live preview + reset to defaults  

### Notifications

- Toggles for channels (email, in-app, sound)  
- CP-focused prefs: contests, rating changes, streak reminders  
- Security / product update prefs  
- Search, All / Active / Inactive filters  
- Enable all / disable all / test notification  
- Preferences saved in `localStorage`  

### Account / sign out

- Live user card (name, email, role)  
- Session “last active” clock  
- Confirm dialog → logout → login redirect  
- Switch account, security, help shortcuts  

---

## Codeforces integration

### Connect & sync

| Step | Behavior |
|------|----------|
| Connect | Single `user.info` call; profile fields saved immediately |
| Background sync | Submissions + rating + streaks after connect |
| Dashboard / analytics | Cache-first (TTL ~5 min); `?refresh=true` or refresh button forces sync |
| Incremental sync | Recent submissions only when already synced; fuller pull on first sync |

### Data pulled

- User info (rating, max rating, rank, avatar, contribution)  
- Rating / contest history (`user.rating`)  
- Submissions (`user.status`, limited counts for speed)  
- Contest list for upcoming (`contest.list`)  

### Client helpers

- Shared CF rating color / rank helpers (`client/src/lib/codeforces.js`)  
- Monospace rating display (`.cf-mono`) for a competitive-programming look  

### Reliability

- Axios client with keep-alive + timeouts  
- Parallel CF requests where possible  
- Fallback to cached User document when CF is slow or down  

---

## Unified submissions (Phase 1)

Multi-platform submission architecture (Codeforces live; LeetCode public import):

- **Submission** — unified metadata + legacy CF fields for dashboard/analytics
- **SubmissionSource** — optional source code (owner/admin only)
- **PlatformConnection** — sync status per platform (no auth secrets)
- Unique key: `(userId, platform, platformSubmissionId)`
- APIs: `GET /api/submissions`, `/:id`, `/:id/source`, plus `/recent`
- Docs: [docs/UNIFIED_SUBMISSIONS.md](./docs/UNIFIED_SUBMISSIONS.md)

## LeetCode (Phase 2)

Public GraphQL integration (no API key, no session cookies):

- Connect / disconnect verified public profiles
- Import ~20 recent public submissions into the unified model
- Source code: **unsupported** in Phase 2 (requires private auth — not collected)
- Async sync jobs: `/api/platforms/leetcode/sync-*`
- UI: Profile connection card + Submissions explorer with platform filter
- Docs: [docs/LEETCODE_INTEGRATION.md](./docs/LEETCODE_INTEGRATION.md)

## Code analysis (Phase 3)

Static analysis of submission source (platform-agnostic):

- Language ID + support level (`full` / `partial` / `unsupported`)
- Algorithm & data-structure detection with evidence + confidence
- Estimated time complexity and **auxiliary** space (excludes input)
- Rule-based findings and optimization suggestions
- Versioned `CodeAnalysis` records with hash + analyzer-version caching
- APIs: analyze, latest, history, retry; attach source via `PUT .../source`
- UI: Submissions → **Analyze** panel (paste source when missing)
- Docs: [docs/CODE_ANALYSIS.md](./docs/CODE_ANALYSIS.md)

Out of scope for Phase 3: AI review, code execution, rewriting, sandboxed benchmarks.

## Goals & achievements

Backend support (API + models) for:

### Goals

- Types: rating, problems solved, streak, contests participated  
- Target value, current value, optional deadline, completion flag  

### Achievements

- Badge IDs per user (e.g. first solve, specialist, 100 problems)  
- Unique unlocks per user  

> UI for goals/achievements may be partial; APIs and models are in place for expansion.

---

## UI / UX platform features

- **Light / dark / system** theme across the app  
- **Responsive** sidebar + top bar (mobile menu)  
- **Command search** (Ctrl/Cmd+K) for in-app page navigation  
- **Notifications bell** — upcoming contests + CF connect prompts  
- Sidebar / avatar menu with **live name, email, CF handle + rating**  
- Toast feedback (Sonner)  
- Loading skeletons / empty states / soft retries  
- Typography: DM Sans (UI) + JetBrains Mono (ratings)  

---

## API surface

Base path: `/api`

| Mount | Purpose |
|-------|---------|
| `/auth` | Register, login, OTP verify / resend |
| `/users` | Profile, password, Codeforces sync |
| `/codeforces` | Connect handle, rating history |
| `/dashboard` | Aggregated dashboard payload (`?refresh=true`) |
| `/analytics` | Stats, heatmap, problem distribution |
| `/contests` | Upcoming list, personal history |
| `/submissions` | Unified list, source, analyze / analysis history |
| `/analyses` | Analysis detail + retry |
| `/platforms/leetcode` | LeetCode connect / sync |
| `/goals` | CRUD goals |
| `/achievements` | User achievements |
| `/settings` | App settings |
| `/health` | Health check |
| `/uploads` | Static avatar files |

All authenticated routes expect `Authorization: Bearer <JWT>`.

---

## Tech stack

### Frontend (`client/`)

- React + Vite  
- Tailwind CSS v4  
- React Router  
- Axios  
- Recharts  
- Lucide icons  
- Radix / shadcn-style UI primitives  
- Sonner toasts  

### Backend (`server/`)

- Node.js + Express  
- MongoDB + Mongoose  
- JWT + bcrypt  
- Multer (avatars)  
- Codeforces public API  
- Email OTP (Nodemailer / Resend-compatible)  

### Data models (high level)

- **User** — auth, CF fields, streaks, cached stats, avatar  
- **Submission** / **SubmissionSource** — unified CF + LeetCode attempts + optional source  
- **CodeAnalysis** — versioned static analysis results  
- **PlatformConnection** / **SyncJob** — platform link + background sync  
- **Goal** — personal targets  
- **Achievement** — unlocked badges  

---

## Feature map by page

```
Home ─────────── Marketing & onboarding
Login / Register / Verify OTP ── Auth
Dashboard ────── Rating, streak, activity, charts
Profile ──────── Account + CF / LeetCode links
Analytics ────── Deep stats + contest table
Contests ─────── Upcoming + history
Submissions ──── Unified explorer + code analysis
Settings ─────── Account, theme, notifications, logout
```

---

## Notes for contributors

- Prefer **cache-first** reads; force CF sync only on explicit refresh or stale TTL.  
- Keep CF rating colors consistent via `lib/codeforces.js`.  
- Do not import icons that are missing from the installed `lucide-react` version (e.g. use `GitBranch` instead of `Github` if needed).  
- Contests and analytics should use `Promise.allSettled` so one failed CF call does not blank the whole page.
- Analysis must remain static — never execute submitted source or shell out to compilers.

---

*Last updated for Phases 1–3 (unified submissions, LeetCode public import, code analysis engine).*
