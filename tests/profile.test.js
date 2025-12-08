// Tests für die Profil-Routen (/profile & /profile/progress)

import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { User } from "../src/models/User.js";


// Vor jeden Test alle User entfernen, damit die Tests unabhängig voneinander sind
beforeEach(async () => {
    await User.deleteMany({});
});


describe("Profil-Routen", () => {
    describe("GET /profile", () => {
        it("gibt 401 zurück, wenn kein Token gesendet wird", async () => {
            const response = await request(app).get("/profile");

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("message", "Nicht autorisiert");
        });


        it("gibt das Profil zurück, wenn ein gültiger Token gesendet wird", async () => {
            const userData = {
                username: "profileuser",
                email: "profileuser@example.com",
                password: "ProfilePass123!"
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


                // Geschützte Profil-Route mit Bearer-Token aufrufen
                const profileResponse = await request(app)
                    .get("/profile")
                    .set("Authorization", `Bearer ${token}`);

                expect(profileResponse.status).toBe(200);
                expect(profileResponse.body).toHaveProperty("message", "Profil erfolgreich geladen");
                expect(profileResponse.body).toHaveProperty("user");


                const user = profileResponse.body.user;

                expect(user).toHaveProperty("id");
                expect(user).toHaveProperty("username", userData.username);
                expect(user).toHaveProperty("email", userData.email);
                expect(user).toHaveProperty("xp", 0);
                expect(user).toHaveProperty("level", 1);
        });
    });


    describe("GET /profile/progress", () => {
        it("gibt 401 zurück, wenn kein Token gesendet wird", async () => {
            const response = await request(app)
                .get("/profile/progress");
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("message", "Nicht autorisiert");
        });


        it("gibt den Fortschritt zurück, wenn ein gültiger Token gesendet wird", async () => {
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


            // Geschützte Fortschritts-Route mit Bearer-Token aufrufen
            const progressResponse = await request(app)
                .get("/profile/progress")
                .set("Authorization", `Bearer ${token}`);
            
            expect(progressResponse.status).toBe(200);
            expect(progressResponse.body).toHaveProperty("message", "Fortschritt erfolgreich geladen");
            expect(progressResponse.body).toHaveProperty("progress");


            const progress = progressResponse.body.progress;

            expect(progress).toHaveProperty("level", 1);
            expect(progress).toHaveProperty("xp", 0);
            expect(progress).toHaveProperty("nextLevelXp", 100);
            expect(progress).toHaveProperty("xpToNextLevel", 100);
            expect(progress).toHaveProperty("xpIntoCurrentLevel", 0);
            expect(progress).toHaveProperty("completedGames");
            expect(Array.isArray(progress.completedGames)).toBe(true);
        });
    });
});