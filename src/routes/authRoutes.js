// Routen für die Authentifizierung (Register & Login)

import express from "express";
import { registerUser, loginUser, getAuthProfile } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", authMiddleware, getAuthProfile);


export default router;