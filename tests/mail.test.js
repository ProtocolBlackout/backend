// Tests für die Mail-Routen (/mail/test)

import request from "supertest";
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { User } from "../src/models/User.js";

const sendMailMock = vi.fn(); // Wir ersetzen sendMail durch eine Test-Funktion, um Aufrufe prüfen zu können
const createTransportMock = vi.fn(() => {
  return {
    sendMail: sendMailMock
  };
});

vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: createTransportMock
    }
  };
});

let app;

beforeAll(async () => {
  // SMTP-Werte für Tests festsetzen, damit der Controller nicht wegen fehlender .env abbricht
  process.env.SMTP_HOST = "mail.infomaniak.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_USER = "test@example.com";
  process.env.SMTP_PASS = "testpass";
  process.env.SMTP_FROM = "test@example.com";

  const importedApp = await import("../src/app.js");
  app = importedApp.default;
});

// Vor jedem Test alle User entfernen, damit die Tests unabhängig voneinander sind
beforeEach(async () => {
  await User.deleteMany({});
  sendMailMock.mockReset();
  createTransportMock.mockClear();
});

describe("Mail-Routen", () => {
  describe("POST /mail/test", () => {
    it("gibt 401 zurück, wenn kein Token gesendet wird", async () => {
      const response = await request(app).post("/mail/test");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Nicht autorisiert");
    });

    it("sendet eine Test-Mail, wenn ein gültiger Token gesendet wird", async () => {
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

      // Geschützte Mail-Route mit Bearer-Token aufrufen
      const mailResponse = await request(app)
        .post("/mail/test")
        .set("Authorization", `Bearer ${token}`);

      expect(mailResponse.status).toBe(200);
      expect(mailResponse.body).toHaveProperty(
        "message",
        "Test-Mail wurde versendet"
      );

      // Prüfen, ob Nodemailer genutzt wurde
      expect(createTransportMock).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      expect(createTransportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
      );

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.SMTP_FROM,
          to: process.env.SMTP_USER
        })
      );
    });
  });
});
