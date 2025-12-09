// Games-Routen mit Mock-Daten für die Anzeige + geschützte Ergebnis-Route mit Profil-Update

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllGames,
  getGameById,
  saveGameResult
} from "../controllers/gamesController.js";

const router = Router();

// GET /games - Liste aller Games
router.get("/", getAllGames);

// GET /games/:id - einzelnes Game, oder 404
router.get("/:id", getGameById);

// POST /games/:id/result - Spielergebnis speichern (geschützte Route)
router.post("/:id/result", authMiddleware, saveGameResult);

export default router;
