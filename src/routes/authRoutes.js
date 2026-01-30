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

const router = express.Router();

// Öffentliche Routen (ohne Login)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", confirmPasswordReset);
router.get("/verify-email", verifyEmail);

// Geschützte Routen (Login erforderlich)
router.get("/profile", authMiddleware, getAuthProfile);
router.delete("/profile", authMiddleware, deleteAuthProfile);

//Geschütze Route zum speichern des Profilsthemes
router.patch("/profile/theme", authMiddleware, updateAuthTheme);


export default router;
