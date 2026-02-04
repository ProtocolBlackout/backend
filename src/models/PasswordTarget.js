import mongoose from 'mongoose';

const passwordTargetSchema = new mongoose.Schema({
  id: String,
  name: String,
  requiredKeywords: [String],
  difficulty: String,
  color: String
});

const PasswordTarget = mongoose.model('PasswordTarget', passwordTargetSchema);
export default PasswordTarget;
