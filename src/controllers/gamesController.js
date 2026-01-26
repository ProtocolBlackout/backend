// Games-Controller mit Mock-Daten und Ergebnis-Logik

import { Question } from "../models/QuizQuestion.js";
import PasswordTarget from "../models/PasswordTarget.js";


// Mock-Daten für Games (Demo-Games + erste echte Projekt-Games)
// Die ersten drei Einträge sind Demo-Games für Entwicklung und Tests.
// Weitere Einträge (z. B. quiz-01) sind echte Projekt-Games.
const games = [
  {
    id: "1",
    title: "Terminal Breach (Demo)",
    description: "Demo-Game für Backend-Routen und Tests.",
    difficulty: "medium",
    category: "demo"
  },
  {
    id: "2",
    title: "Cipher Rush (Demo)",
    description: "Demo-Game für Backend-Routen und Tests.",
    difficulty: "easy",
    category: "demo"
  },
  {
    id: "3",
    title: "Log Analyzer (Demo)",
    description: "Demo-Game für Backend-Routen und Tests.",
    difficulty: "hard",
    category: "demo"
  },
  {
    id: "quiz-01",
    title: "Cybersecurity Quiz – Basics",
    description: "Beantworte 10 Fragen rund um grundlegende IT-Security.",
    difficulty: "easy",
    category: "quiz",
    xpReward: 50,
    maxTimeSeconds: 120,
    minScoreForWin: 7
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
  // Gibt die komplette Liste der Games zurück
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

  // Score für XP verwenden (Fallback 0, falls nichts oder falscher Typ gesendet wird)
  const numericScore = typeof score === "number" ? score : 0;

  // Aktuelles MVP-Verhalten:
  // - Jeder gespielte Run (egal wie oft) gibt XP (numericScore)
  // - completedGames enthält jedes Game maximal einmal
  // -> Später kann das Team entscheiden, ob nur der erste Abschluss XP geben soll

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

// GET /games/:id/questions - liefert eine Auswahl von (max.) 10 Fragen für ein Game
export const getQuestionsForQuiz = async (req, res) => {
  const { id } = req.params; // erwartet gameId wie 'quiz-01' oder "1" je nach Verwendung

  try {
    // Versuche, 10 zufällige Fragen aus der DB zu holen, die zur gameId passen
    let questions = await Question.aggregate([
      { $match: { gameId: id } },
      { $sample: { size: 10 } },
    ]);

    // Wenn keine Fragen für die konkrete gameId existieren, versuche mit Kategorie "quiz"
    if ((!questions || questions.length === 0) && id) {
      questions = await Question.aggregate([
        { $match: { category: "quiz" } },
        { $sample: { size: 10 } },
      ]);
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: "Fragen nicht gefunden" });
    }

    // Debug-Logging (kann bei Bedarf entfernt werden):
    try {
      const ids = questions.map((q) => q.id || q._id).slice(0, 5);
      console.log(
        `GET /games/${id}/questions -> ${
          questions.length
        } docs (sample ids: ${JSON.stringify(ids)})`
      );
    } catch (e) {
      // ignore logging errors
    }

    // Mappe DB-Form in das Frontend-freundliche Format
    const mapped = questions.map((q) => ({
      gameId: q.gameId || id,
      questionText: q.question,
      answers: q.options,
      correctIndex:
        typeof q.correctIndex === "number"
          ? q.correctIndex
          : q.options
          ? q.options.indexOf(q.answer)
          : -1,
    }));

    return res.status(200).json(mapped);
  } catch (error) {
    console.error("Fehler beim Laden der Fragen:", error);
    return res.status(500).json({ message: "Fehler beim Laden der Fragen" });
  }
};

export const getPasswordGameConfig = async (req, res) => {
  try {
    // Holt einfach alles, was du manuell eingetragen hast
    const targets = await PasswordTarget.find({});
    
    // Sicherheitshalber prüfen, ob was da ist
    if (!targets || targets.length === 0) {
      return res.status(404).json({ message: "Keine Ziele in der Datenbank gefunden!" });
    }

    res.status(200).json({ targets });

  } catch (error) {
    console.error("Fehler beim Laden der Password-Targets:", error);
    res.status(500).json({ message: "Server-Fehler" });
  }
};