// Games-Routen mit Mock-Daten für die Anzeige + geschützte Ergebnis-Route mit Profil-Update

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllGames,
  getGameById,
  saveGameResult,
  getQuestionsForQuiz,
  getPasswordGameConfig
} from "../controllers/gamesController.js";


const router = Router();

// GET /games - Liste aller Games
router.get("/", getAllGames);

// GET /games/:id/questions - 10 zufällige Fragen für das Game
router.get("/:id/questions", getQuestionsForQuiz);

//GET /passwird-cracker/config . Lädt die zu erratenden Passwörter aus der DB
router.get("/password-cracker/config", getPasswordGameConfig);

// GET /games/:id - einzelnes Game, oder 404
router.get("/:id", getGameById);

// POST /games/:id/result - Spielergebnis speichern (geschützte Route)
router.post("/:id/result", authMiddleware, saveGameResult);

export default router;
