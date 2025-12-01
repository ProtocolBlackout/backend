// Zentrale Express-App für das Backend

import express from "express";


const app = express();


// Middleware
app.use(express.json());


// Health-Route für Systemcheck
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});


export default app;