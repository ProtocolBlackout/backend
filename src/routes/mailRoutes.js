// Routen für Mailversand (geschützte Endpunkte) + Kontaktformular (öffentlich)

import express from "express";
import {
  sendContactMail,
  sendTestMail
} from "../controllers/mailController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Kontaktformular (öffentlich)
router.post("/contact", sendContactMail);

// Test-Mail senden (geschützt)
router.post("/test", authMiddleware, sendTestMail);

export default router;
