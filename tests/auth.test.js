// Tests für die Authentifizierungs-Routen (Register & Login)

import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";


describe("Auth-Routen", () => {
    describe("POST /auth/register", () => {
        it("registriert einen neuen User mit gültigen Daten", async () => {
            const newUser = {
                username: "testuser",
                email: "testuser@example.com",
                password: "TestPass123!"
            };


            const response = await request(app)
                .post("/auth/register")
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("message", "Registrierung erfolgreich");
            expect(response.body).toHaveProperty("user");


            const user = response.body.user;

            expect(user).toHaveProperty("id");
            expect(user).toHaveProperty("username", newUser.username);
            expect(user).toHaveProperty("email", newUser.email);
            expect(user).not.toHaveProperty("password");
            expect(user).not.toHaveProperty("passwordHash");
        });

        it("gibt 400 zurück, wenn Pflichtfelder fehlen", async () => {
            const response = await request(app)
                .post("/auth/register")
                .send({
                    email: "ohne-username@example.com",
                    password: "TestPass123!"
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty(
                "message",
                "Benutzername, E-Mail und Passwort sind erforderlich"
            );
        });

        it("verhindert doppelte Registrierung mit gleicher E-Mail", async () => {
            const userData = {
                username: "duplicateuser",
                email: "duplicate@example.com",
                password: "TestPass123!" 
            };

            const firstResponse = await request(app)
                .post("/auth/register")
                .send(userData);
            
            expect(firstResponse.status).toBe(201);


            const secondResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(secondResponse.status).toBe(400);
            expect(secondResponse.body).toHaveProperty(
                "message",
                "Ein User mit dieser E-Mail existiert bereits"
            );
        });
    });


    describe("POST /auth/login", () => {
        it("loggt einen User mit korrekten Daten ein und gibt ein Token zurück", async () => {
            const userData = {
                username: "loginuser",
                email: "loginuser@example.com",
                password: "LoginPass123!"
            };
        
            // Erst registrieren, damit der User existiert
            const registerResponse = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(registerResponse.status).toBe(201);


            const loginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email: userData.email,
                    password: userData.password
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body).toHaveProperty("message", "Login erfolgreich");
            expect(loginResponse.body).toHaveProperty("token");
            expect(typeof loginResponse.body.token).toBe("string");
            expect(loginResponse.body.token.length).toBeGreaterThan(0);

            expect(loginResponse.body).toHaveProperty("user");
            expect(loginResponse.body.user).toHaveProperty("email", userData.email);
            expect(loginResponse.body.user).toHaveProperty("username", userData.username);
        });

        it("gibt 401 zurück, wenn Anmeldedaten falsch sind", async () => {
            const wrongLoginResponse = await request(app)
                .post("/auth/login")
                .send({
                    email: "nichtvorhanden@example.com",
                    password: "FalschesPasswort123!"
                });

            expect(wrongLoginResponse.status).toBe(401);
            expect(wrongLoginResponse.body).toHaveProperty(
                "message",
                "E-Mail oder Passwort ist ungültig"
            );
        });
    });
});