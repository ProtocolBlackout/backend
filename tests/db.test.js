// Testet den DB-Helper (ohne echte DB-Verbindung)

import { describe, it, expect } from "vitest";
import { connectDB } from "../src/services/connectDB.js";


describe("Datenbank-Verbindung", () => {
    it("wirft einen Fehler, wenn MONGODB_URL nicht gesetzt ist", async () => {
        // Originalwerte sichern
        const originalUrl = process.env.MONGODB_URL;
        const originalDb = process.env.DATABASE;


        // Simuliert fehlende URL
        delete process.env.MONGODB_URL;
        process.env.DATABASE = "protocolblackout";

        await expect(connectDB()).rejects.toThrow("MONGODB_URL ist nicht gesetzt");

        if (originalUrl !== undefined) {
            process.env.MONGODB_URL = originalUrl;
        }
        if (originalDb !== undefined) {
            process.env.DATABASE = originalDb;
        }
    });

    it("wirf einen Fehler, wenn DATABASE nicht gesetzt ist", async () => {
        const originalUrl = process.env.MONGODB_URL;
        const originalDb = process.env.DATABASE;

        // URL ist gesetzt, DB-Name fehlt
        process.env.MONGODB_URL = "mongodb+srv://example";
        delete process.env.DATABASE;

        await expect(connectDB()).rejects.toThrow("DATABASE ist nicht gesetzt");

        if (originalUrl !== undefined) {
            process.env.MONGODB_URL = originalUrl;
        }
        if (originalDb !== undefined) {
            process.env.DATABASE = originalDb;
        }
    });
});