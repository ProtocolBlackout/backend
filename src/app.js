// Zentrale Express-App für das Backend

import express from "express";
import gamesRoutes from "./routes/gamesRoutes.js";


const app = express();


// Middleware
app.use(express.json());


// Health-Route für Systemcheck
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});


// Games-Route
app.use("/games", gamesRoutes);


export default app;