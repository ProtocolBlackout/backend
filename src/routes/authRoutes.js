// Routen für die Authentifizierung (Register, Login, Profil & Account-Löschung)

import express from "express";
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  confirmPasswordReset,
  getAuthProfile,
  updateAuthTheme,
  deleteAuthProfile,
  verifyEmail
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Rate-Limits für öffentliche Endpunkte (Schutz vor Spam & zu vielen Anfragen)
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Zu viele Registrierungs-Versuche, bitte später erneut versuchen"
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Zu viele Login-Versuche, bitte später erneut versuchen"
});

const passwordResetRequestLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: "Zu viele Passwort-Reset-Anfragen, bitte später erneut versuchen"
});

const passwordResetConfirmLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Zu viele Passwort-Reset-Versuche, bitte später erneut versuchen"
});

const verifyEmailLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: "Zu viele Verifizierungs-Anfragen, bitte später erneut versuchen"
});

// Öffentliche Routen (ohne Login)
router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post(
  "/password-reset/request",
  passwordResetRequestLimiter,
  requestPasswordReset
);
router.post(
  "/password-reset/confirm",
  passwordResetConfirmLimiter,
  confirmPasswordReset
);
router.get("/verify-email", verifyEmailLimiter, verifyEmail);

// Geschützte Routen (Login erforderlich)
router.get("/profile", authMiddleware, getAuthProfile);
router.delete("/profile", authMiddleware, deleteAuthProfile);

// Geschützte Route zum Speichern des Profil-Themes
router.patch("/profile/theme", authMiddleware, updateAuthTheme);

export default router;
