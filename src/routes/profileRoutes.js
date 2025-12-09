// Routen für Benutzerprofil und Fortschritt (geschützte Endpunkte)

import express from "express";
import {
  getProfile,
  getProfileProgress
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Basis-Profildaten (geschützt)
router.get("/", authMiddleware, getProfile);

// Fortschritt (geschützt)
router.get("/progress", authMiddleware, getProfileProgress);

export default router;
