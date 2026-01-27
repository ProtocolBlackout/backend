// Games-Controller mit Mock-Daten und Ergebnis-Logik

import { Question } from "../models/QuizQuestion.js";
import PasswordTarget from "../models/PasswordTarget.js";

// Mock-Daten für Games (MVP)
// Wichtig: Die IDs müssen zu den Frontend-localGames passen (quiz, cracker, phishing-finder)
const games = [
  {
    id: "quiz",
    title: "Quiz",
    description: "Teste dein Wissen rund um das Thema Hacking",
    category: "quiz"
  },
  {
    id: "cracker",
    title: "Passwort Cracker",
    description: "Na schaffst du es unsere Passwörter herauszufinden",
    category: "password-cracker"
  },
  {
    id: "phishing-finder",
    title: "Phishing Finder",
    description: "Erkenne gefährliche Mails.",
    category: "phishing"
  }
];

// Hilfsfunktion: Game mit ID finden
function findGameById(id) {
  return games.find((currentGame) => currentGame.id === id);
}

// Hilfsfunktion: Detaildaten für ein Game zusammenbauen (MVP)
// - instructions kommen aktuell aus dem Frontend-Stand (damit es konsistent bleibt)
// - links zeigen, welche API-Endpunkte zum Game gehören
function buildGameDetails(game) {
  if (!game) return null;

  if (game.id === "quiz") {
    return {
      ...game,
      instructions: [
        "Seite 1: Lies die Frage sorgfältig.",
        "Seite 2: Wähle die beste Antwort. Du hast 60 Sekunden pro Frage."
      ],
      links: {
        questions: `/games/${game.id}/questions`
      }
    };
  }

  if (game.id === "cracker") {
    return {
      ...game,
      instructions: [
        "Seite 1: Du hast begrenzte Versuche.",
        "Seite 2: Nutze Hinweise und Mustererkennung."
      ],
      links: {
        config: "/games/password-cracker/config"
      }
    };
  }

  if (game.id === "phishing-finder") {
    return {
      ...game,
      instructions: ["Spiel starten und Mails prüfen."],
      links: {}
    };
  }

  return {
    ...game,
    links: {}
  };
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

  const details = buildGameDetails(game);
  res.status(200).json(details);
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
  const { id } = req.params; // erwartet gameId wie "quiz" (Frontend-ID)

  try {
    // Versuche, 10 zufällige Fragen aus der DB zu holen, die zur gameId passen
    let questions = await Question.aggregate([
      { $match: { gameId: id } },
      { $sample: { size: 10 } }
    ]);

    // Wenn keine Fragen für die konkrete gameId existieren, versuche mit Kategorie "quiz"
    if ((!questions || questions.length === 0) && id) {
      questions = await Question.aggregate([
        { $match: { category: "quiz" } },
        { $sample: { size: 10 } }
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
            : -1
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
      return res
        .status(404)
        .json({ message: "Keine Ziele in der Datenbank gefunden!" });
    }

    res.status(200).json({ targets });
  } catch (error) {
    console.error("Fehler beim Laden der Password-Targets:", error);
    res.status(500).json({ message: "Server-Fehler" });
  }
};
