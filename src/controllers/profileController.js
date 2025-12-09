// Controller für Profil- und Fortschrittsdaten (MVP)

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
      level: userLevel
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

    // XP- und Level-Daten aus dem User-Objekt auslesen (falls vorhanden)
    const userXp = typeof req.user.xp === "number" ? req.user.xp : 0;
    const userLevel = typeof req.user.level === "number" ? req.user.level : 1;

    // Vereinfachung für den Anfang: Jedes Level braucht 100 XP
    const xpPerLevel = 100;

    // XP-Grenze, ab wann das aktuelle Level beginnt (z.B. Level 2 startet ab 100 XP)
    const levelStartXp = (userLevel - 1) * xpPerLevel;

    // XP-Grenze, ab wann das nächste Level beginnt
    const nextLevelStartXp = userLevel * xpPerLevel;

    // Wie viele XP hat der User schon im aktuellen Level gesammelt?
    const xpIntoCurrentLevel = userXp - levelStartXp;

    // Wie viele XP fehlen noch bis zum nächsten Level? (nicht negativ werden lassen)
    let xpToNextLevel = nextLevelStartXp - userXp;
    if (xpToNextLevel < 0) {
      xpToNextLevel = 0;
    }

    // Abgeschlossene Games aus dem User-Objekt (falls vorhanden, sonst leeres Array)
    const completedGames = Array.isArray(req.user.completedGames)
      ? req.user.completedGames
      : [];

    // Fortschrittsübersicht mit Level, XP und Liste der abgeschlossenen Spiele (später erweiterbar)
    const progress = {
      level: userLevel,
      xp: userXp,
      nextLevelXp: nextLevelStartXp,
      xpToNextLevel,
      xpIntoCurrentLevel,
      completedGames
    };

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
