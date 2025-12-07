// Games-Routen mit Mock-Daten (öffentlich + geschützte Ergebnis-Route)

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = Router();

// Mock-Daten für Games (später können diese aus der Datenbank kommen)
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


// GET /games - Liste aller Games
router.get("/", (req, res) => {
    // Gibt die komplette Liste der Mock-Games zurück
    res.status(200).json(games);
});


// GET /games/:id - einzelnes Game oder 404
router.get("/:id", (req, res) => {
    const { id } = req.params;
    const game = games.find(currentGame => currentGame.id === id);

    if (!game) {
        return res.status(404).json({ 
            message: "Game nicht gefunden!"
        });
    }

    res.status(200).json(game);
});


// POST /games/:id/result - Spielergebnis speichern (geschützte Route)
router.post("/:id/result", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { score } = req.body;

    const game = games.find(currentGame => currentGame.id === id);

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


    // XP erhöhen
    user.xp += numericScore;


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
});


export default router;