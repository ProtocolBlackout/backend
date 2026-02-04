// Middleware zum Schutz von Routen mit JWT-Token
// - erwartet einen "Authorization: Bearer <token>" Header
// - lädt den User ohne Passwort-Hash aus der DB
// - gibt bei fehlender/ungültiger Authentifizierung immer 401 zurück

import { verifyToken } from "../services/jwtService.js";
import { User } from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Prüfen, ob ein Authorization-Header mit Bearer-Token vorhanden ist
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Nicht autorisiert"
      });
    }

    const token = authHeader.split(" ")[1];

    // Token prüfen und Payload auslesen
    const payload = verifyToken(token);

    // User aus der Datenbank holen (ohne Passwort-Hash)
    const user = await User.findById(payload.userId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Nicht autorisiert"
      });
    }

    // Sicheren User im Request-Objekt verfügbar machen
    req.user = user;

    return next();
  } catch (error) {
    console.error("Fehler in authMiddleware:", error);
    return res.status(401).json({
      message: "Nicht autorisiert"
    });
  }
};
