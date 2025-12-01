// Öffentliche Games-Routen mit statischen Mock-Daten

import { Router } from "express";


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


export default router;