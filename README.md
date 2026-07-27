# Protocol Blackout – Backend

Protocol Blackout ist eine interaktive Webanwendung rund um das Thema Hacking. Sie erklärt, was Hacking ist, wie es entstanden ist und sich im Laufe der Zeit entwickelt hat, beleuchtet ethische Fragen und zeigt, wie man sich vor Angriffen schützen kann.

Mit einem Quiz, einem Password Cracker und einem Phishing Finder werden zentrale Inhalte spielerisch vertieft. Die Spiele können auch ohne Benutzerkonto ausprobiert werden. Angemeldete Nutzerinnen und Nutzer können ihre Ergebnisse, ihren Spielfortschritt sowie gesammelte XP und erreichte Level speichern.

Dieses Repository enthält die REST API der Anwendung. Das Backend übernimmt unter anderem die Authentifizierung und Benutzerverwaltung, stellt Spiele und Spieldaten bereit, verarbeitet Spielergebnisse und Fortschritt und unterstützt Profil- sowie Mail-Funktionen.

## Live-Anwendung und API

- **Live-Anwendung:** [Protocol Blackout](https://protocol-blackout.onrender.com/)
- **API-Basis:** `https://protocol-blackout-backend-main.onrender.com`
- **Health Check:** [`GET /health`](https://protocol-blackout-backend-main.onrender.com/health)
- **Öffentliche Spieldaten:** [`GET /games`](https://protocol-blackout-backend-main.onrender.com/games)

## Projektkontext

Protocol Blackout entstand als gemeinsames Fullstack-Abschlussprojekt mit getrennten Repositories für Frontend, Backend und Spieldaten.

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

Pflicht:

- `MONGODB_URL`
- `DATABASE`
- `JWT_SECRET`

Optional – je nach Umgebung:

- `PORT` – Default: `3000`
- `JWT_EXPIRES_IN` – Fallback: `1h`
- `FRONTEND_PUBLIC_URL` – CORS
- `BACKEND_PUBLIC_URL`

Mail – optional:

- Gmail API: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_REDIRECT_URI`, optional `GMAIL_FROM`
- SMTP-Fallback: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### 3) Starten – Entwicklung

```bash
npm run dev
```

### 4) Starten – Produktion/Render

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
- `POST /auth/register` – rate-limited
- `POST /auth/login` – rate-limited
- `POST /auth/password-reset/request` – rate-limited
- `POST /auth/password-reset/confirm` – rate-limited
- `GET /auth/verify-email` – rate-limited
- `POST /mail/contact` – rate-limited

### Geschützt – JWT erforderlich

Header:

```text
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
>
> Das Speichern von Ergebnissen oder Fortschritt (`/games/:id/result`, `/profile`, `/profile/progress`) erfordert ein angemeldetes Benutzerkonto.

---

## Tests

```bash
npm test
```

Zentrale Backend-Funktionen wurden im Rahmen eines TDD-light-Ansatzes testorientiert entwickelt.

Hinweis: Tests laden die Umgebungsvariablen aus `.env.test`.

Für Tests kann der Rate Limiter deaktiviert werden:

```env
RATE_LIMITER_DISABLED=true
```

Diese Einstellung ist ausschließlich für `.env.test` vorgesehen und darf nicht in der Produktionsumgebung aktiviert werden.

---

## Deployment – Render

- produktiver Service: `protocol-blackout-backend-main`
- Deployment-Branch: `main`
- Health Check Path: `/health`
- `trust proxy` ist gesetzt und berücksichtigt Rate Limits hinter Proxies beziehungsweise Loadbalancern
- Build Command: `npm install`
- Start Command: `npm start`
