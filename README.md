# Protocol Blackout – Backend

Backend-API für **Protocol Blackout** (Node + Express + MongoDB) mit JWT-Auth, Rate Limiting, Mail-Service (Gmail API bevorzugt, SMTP-Fallback) und Tests (Vitest + Supertest).

---

## Lokales Setup

### 1) Install

```bash
npm install
```

### 2) ENV anlegen

Lege im Backend-Root eine `.env` an und nutze `env.sample` als Vorlage.

**Pflicht:**

- `MONGODB_URL`
- `DATABASE`
- `JWT_SECRET`

**Optional (je nach Umgebung):**

- `PORT` (Default: 3000)
- `JWT_EXPIRES_IN` (Fallback: `1h`)
- `FRONTEND_PUBLIC_URL` (CORS)
- `BACKEND_PUBLIC_URL`

**Mail (optional):**

- Gmail API: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_REDIRECT_URI`, optional `GMAIL_FROM`
- SMTP-Fallback: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### 3) Starten (Dev)

```bash
npm run dev
```

### 4) Starten (Prod/Render)

```bash
npm start
```

---

## NPM Scripts

```bash
npm run dev
npm test
npm start
npm run format
npm run format:check
```

---

## API

### Öffentlich

- `GET /health` → `{ "status": "ok" }`
- `GET /games`
- `GET /games/:id`
- `GET /games/:id/questions`
- `GET /games/password-cracker/config`
- `POST /auth/register` _(rate-limited)_
- `POST /auth/login` _(rate-limited)_
- `POST /auth/password-reset/request` _(rate-limited)_
- `POST /auth/password-reset/confirm` _(rate-limited)_
- `GET /auth/verify-email` _(rate-limited)_
- `POST /mail/contact` _(rate-limited)_

### Geschützt (JWT erforderlich)

Header:

```txt
Authorization: Bearer <token>
```

- `POST /games/:id/result`
- `GET /profile`
- `GET /profile/progress`
- `PATCH /profile/progress`
- `GET /auth/profile`
- `PATCH /auth/profile/theme`
- `DELETE /auth/profile`
- `POST /mail/test`

> Games können von Gästen angezeigt und gespielt werden (`/games`, `/games/:id`).  
> Speichern von Ergebnissen oder Fortschritt (`/games/:id/result`, `/profile`, `/profile/progress`) erfordert einen eingeloggten User.

---

## Tests

```bash
npm test
```

Hinweis: Tests laden ENV aus `.env.test`.

Hinweis: Für Tests kann der Rate Limiter deaktiviert werden:

- `RATE_LIMITER_DISABLED=true` (in `.env.test`)

---

## Deployment (Render Hinweise)

- Health Check Path: `/health`
- `trust proxy` ist gesetzt (relevant für Rate Limits hinter Proxies/Loadbalancern)
- Build Command: `npm install`
- Start Command: `npm start`
