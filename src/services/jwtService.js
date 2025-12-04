// JWT-Logik zentral, damit Controller schlank bleiben

import jwt from "jsonwebtoken";


const jwtSecret = process.env.JWT_SECRET;
// Fallback, falls JWT_EXPIRES_IN nicht gesetzt ist
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";

export function signToken(userId) {
    // Erstellt ein JWT für eine User-ID
    return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });
}

export function verifyToken(token) {
    // Prüft ein JWT und gibt das Payload zurück
    return jwt.verify(token, jwtSecret);
}