// Routen für Mailversand (geschützte Endpunkte)

import express from "express";
import { sendTestMail } from "../controllers/mailController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Test-Mail senden (geschützt)
router.post("/test", authMiddleware, sendTestMail);

export default router;
