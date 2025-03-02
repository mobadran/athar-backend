import express from 'express';
import multer from 'multer';
import Qr from '../database/qrSchema.js';
import User from '../database/userSchema.js';
import fs from 'fs';
import path from 'path';
const router = express.Router();

// Multer configuration
const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/avatars');
    },
    filename: (req, file, cb) => {
      cb(null, `${req.user.userId}.png`);
    },
  })
});

const numOfPoints = 500;

async function updateQrCodes() {
  const qrCodes = await Qr.find({ enabled: 1 });
  const qrCodesLength = qrCodes.length;

  // Add 10 QR codes if there are less than 10
  if (qrCodesLength < 10) {
    for (let i = 0; i < 10 - qrCodesLength; i++) {
      await Qr.create({});
    }
  }
}

function getCurrentDate() {
  const date = new Date();
  // Get Date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  // Get Time
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const adjustedHours = hours % 12 || 12;
  const time = `${adjustedHours}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
  return { day, month, year, time };
}

async function updateHistory(userId) {
  const now = getCurrentDate();
  const points = await User.findOne({ _id: userId }, 'points');
  const nowString = `${now.day}/${now.month}/${now.year} ${now.time} - ${points.points} points`;
  const result = await User.findOneAndUpdate(
    { _id: userId },
    { $push: { history: nowString } },
  );

  console.log(result);
}

router.post('/sendQr', async (req, res) => {
  try {
    // Get enabled QR Codes
    const qrCodes = await Qr.find({ enabled: 1 });

    if (qrCodes[0].id === req.body.text) {
      // Add points
      await User.updateOne({ _id: req.user.userId }, { $inc: { points: numOfPoints } });

      // Disable QR code
      await Qr.updateOne({ _id: qrCodes[0].id }, { enabled: false });

      // Update QR codes
      updateQrCodes();

      // Send message
      const points = await User.findOne({ _id: req.user.userId }, 'points');
      updateHistory(req.user.userId);
      return res.status(200).json({ message: `You have ${points.points} points` });
    } else {
      return res.status(400).json({ message: 'QR Code not valid' });
    }
  }
  catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

router.get('/userData', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.userId }, 'name email points phone history -_id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userData = user.toObject();
    const { name, email, points, phone, history } = userData;

    const imgPath = path.join('uploads', 'avatars', `${req.user.userId}.png`);
    const imgExists = fs.existsSync(imgPath);

    return res.status(200).json({
      name,
      email,
      points,
      phone,
      img: imgExists ? `avatars/${req.user.userId}.png` : null,
      history
    });
  }
  catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

router.put('/updateImg', uploadAvatar.single('image'), async (req, res) => {
  try {
    return res.status(200).json({ message: 'Image uploaded successfully' });
  }
  catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

export default router;

export { updateQrCodes };