// Routen für Benutzerprofil und Fortschritt (geschützte Endpunkte)

import express from "express";
import {
  getProfile,
  getProfileProgress,
  updateProfileProgress
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Basis-Profildaten (geschützt)
router.get("/", authMiddleware, getProfile);

// Fortschritt (geschützt)
router.get("/progress", authMiddleware, getProfileProgress);

// Fortschritt aktualisieren (geschützt)
router.patch("/progress", authMiddleware, updateProfileProgress);

export default router;
