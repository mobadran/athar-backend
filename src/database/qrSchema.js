import mongoose from 'mongoose';

const qrSchema = new mongoose.Schema({
  text: { type: String, required: true },
  enabled:
  {
    type: Boolean,
    default: true
  },
});

const Qr = mongoose.model('Qr', qrSchema);
export default Qr;