# Coding Guidelines (Protocol Blackout)
Ein gemeinsamer Coding-Style für alle Teams: Backend, Frontend und Games.  
Diese Richtlinien gelten für alle Repositories der Protocol‑Blackout‑Organisation.

---

# 📘 Inhaltsverzeichnis
1. [Allgemeine Grundregeln](#allgemeine-grundregeln)  
2. [Projektstruktur & Dateien](#projektstruktur--dateien)  
3. [Frontend / React](#frontend--react)  
4. [Backend / Node / Express](#backend--node--express)  
5. [Games / Spiellogik](#games--spiellogik)  
6. [Tests](#tests)  
7. [Git & Branching](#git--branching)  
8. [Team-Absprachen](#team-absprachen)

---

# 1. Allgemeine Grundregeln

## Sprache & Benennung
- **Code** (Variablen, Funktionen, Dateien): Englisch  
- **Kommentare & UI-Texte**: Deutsch  
- Klar verständliche Namen, keine kryptischen Abkürzungen  
- **camelCase** für Variablen und Funktionen  
- **PascalCase** für React-Komponenten  
- Dateinamen sinnvoll benennen (z. B. `loginForm.jsx`, `gameQuiz.module.css`)

## Formatierung
- **Prettier** als Standard-Formatter im gesamten Projekt  
- Einheitliches Prettier-Setup für alle Repos  
- Einrückung: **2 Spaces**  
- Keine trailing commas  
- Automatische Formatierung vor jedem Commit empfohlen  

## Typen & Operatoren
- Immer `===` und `!==`  
- Keine losen Vergleiche  
- Immer `const` und `let`, kein `var`

---

# 2. Projektstruktur & Dateien

## Strukturregeln
- Pro Datei eine Hauptverantwortung  
- Wiederkehrende Ordner:
  - Backend: `controllers`, `models`, `routes`, `middlewares`, `helpers`
  - Frontend: `components`, `pages`, `hooks`, `context`, `styles`
  - Games: `games/<game>`, `state`, `lib`, `assets`

## Imports
- Keine ungenutzten Importe  
- Möglichst kurze relative Imports  
- Klare Ordnerstruktur zur Vermeidung tiefer Importketten

---

# 3. Frontend / React

## Komponenten
- Funktionale Komponenten (Arrow Functions)  
- Props klar und sprechend benennen  
- Inline-Eventhandler erlaubt bei kleinen Fällen  
- Keine Inline-Styles (außer zu Lernzwecken)

## CSS-Module Dateien
- Benennung im Format: **komponenteName.module.css**  
  - Beispiele:  
    - `gameQuiz.module.css`  
    - `loginForm.module.css`

## Barrierefreiheit (Accessibility)
- Semantische HTML-Elemente (echte Buttons/Links)  
- `aria-label` bei Icons ohne sichtbaren Text  
- Gute Kontraste  
- Keine CDNs – alles lokal einbinden

---

# 4. Backend / Node / Express

## Architektur
- Routen enthalten **keine Logik** → nur Weiterleitung  
- Controller führen Operationen aus  
- Helpers/Utils für gemeinsam verwendbare Logik  
- Saubere Trennung von Verantwortung

## Fehlerbehandlung
- `try/catch` oder zentrale Error-Middleware  
- Sinnvolle HTTP‑Statuscodes verwenden:
  - 200/201 OK/Created  
  - 400 Bad Request  
  - 401 Unauthorized  
  - 403 Forbidden  
  - 404 Not Found  
  - 500 Server Error

## Environment
- `.env` niemals committen  
- `env.sample` aktuell halten  

---

# 5. Games / Spiellogik

## Struktur
- UI und Spiellogik strikt trennen  
- Game-Loop, Timer & Regeln niemals im UI verstecken

## Game-State
- Ein zentraler Zustand pro Spiel:
```js
const gameState = {
  score: 0,
  lives: 3,
  timeLeft: 30,
  level: 1,
  isGameOver: false
}
```
- Keine verstreuten Variablen → alles in einem klaren Objekt

---

# 6. Tests
- Dateinamen: `*.test.js`  
- Verhalten testen statt Implementation  
- Wichtige Kernlogik bevorzugt testen (Punkte, Regeln, Berechnungen)

---

# 7. Git & Branching

## Branch-Strategie
- `main` → stabil (Release / Präsentation)  
- `dev` → Integration / gemeinsamer Entwicklungsstand  
- Feature-Branches:
  - `feature/<theme>`  
  - Beispiele:
    - `feature/login-system`
    - `feature/game-hub`
    - `feature/add-difficulty-settings`

## Commit-Nachrichten
- Deutsch, kurz, klar:
  - „Login-Route hinzugefügt“
  - „Spielstart-Button ergänzt“
  - „Fehler in Punkteberechnung behoben“

---

# 8. Team-Absprachen
- Vor größeren Änderungen im Trello kurz Bescheid geben  
- PR-Reviews entsprechend der Rollen:
  - Frontend → Niincheen  
  - Games → Bella  
  - Backend → LuNes  
- Kleine, logische PRs statt riesiger Monster‑PRs  
- Dokument ist ein „lebendes Dokument“ und darf angepasst werden

---

Diese Coding Guidelines gelten teamweit und können von allen gemeinsam weiterentwickelt werden.
