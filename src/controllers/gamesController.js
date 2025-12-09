// Games-Controller mit Mock-Daten und Ergebnis-Logik

// Mock-Daten für Games (später können diese aus der DB kommen)
const games = [
  {
    id: "1",
    title: "Terminal Breach",
    description: "Simulierter Einbruch in ein altes Terminalsystem.",
    difficulty: "medium",
    category: "network"
  },
  {
    id: "2",
    title: "Cipher Rush",
    description: "Kleine Cryptorätsel mit Zeitdruck.",
    difficulty: "easy",
    category: "crypto"
  },
  {
    id: "3",
    title: "Log Analyzer",
    description: "Logfiles nach verdächtigen Einträgen durchsuchen.",
    difficulty: "hard",
    category: "forensics"
  }
];

// Hilfsfunktion: Game mit ID finden
function findGameById(id) {
  return games.find((currentGame) => currentGame.id === id);
}

// Hilfsfunktion: Aus XP das Level bestimmen (MVP-Version)
// Später kann das Team hier andere Stufen/Regeln definieren
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

// GET /games - Liste aller Games
export const getAllGames = (req, res) => {
  // Gibt die komplette Liste der Mock-Games zurück
  res.status(200).json(games);
};

// GET /games/:id - einzelnes Game oder 404
export const getGameById = (req, res) => {
  const { id } = req.params;
  const game = findGameById(id);

  if (!game) {
    return res.status(404).json({
      message: "Game nicht gefunden!"
    });
  }

  res.status(200).json(game);
};

// POST /games/:id/result - Spielergebnis speichern (geschützte Route)
export const saveGameResult = async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

  const game = findGameById(id);

  // Wenn das Game nicht existiert, 404 zurückgeben
  if (!game) {
    return res.status(404).json({
      message: "Game nicht gefunden!"
    });
  }

  // User aus der authMiddleware (Mongoose-Dokument)
  const user = req.user;

  // Score für XP verwenden (Fallback 0, falls nichts, oder falscher Typ gesendet wird)
  const numericScore = typeof score === "number" ? score : 0;

  // Aktuelles MVP-Verhalten
  // - Jeder gespielte Run (egal wie oft) gibt XP (numericScore)
  // - completedGames enthält jedes Game maximal einmal
  // -> Später kann Team entscheiden, ob nur der erste Abschluss XP geben soll

  // XP erhöhen
  user.xp += numericScore;

  // Level anhand der aktuellen XP neu berechnen (MVP-Stufen)
  user.level = getLevelForXp(user.xp);

  // Game nur hinzufügen, wenn noch nicht vorhanden
  if (!user.completedGames.includes(id)) {
    user.completedGames.push(id);
  }

  // Änderungen speichern
  await user.save();

  // Antwort wie im Test erwartet
  res.status(200).json({
    message: "Ergebnis gespeichert (MVP-Platzhalter)"
  });
};
