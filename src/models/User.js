// Mongoose-Model für Nutzer: Login-Daten + Fortschritt

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    xp: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    completedGames: {
      type: [String],
      default: []
    }
  },
  {
    // erstellt createdAt & updatedAt, praktisch für Auswertungen
    timestamps: true
  }
);

export const User = mongoose.model("User", userSchema);
