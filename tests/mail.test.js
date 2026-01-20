// Tests für die Mail-Routen (/mail/test)

import request from "supertest";
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { User } from "../src/models/User.js";

// Wir mocken den Mail-Service, damit KEINE echte Mail verschickt wird
const sendMailMock = vi.fn();

vi.mock("../src/services/mailService.js", () => {
  return {
    sendMail: sendMailMock
  };
});

let app;

beforeAll(async () => {
  // Empfänger-Adresse für /mail/test festlegen (Controller nutzt GMAIL_FROM bevorzugt)
  process.env.GMAIL_FROM = "prot.blackout@gmail.com";

  const importedApp = await import("../src/app.js");
  app = importedApp.default;
});

// Vor jedem Test alle User entfernen, damit die Tests unabhängig voneinander sind
beforeEach(async () => {
  await User.deleteMany({});
  sendMailMock.mockReset();
});

describe("Mail-Routen", () => {
  describe("POST /mail/test", () => {
    it("gibt 401 zurück, wenn kein Token gesendet wird", async () => {
      const response = await request(app).post("/mail/test");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Nicht autorisiert");
    });

    it("sendet eine Test-Mail, wenn ein gültiger Token gesendet wird", async () => {
      // Mailversand im Service als erfolgreich simulieren
      sendMailMock.mockResolvedValue();

      const userData = {
        username: "mailuser",
        email: "mailuser@example.com",
        password: "MailPass123!"
      };

      // Zuerst registrieren
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // Dann einloggen, um ein gültiges Token zu erhalten
      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password
      });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      // Welcome-Mail aus /auth/register aus der Call-History rausnehmen,
      // damit wir hier nur den Aufruf von /mail/test prüfen
      sendMailMock.mockClear();

      // Geschützte Mail-Route mit Bearer-Token aufrufen
      const mailResponse = await request(app)
        .post("/mail/test")
        .set("Authorization", `Bearer ${token}`);

      expect(mailResponse.status).toBe(200);
      expect(mailResponse.body).toHaveProperty(
        "message",
        "Test-Mail wurde versendet"
      );

      // Prüfen, ob unser Mail-Service genutzt wurde
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: process.env.GMAIL_FROM,
          subject: "Protocol Blackout - Mail-Test"
        })
      );
    });
  });
});
