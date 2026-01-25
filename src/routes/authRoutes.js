// Routen für die Authentifizierung (Register, Login, Profil & Account-Löschung)

import express from "express";
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  getAuthProfile,
  deleteAuthProfile,
  verifyEmail
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Öffentliche Routen (ohne Login)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/password-reset/request", requestPasswordReset);
router.get("/verify-email", verifyEmail);

// Geschützte Routen (Login erforderlich)
router.get("/profile", authMiddleware, getAuthProfile);
router.delete("/profile", authMiddleware, deleteAuthProfile);

export default router;
