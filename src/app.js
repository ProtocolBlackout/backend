// Zentrale Express-App für das Backend

import express from "express";
import cors from "cors";
import gamesRoutes from "./routes/gamesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";
import { connectDB } from "./services/connectDB.js";

const app = express();

// Datenbankverbindung herstellen
connectDB();

// Middleware
app.use(express.json());

// CORS erlauben (Frontend kann von anderem Origin anfragen)
const allowedOrigins = [
  process.env.FRONTEND_PUBLIC_URL,
  "http://localhost:5173"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Wenn kein Origin vorhanden ist (z.B. Postman/Thunderclient), erlauben wir es
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// Health-Route für Systemcheck
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Games-Route
app.use("/games", gamesRoutes);

// Auth-Route für Login & Registrierung
app.use("/auth", authRoutes);

// Profile-Routen für eingeloggte User
app.use("/profile", profileRoutes);

// Mail-Routen für eingeloggte User
app.use("/mail", mailRoutes);

export default app;
