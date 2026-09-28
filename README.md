# CodeTrack

Full-stack competitive programming progress tracker focused on **Codeforces**.

## Stack

- **Client:** React 19 + Vite + Tailwind (`client/`)
- **Server:** Express 5 + MongoDB/Mongoose + Brevo email + Codeforces API (`server/`)

## Setup

### 1. Server

```bash
cd server
cp .env.example .env   # fill in values
npm install
npm run dev            # http://localhost:5000
```

### 2. Client

```bash
cd client
cp .env.example .env.local
npm install
npm run dev            # http://localhost:5173
```

Set `VITE_API_URL` to your API base including `/api`, e.g. `http://localhost:5000/api`.

## Main flows

1. Register → email OTP (Brevo) → verify → login  
2. Connect Codeforces handle on **Profile**  
3. View **Dashboard**, **Analytics**, and **Contests**  
4. Update account / password on **Settings**

## Notes

- Avatars are stored under `server/uploads/avatars` and served at `/uploads`.
- JWT auth uses `Authorization: Bearer <token>` from `localStorage`.
- Appearance/notification preference UIs that had no backend were removed from Settings to avoid fake features.
