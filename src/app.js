// Zentrale Express-App für das Backend

import express from "express";
import gamesRoutes from "./routes/gamesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { connectDB } from "./services/connectDB.js";

const app = express();

// Datenbankverbindung herstellen
connectDB();

// Middleware
app.use(express.json());

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

export default app;
