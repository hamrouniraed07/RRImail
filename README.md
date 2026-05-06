# RRIMail — Institutional Mail Management System

A full-stack project composed of:

- **Backend**: `RRIMail-backend/nexusmail` (Node.js + Express + MongoDB)
- **Frontend**: `RRIMail-frontend` (React + TypeScript + Vite)

---

## Repository structure

```
RRIMail/
├─ RRIMail-backend/nexusmail/
└─ RRIMail-frontend/
```

---

## Backend (NexusMail)

Go to: `RRIMail-backend/nexusmail/`

Contains a detailed README with:
- features and workflow
- API endpoints
- environment variables
- quick start instructions

---

## Frontend (RRIMail UI)

Go to: `RRIMail-frontend/`

This project is a React + TypeScript + Vite frontend.

### How to run

```bash
cd RRIMail-frontend
npm install
npm run dev
```

### Environment configuration

The frontend uses:

- `VITE_API_BASE_URL`

If not set, it defaults to:

- `http://localhost:5000/api`

---

## Development notes

- Start **backend** first, then run the **frontend**.
- Ensure the backend CORS configuration allows the frontend origin.

---

## Docs

- Backend API documentation is described in `RRIMail-backend/nexusmail/swagger.yaml` (see backend README for details).

