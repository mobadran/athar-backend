import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  points: { type: Number, required: true, default: 0 },
  history: { type: Array, default: [] },
  password: { type: String, required: true },
  refreshToken: { type: String },
});

const User = mongoose.model('User', userSchema);
export default User;