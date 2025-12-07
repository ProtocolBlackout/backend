// Tests für das Speichern von Spielergebnissen (geschützte Route)

import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { User } from "../src/models/User.js";


// Vor jedem Test alle User entfernen, damit die Tests unabhängig sind
beforeEach(async () => {
    await User.deleteMany({});
});


describe("POST /games/:id/result", () => {
    it("gibt 401 zurück, wenn kein Token mitgeschickt wird", async () => {
        const response = await request(app)
            .post("/games/1/result")
            .send({
                score: 10
            });

        expect(response.status).toBe(401);
    });

    it("gibt 404 zurück, wenn das Game nicht existiert, obwohl ein gültiger Token gesendet wird", async () => {
        const userData = {
            username: "gameresultuser",
            email: "gameresultuser@example.com",
            password: "GameResultPass123!"
        };


        // Zuerst registrieren
        const registerResponse = await request(app)
            .post("/auth/register")
            .send(userData);

        expect(registerResponse.status).toBe(201);

        
        // Dann einloggen, um ein gültiges Token zu erhalten
        const loginResponse = await request(app)
            .post("/auth/login")
            .send({
                email: userData.email,
                password: userData.password
            });
        
        expect(loginResponse.status).toBe(200);
        const token = loginResponse.body.token;


        // Nicht vorhandenes Game mit gültigem Token aufrufen
        const response = await request(app)
            .post("/games/nicht-vorhanden/result")
            .set("Authorization", `Bearer ${token}`)
            .send({
                score: 10
            });
        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message", "Game nicht gefunden!");
    });


    it("speichert das Ergebnis und aktualisiert den Fortschritt des Users", async () => {
        const userData = {
            username: "progressuser",
            email: "progressuser@example.com",
            password: "ProgressPass123!"
        };


        // Zuerst registrieren
        const registerResponse = await request(app)
            .post("/auth/register")
            .send(userData);
        
        expect(registerResponse.status).toBe(201);


        // Dann einloggen, um ein gültiges Token zu erhalten
        const loginResponse = await request(app)
            .post("/auth/login")
            .send({
                email: userData.email,
                password: userData.password
            });
        
        expect(loginResponse.status).toBe(200);
        const token = loginResponse.body.token;

        const score = 50;


        // Ergebnis für ein existierendes Game mit gültigem Token senden
        const resultResponse = await request(app)
            .post("/games/1/result")
            .set("Authorization", `Bearer ${token}`)
            .send({
                score: score
            });
        
        expect(resultResponse.status).toBe(200);
        expect(resultResponse.body).toHaveProperty("message", "Ergebnis gespeichert (MVP-Platzhalter)");


        // User aus der Datenbank laden und Fortschritt prüfen
        const updatedUser = await User.findOne({ email: userData.email });

        expect(updatedUser).not.toBeNull();
        expect(updatedUser.xp).toBe(score);
        expect(updatedUser.level).toBe(1);
        expect(updatedUser.completedGames).toContain("1");
        expect(updatedUser.completedGames.length).toBe(1);
    });
});