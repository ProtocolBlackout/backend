// === Security-Test: Rate-Limiter (429) – Limiter für diesen Test gezielt aktivieren, um Missbrauch/Spam abzufangen ===
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";

describe("Security: Rate Limiter", () => {
  let app;

  beforeAll(async () => {
    // Limiter für diesen Test explizit aktivieren
    process.env.RATE_LIMITER_DISABLED = "false";

    // App neu laden, damit die Route-Middlewares mit aktivem Limiter gebaut werden
    vi.resetModules();

    const imported = await import("../src/app.js");
    app = imported.default;
  });

  afterAll(() => {
    // Zurück auf Test-Default, damit andere Tests nicht beeinflusst werden
    process.env.RATE_LIMITER_DISABLED = "true";
  });

  it("blockt zu viele Kontakt-Anfragen mit 429", async () => {
    const testIp = "203.0.113.11";

    let lastResponse;

    // contactLimiter: limit 5 pro 10 Minuten -> beim 6. Request sollte 429 kommen
    for (let i = 0; i < 6; i++) {
      lastResponse = await request(app)
        .post("/mail/contact")
        .set("X-Forwarded-For", testIp)
        .send({
          // absichtlich unvollständig -> Controller gibt 400, aber der Limiter zählt trotzdem Requests
          name: "",
          email: "",
          subject: "",
          message: ""
        });
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body).toHaveProperty(
      "message",
      "Zu viele Kontakt-Anfragen, bitte später erneut versuchen"
    );
  });
});
