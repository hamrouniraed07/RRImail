-m "another commit"# RRIMail Frontend — React + TypeScript (Vite)

Frontend UI for the **RRIMail / NexusMail** institutional mail management system.

---

## Tech Stack

- React 18
- TypeScript
- Vite

---

## Prerequisites

- Node.js (LTS recommended)
- Backend running (recommended) at `http://localhost:5000` for local development

---

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Start the dev server

```bash
npm run dev
```

Then open the URL shown in your terminal (typically `http://localhost:5173`).

---

## Environment Variables

The frontend reads the backend base URL from:

- `VITE_API_BASE_URL`

If not provided, it defaults to:

- `http://localhost:5000/api`

Example `.env` for development:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Authentication Flow (Login / Signup)

The UI calls these backend endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register`

After successful login/registration, tokens are stored in `localStorage`:

- `accessToken`
- `refreshToken`

And the user is stored as:

- `currentUser` (JSON)

---

## Project Scripts

- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run preview` — preview production build

---

## Notes / Troubleshooting

- If login/signup fails, verify the backend is running and that CORS allows your frontend origin.
- Make sure `VITE_API_BASE_URL` points to the correct backend host and port.

