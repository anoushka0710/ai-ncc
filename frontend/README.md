# NCC CAMS — Frontend

Next.js 14 frontend for the NCC CAMS backend (FastAPI).

## Project structure

```
src/
├── app/
│   ├── layout.tsx          ← Root layout (font, global CSS)
│   ├── globals.css         ← Design system tokens + utilities
│   ├── page.tsx            ← Redirects to /login or /dashboard
│   ├── login/
│   │   ├── page.tsx        ← ✅ Day 5 — Login page (DONE)
│   │   └── login.module.css
│   ├── dashboard/
│   │   └── page.tsx        ← ⏳ Day 6 — Dashboard + filters
│   ├── ncc/
│   │   └── new/page.tsx    ← ⏳ Day 7 — Add NCC form + AI suggestions
│   └── chat/
│       └── page.tsx        ← ⏳ Day 8 — AI chat interface
├── components/
│   ├── Navbar.tsx          ← ✅ Shared navbar
│   ├── Navbar.module.css
│   └── ProtectedLayout.tsx ← ✅ Auth guard + Navbar wrapper
├── lib/
│   ├── api.ts              ← ✅ Axios client + all API calls
│   └── auth.ts             ← ✅ Cookie/localStorage session store
└── types/
    └── index.ts            ← ✅ TypeScript types matching FastAPI schemas
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

The Next.js dev server runs on **http://localhost:3000**.

It automatically proxies `/api/*` → `http://localhost:8000/*` (your FastAPI backend).
So make sure your FastAPI backend is also running:

```bash
# In your backend folder
uvicorn main:app --reload
```

## Credentials (for testing)

| Role   | Username | Password |
|--------|----------|----------|
| Writer | admin    | admin123 |
| Reader | viewer   | view123  |

## API integration

All API calls are in `src/lib/api.ts`:
- `authApi.login()` → POST /auth/login
- `authApi.me()`    → GET /auth/me
- `nccApi.list()`   → GET /ncc
- `nccApi.create()` → POST /ncc
- `aiApi.suggest()` → POST /ai/suggest
- `aiApi.chat()`    → POST /ai/chat
- `filtersApi.getAll()` → GET /filters

JWT token is stored in a cookie and auto-attached to every request.
