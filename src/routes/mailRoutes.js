// Routen für Mailversand (geschützte Endpunkte) + Kontaktformular (öffentlich)

import express from "express";
import {
  sendContactMail,
  sendTestMail
} from "../controllers/mailController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Rate-Limit für Kontaktformular (Schutz vor Spam & zu vielen Anfragen)
const contactLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: "Zu viele Kontakt-Anfragen, bitte später erneut versuchen"
});

// Kontaktformular (öffentlich)
router.post("/contact", contactLimiter, sendContactMail);

// Test-Mail senden (geschützt)
router.post("/test", authMiddleware, sendTestMail);

export default router;
