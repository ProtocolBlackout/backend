// Routen für die Authentifizierung (Register, Login, Profil & Account-Löschung)

import express from "express";
import {
  registerUser,
  loginUser,
  getAuthProfile,
  deleteAuthProfile
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", authMiddleware, getAuthProfile);
router.delete("/profile", authMiddleware, deleteAuthProfile);

export default router;
