// Tests für die Authentifizierungs-Routen (Register, Login, Profil & Account-Löschung)

import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock MUSS vor app-Import kommen
vi.mock("../src/services/mailService.js", () => {
  return {
    sendMail: vi.fn(async () => {
      return { ok: true };
    })
  };
});

import app from "../src/app.js";
import { User } from "../src/models/User.js";
import { sendMail } from "../src/services/mailService.js";

// Vor jedem Test alle User entfernen, damit die Tests unabhängig voneinander sind
beforeEach(async () => {
  vi.clearAllMocks();
  await User.deleteMany({});
});

describe("Auth-Routen", () => {
  describe("POST /auth/register", () => {
    it("registriert einen neuen User mit gültigen Daten", async () => {
      const newUser = {
        username: "testuser",
        email: "testuser@example.com",
        password: "TestPass123!"
      };

      const response = await request(app).post("/auth/register").send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Registrierung erfolgreich"
      );
      expect(response.body).toHaveProperty("user");

      const user = response.body.user;

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username", newUser.username);
      expect(user).toHaveProperty("email", newUser.email);
      expect(user).not.toHaveProperty("password");
      expect(user).not.toHaveProperty("passwordHash");
    });

    it("verschickt bei erfolgreicher Registrierung eine Mail (Mock)", async () => {
      const newUser = {
        username: "mailuser",
        email: "mailuser@example.com",
        password: "TestPass123!"
      };

      const response = await request(app).post("/auth/register").send(newUser);

      expect(response.status).toBe(201);
      expect(sendMail).toHaveBeenCalledTimes(1);

      const mailArgs = sendMail.mock.calls[0][0];
      expect(mailArgs).toHaveProperty("to", newUser.email);
    });

    it("verschickt bei Registrierung einen Verify-Link mit Token", async () => {
      const newUser = {
        username: "verifyuser",
        email: "verifyuser@example.com",
        password: "TestPass123!"
      };

      const response = await request(app).post("/auth/register").send(newUser);

      expect(response.status).toBe(201);
      expect(sendMail).toHaveBeenCalledTimes(1);

      const mailArgs = sendMail.mock.calls[0][0];

      // Wir erwarten, dass im Mail-Text ein Verify-Link inkl. Token vorkommt
      expect(mailArgs).toHaveProperty("text");
      expect(mailArgs.text).toContain("/auth/verify-email?token=");

      // Token aus dem Mail-Text ziehen:
      // - split("token=")[1] nimmt alles NACH "token="
      // - split(/[&\s]/)[0] schneidet bei "&" ODER Leerzeichen/Zeilenumbruch ab
      const token = mailArgs.text.split("token=")[1].split(/[&\s]/)[0];

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(10);
    });

    it("gibt 400 zurück, wenn Pflichtfelder fehlen", async () => {
      const response = await request(app).post("/auth/register").send({
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

      // User verifizieren (Token aus Welcome-Mail ziehen)
      expect(sendMail).toHaveBeenCalledTimes(1);
      const mailArgs = sendMail.mock.calls[0][0];
      const verificationToken = mailArgs.text
        .split("token=")[1]
        .split(/[&\s]/)[0];

      const verifyResponse = await request(app).get(
        `/auth/verify-email?token=${verificationToken}`
      );

      expect(verifyResponse.status).toBe(200);

      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty("message", "Login erfolgreich");
      expect(loginResponse.body).toHaveProperty("token");
      expect(typeof loginResponse.body.token).toBe("string");
      expect(loginResponse.body.token.length).toBeGreaterThan(0);

      // JWT Token bleibt token
      const token = loginResponse.body.token;
      expect(token.split(".").length).toBe(3);

      expect(loginResponse.body).toHaveProperty("user");
      expect(loginResponse.body.user).toHaveProperty("email", userData.email);
      expect(loginResponse.body.user).toHaveProperty(
        "username",
        userData.username
      );
    });

    // Unverifizierter User darf nicht einloggen
    it("gibt 401 zurück, wenn die E-Mail noch nicht verifiziert ist", async () => {
      const userData = {
        username: "unverifieduser",
        email: "unverifieduser@example.com",
        password: "LoginPass123!"
      };

      // Erst registrieren, damit der User existiert
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // Direkt login versuchen (ohne Verifizierung)
      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password
      });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body).toHaveProperty(
        "message",
        "E-Mail oder Passwort ist ungültig"
      );
    });

    it("gibt 401 zurück, wenn Anmeldedaten falsch sind", async () => {
      const wrongLoginResponse = await request(app).post("/auth/login").send({
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

  describe("POST /auth/password-reset/request", () => {
    it("gibt 400 zurück, wenn keine E-Mail gesendet wird", async () => {
      const response = await request(app)
        .post("/auth/password-reset/request")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "E-Mail ist erforderlich"
      );
    });

    it("gibt 200 zurück und verschickt eine Reset-Mail (Mock), wenn User existiert", async () => {
      const userData = {
        username: "resetuser",
        email: "resetuser@example.com",
        password: "ResetPass123!"
      };

      // User anlegen (Mail beim Register ist ok, wir resetten die Mocks danach)
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // Register-Mail ignorieren: ab jetzt sollen nur Reset-Mail-Calls gezählt werden.
      vi.clearAllMocks();

      const response = await request(app)
        .post("/auth/password-reset/request")
        .send({ email: userData.email });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain(
        "Wenn ein Account mit dieser E-Mail existiert"
      );

      expect(sendMail).toHaveBeenCalledTimes(1);

      // sendMail ist gemockt: Wir prüfen, welche Mail-Daten (to/text) der Controller baut,
      // damit der Reset-Link inkl. Token korrekt ist, ohne eine echte Mail zu senden.
      const mailArgs = sendMail.mock.calls[0][0];

      expect(mailArgs).toHaveProperty("to", userData.email);
      expect(mailArgs).toHaveProperty("text");
      expect(mailArgs.text).toContain("/password-reset?token=");

      const token = mailArgs.text.split("token=")[1].split(/[&\s]/)[0];

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(10);
    });

    it("gibt 200 zurück mit gleicher Erfolgsmeldung, wenn User nicht existiert", async () => {
      const response = await request(app)
        .post("/auth/password-reset/request")
        .send({ email: "doesnotexist@example.com" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain(
        "Wenn ein Account mit dieser E-Mail existiert"
      );

      // Keine Mail verschicken, wenn der User nicht existiert
      expect(sendMail).toHaveBeenCalledTimes(0);
    });
  });

  describe("POST /auth/password-reset/confirm", () => {
    it("gibt 400 zurück, wenn Token oder Passwort fehlt", async () => {
      const response = await request(app)
        .post("/auth/password-reset/confirm")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Token und neues Passwort sind erforderlich"
      );
    });

    it("gibt 400 zurück, wenn der Token ungültig ist", async () => {
      const response = await request(app)
        .post("/auth/password-reset/confirm")
        .send({
          token: "invalid-token",
          password: "NewPass123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Token ist ungültig oder abgelaufen"
      );
    });

    it("setzt das Passwort neu, wenn Token gültig ist und Login klappt mit neuem Passwort", async () => {
      const userData = {
        username: "confirmresetuser",
        email: "confirmresetuser@example.com",
        password: "OldPass123!"
      };

      // User registrieren
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // User verifizieren (Token aus Welcome-Mail ziehen)
      expect(sendMail).toHaveBeenCalledTimes(1);
      const welcomeMailArgs = sendMail.mock.calls[0][0];
      const verificationToken = welcomeMailArgs.text
        .split("token=")[1]
        .split(/[&\s]/)[0];

      const verifyResponse = await request(app).get(
        `/auth/verify-email?token=${verificationToken}`
      );

      expect(verifyResponse.status).toBe(200);

      // Ab jetzt nur Reset-Mail zählen
      vi.clearAllMocks();

      // Reset anfordern -> Token aus Reset-Mail ziehen
      const resetRequestResponse = await request(app)
        .post("/auth/password-reset/request")
        .send({ email: userData.email });

      expect(resetRequestResponse.status).toBe(200);
      expect(sendMail).toHaveBeenCalledTimes(1);

      const resetMailArgs = sendMail.mock.calls[0][0];
      expect(resetMailArgs.text).toContain("/password-reset?token=");

      const resetToken = resetMailArgs.text
        .split("token=")[1]
        .split(/[&\s]/)[0];

      // Confirm: neues Passwort setzen
      const confirmResponse = await request(app)
        .post("/auth/password-reset/confirm")
        .send({ token: resetToken, password: "NewPass123!" });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body).toHaveProperty(
        "message",
        "Passwort erfolgreich zurückgesetzt"
      );

      // Login mit neuem Passwort muss funktionieren
      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: "NewPass123!"
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty("message", "Login erfolgreich");
      expect(loginResponse.body).toHaveProperty("token");
    });
  });

  describe("GET /auth/verify-email", () => {
    it("gibt 400 zurück, wenn kein Token gesendet wird", async () => {
      const response = await request(app).get("/auth/verify-email");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Token fehlt");
    });

    it("gibt 400 zurück, wenn der Token ungültig ist", async () => {
      const response = await request(app).get(
        "/auth/verify-email?token=ungueltig"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Token ist ungültig oder abgelaufen"
      );
    });

    it("verifiziert die E-Mail, wenn ein gültiger Token gesendet wird", async () => {
      const newUser = {
        username: "verifyflowuser",
        email: "verifyflowuser@example.com",
        password: "TestPass123!"
      };

      const registerResponse = await request(app)
        .post("/auth/register")
        .send(newUser);

      expect(registerResponse.status).toBe(201);
      expect(sendMail).toHaveBeenCalledTimes(1);

      const mailArgs = sendMail.mock.calls[0][0];
      expect(mailArgs).toHaveProperty("text");
      expect(mailArgs.text).toContain("/auth/verify-email?token=");

      // Token aus dem Mail-Text ziehen (Erklärung siehe oben Register-Test)
      const token = mailArgs.text.split("token=")[1].split(/[&\s]/)[0];

      const verifyResponse = await request(app).get(
        `/auth/verify-email?token=${token}`
      );

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty(
        "message",
        "E-Mail erfolgreich verifiziert"
      );

      const updatedUser = await User.findOne({ email: newUser.email });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationTokenHash).toBeNull();
      expect(updatedUser.emailVerificationTokenExpires).toBeNull();
    });
  });

  describe("GET /auth/profile", () => {
    it("gibt 401 zurück, wenn kein Token gesendet wird", async () => {
      const response = await request(app).get("/auth/profile");

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

      // User verifizieren (Token aus Welcome-Mail ziehen)
      expect(sendMail).toHaveBeenCalledTimes(1);
      const mailArgs = sendMail.mock.calls[0][0];
      const verificationToken = mailArgs.text
        .split("token=")[1]
        .split(/[&\s]/)[0];

      const verifyResponse = await request(app).get(
        `/auth/verify-email?token=${verificationToken}`
      );

      expect(verifyResponse.status).toBe(200);

      // Dann einloggen, um ein gültiges Token zu erhalten
      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password
      });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      // Geschützte Route mit Bearer-Token aufrufen
      const profileResponse = await request(app)
        .get("/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body).toHaveProperty(
        "message",
        "Profil erfolgreich geladen"
      );
      expect(profileResponse.body).toHaveProperty("user");

      const user = profileResponse.body.user;

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username", userData.username);
      expect(user).toHaveProperty("email", userData.email);
    });
  });

  describe("DELETE /auth/profile", () => {
    it("gibt 401 zurück, wenn kein Token gesendet wird", async () => {
      const response = await request(app).delete("/auth/profile");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Nicht autorisiert");
    });

    it("löscht den eingeloggten User und gibt eine Erfolgsmeldung zurück", async () => {
      const userData = {
        username: "deleteuser",
        email: "deleteuser@example.com",
        password: "DeletePass123!"
      };

      // Zuerst registrieren, damit der User existiert
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // User verifizieren (Token aus Welcome-Mail ziehen)
      expect(sendMail).toHaveBeenCalledTimes(1);
      const mailArgs = sendMail.mock.calls[0][0];
      const verificationToken = mailArgs.text
        .split("token=")[1]
        .split(/[&\s]/)[0];

      const verifyResponse = await request(app).get(
        `/auth/verify-email?token=${verificationToken}`
      );

      expect(verifyResponse.status).toBe(200);

      // Dann einloggen, um ein gültiges Token zu erhalten
      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password
      });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      // Account-Löschroute mit Bearer-Token aufrufen
      const deleteResponse = await request(app)
        .delete("/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty(
        "message",
        "Profil erfolgreich gelöscht"
      );

      // Prüfen, ob der User in der DB nicht mehr existiert
      const deletedUser = await User.findOne({ email: userData.email });

      expect(deletedUser).toBeNull();
    });
  });
});
