## Beitrag von Lu-Nes

Verantwortungsbereiche von [Lu-Nes](https://github.com/Lu-Nes) als **Backend Lead und Projektmanagerin**:

- Planung und Strukturierung der Backend-Entwicklung
- JWT-basierte Authentifizierung und Benutzerverwaltung
- User-, Profil- und Spiele-Endpunkte
- Speicherung von Spielfortschritt, XP und Levelständen
- testorientierte Entwicklung im TDD-light-Ansatz mit Vitest und Supertest
- Anbindung des bestehenden React-Frontends an die API
- Deployment des Backends
- zusätzliche Übernahme des Frontend-Deployments

## Zentrale Funktionen

- Registrierung, Login und JWT-Authentifizierung
- geschützte Benutzer- und Profilrouten
- öffentliche und geschützte Spiele-Endpunkte
- Speicherung von Spielergebnissen und Spielfortschritt
- XP- und Level-System
- Funktion zum Zurücksetzen des Passworts
- Mailversand über Gmail API mit SMTP-Fallback
- Rate Limiting für sensible Endpunkte
- automatisierte Backend- und API-Tests

## Tech-Stack

- Node.js
- Express
- MongoDB und Mongoose
- JSON Web Tokens
- Vitest und Supertest
- Gmail API und Nodemailer
- Render

## Repositories

- **Backend:** Dieses Repository
- **Frontend:** [ProtocolBlackout/frontend](https://github.com/ProtocolBlackout/frontend)
- **Spieldaten:** [ProtocolBlackout/games](https://github.com/ProtocolBlackout/games)

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

Zentrale Backend-Funktionen wurden im Rahmen eines TDD-light-Ansatzes testorientiert entwickelt.

Hinweis: Tests laden ENV aus `.env.test`.

Hinweis: Für Tests kann der Rate Limiter deaktiviert werden:

- `RATE_LIMITER_DISABLED=true` (in `.env.test`)

---

## Deployment (Render Hinweise)

- Health Check Path: `/health`
- `trust proxy` ist gesetzt (relevant für Rate Limits hinter Proxies/Loadbalancern)
- Build Command: `npm install`
- Start Command: `npm start`
