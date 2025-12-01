// Tests für die öffentlichen Games-Routen (Mock-Daten)

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";


describe("GET /games", () => {
    it("gibt eine Liste von Games zurück", async () => {
        const response = await request(app).get("/games");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);


        const firstGame = response.body[0];

        expect(firstGame).toHaveProperty("id");
        expect(firstGame).toHaveProperty("title");
        expect(firstGame).toHaveProperty("description");
    });
});


describe("GET /games/:id", () => {
    it("gibt ein einzelnes Game zurück", async () => {
        const response = await request(app).get("/games/1");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id", "1");
        expect(response.body).toHaveProperty("title");
    });

    it("gibt 404, wenn das Game nicht existiert", async () => {
        const response = await request(app).get("/games/nicht-vorhanden");

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message");
    });
});