// Test für die Health-Route

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";


describe("GET /health", () => {
    it("liefert den Status ok zurück", async () => {
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });
});