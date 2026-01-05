import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  gameId: {
    type: String,
    required: true,
    default: "quiz-01",
  },
  category: {
    type: String,
    required: true,
  },
  // Der eigentliche Fragetext
  question: {
    type: String,
    required: true,
  },
  // Richtige Antwort als String (kompatibel zu älteren Versionen)
  answer: {
    type: String,
  },
  // Alternativen/Antwort-Optionen
  options: {
    type: [String],
    required: true,
  },
  // Optional: richtiger Index innerhalb von `options` (praktisch fürs Frontend)
  correctIndex: {
    type: Number,
  },
});

// Verwende explizit die Collection 'quizQuestion', falls die Daten bereits
// in dieser Collection importiert wurden (z. B. via mongoimport --collection quizQuestion).
export const Question = mongoose.model(
  "Question",
  questionSchema,
  "quizQuestion"
);
