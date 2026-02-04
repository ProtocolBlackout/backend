// Testet das User-Model (Schema & Defaultwerte)

import { describe, it, expect } from "vitest";
import { User } from "../src/models/User.js";

describe("User-Model", () => {
  it("setzt Standardwerte für xp, level und completedGames", () => {
    const user = new User({
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashed"
    });

    expect(user.xp).toBe(0);
    expect(user.level).toBe(1);
    expect(user.completedGames).toEqual([]);
  });
});
