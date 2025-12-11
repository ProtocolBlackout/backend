import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  }
});

export const Question = mongoose.model("Question", questionSchema);
