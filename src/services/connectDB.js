// Kümmert sich um die Verbindung zur MongoDB (Minimalvariante für den Test)

import mongoose from "mongoose";

export async function connectDB() {
  const mongoUrl = process.env.MONGODB_URL;
  const dbName = process.env.DATABASE;

  if (!mongoUrl) {
    // Genau dieser Text wird im Test erwartet!
    throw new Error("MONGODB_URL ist nicht gesetzt");
  }

  // Genau dieser Text wird im Test erwartet!
  if (!dbName) {
    throw new Error("DATABASE ist nicht gesetzt");
  }

  // Verbindung zu MongoDB
  await mongoose.connect(mongoUrl, {
    dbName: dbName
  });

  console.log("Mit MongoDB verbunden");
}
