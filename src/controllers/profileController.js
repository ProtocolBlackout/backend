// Controller für Profil- und Fortschrittsdaten (MVP)

// Hilfsfunktion: Aus XP das Level bestimmen
// HINWEIS: Nur provisorisch, kann das Gamedevelopment gern noch anpassen und danach den Hinweis hier löschen ;)
function getLevelForXp(xp) {
  if (xp < 100) {
    return 1;
  }
  if (xp < 300) {
    return 2;
  }
  if (xp < 600) {
    return 3;
  }
  return 4;
}

// Hilfsfunktion: XP-Grenzen pro Level (MVP-Version)
// Level 1: 0-99
// Level 2: 100-299
// Level 3: 300-599
// Level 4: 600+ (im MVP aktuell "max", nächstes Level gibt es noch nicht)
// HINWEIS: Nur provisorisch, kann das Gamedevelopment gern noch anpassen und danach den Hinweis hier löschen ;)
function getLevelBounds(level) {
  if (level === 1) return { start: 0, next: 100 };
  if (level === 2) return { start: 100, next: 300 };
  if (level === 3) return { start: 300, next: 600 };
  return { start: 600, next: null };
}

// Baut die Progress-Antwort so auf, wie sie auch GET /profile/progress zurückgibt
function buildProgress(user) {
  const userXp = typeof user.xp === "number" ? user.xp : 0;
  const userLevel = typeof user.level === "number" ? user.level : 1;

  const bounds = getLevelBounds(userLevel);
  const levelStartXp = bounds.start;
  const nextLevelStartXp = bounds.next ?? userXp;

  const xpIntoCurrentLevel = userXp - levelStartXp;

  let xpToNextLevel = bounds.next ? bounds.next - userXp : 0;
  if (xpToNextLevel < 0) {
    xpToNextLevel = 0;
  }

  const completedGames = Array.isArray(user.completedGames)
    ? user.completedGames
    : [];

  return {
    level: userLevel,
    xp: userXp,
    nextLevelXp: nextLevelStartXp,
    xpToNextLevel,
    xpIntoCurrentLevel,
    completedGames
  };
}

// Basis-Profildaten für eingeloggte User zurückgeben
export const getProfile = (req, res) => {
  try {
    // Falls aus irgendeinem Grund kein User am Request hängt
    if (!req.user) {
      return res.status(401).json({
        message: "Nicht autorisiert"
      });
    }

    // XP- und Level-Werte aus dem User-Objekt auslesen (falls vorhanden)
    const userXp = typeof req.user.xp === "number" ? req.user.xp : 0;
    const userLevel = typeof req.user.level === "number" ? req.user.level : 1;

    const safeUser = {
      id: req.user._id.toString(),
      username: req.user.username,
      email: req.user.email,
      xp: userXp,
      level: userLevel,
      preferredTheme: req.user.preferredTheme ?? "dark"
    };

    return res.status(200).json({
      message: "Profil erfolgreich geladen",
      user: safeUser
    });
  } catch (error) {
    console.error("Fehler bei getProfile:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Laden des Profils aufgetreten"
    });
  }
};

// Fortschrittsdaten für eingeloggte User zurückgeben
export const getProfileProgress = (req, res) => {
  try {
    // Falls aus irgendeinem Grund kein User am Request hängt
    if (!req.user) {
      return res.status(401).json({
        message: "Nicht autorisiert"
      });
    }

    const progress = buildProgress(req.user);

    return res.status(200).json({
      message: "Fortschritt erfolgreich geladen",
      progress
    });
  } catch (error) {
    console.error("Fehler bei getProfileProgress:", error);
    return res.status(500).json({
      message: "Es ist ein Fehler beim Laden des Fortschritts aufgetreten"
    });
  }
};

// Fortschrittsdaten für eingeloggte User aktualisieren (PATCH /profile/progress)
export const updateProfileProgress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Nicht autorisiert"
      });
    }

    const { xpChange, completedGames, addCompletedGame } = req.body;

    // Aktuelle Werte (Fallbacks)
    const currentXp = typeof req.user.xp === "number" ? req.user.xp : 0;
    let newXp = currentXp;

    // XP nur als Änderung erlauben
    // Vorteil: Der Client kann nicht versehentlich einen alten XP-Stand überschreiben
    if (
      typeof xpChange === "number" &&
      Number.isFinite(xpChange) &&
      xpChange !== 0
    ) {
      newXp = currentXp + xpChange;
      if (newXp < 0) {
        newXp = 0;
      }
    }

    // completedGames: entweder komplett ersetzen, oder ein Game hinzufügen
    let newCompletedGames = Array.isArray(req.user.completedGames)
      ? req.user.completedGames
      : [];

    if (Array.isArray(completedGames)) {
      newCompletedGames = completedGames.filter(
        (gameId) => typeof gameId === "string" && gameId.trim().length > 0
      );
    }

    if (typeof addCompletedGame === "string" && addCompletedGame.trim()) {
      if (!newCompletedGames.includes(addCompletedGame)) {
        newCompletedGames = [...newCompletedGames, addCompletedGame];
      }
    }

    // Duplikate entfernen
    newCompletedGames = Array.from(new Set(newCompletedGames));

    // Level passend zu XP neu berechnen
    const newLevel = getLevelForXp(newXp);

    // Wenn keine gültigen Update-Daten vorhanden sind, 400 zurückgeben
    const hasAnyUpdate =
      (typeof xpChange === "number" && Number.isFinite(xpChange)) ||
      Array.isArray(completedGames) ||
      (typeof addCompletedGame === "string" && addCompletedGame.trim());

    if (!hasAnyUpdate) {
      return res.status(400).json({
        message: "Keine gültigen Fortschrittsdaten gesendet"
      });
    }
    // Speichern
    req.user.xp = newXp;
    req.user.level = newLevel;
    req.user.completedGames = newCompletedGames;

    await req.user.save();

    const progress = buildProgress(req.user);

    return res.status(200).json({
      message: "Fortschritt aktualisiert",
      progress
    });
  } catch (error) {
    console.error("Fehler bei updateProfileProgress:", error);
    return res.status(500).json({
      message:
        "Es ist ein Fehler beim Aktualisieren des Fortschritts aufgetreten"
    });
  }
};
