import express from 'express';
import multer from 'multer';
import Qr from '../database/qrSchema.js';
import User from '../database/userSchema.js';
import fs from 'fs';
import path from 'path';
import { sendEvent } from './businessRouter.js';
const router = express.Router();

//* Multer configuration
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

function generateRandomString(length) {
  const characters = '!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

async function updateQrCodes() {
  // const qrCodes = await Qr.find({ enabled: 1 });
  // const qrCodesLength = qrCodes.length;

  //* Add 10 QR codes if there are less than 10
  // if (qrCodesLength < 10) {
  //   for (let i = 0; i < 10 - qrCodesLength; i++) {
  //     await Qr.create({});
  //   }
  // }

  //* If the last QR code is already enabled, return this QR code
  let qrCode = await Qr.find().sort({ _id: -1 }).limit(1);
  qrCode = qrCode[0];
  if (qrCode && qrCode.enabled) return qrCode;
  //* If the last QR code is disabled, create a new QR code and return it ^_^

  //* Disable all QR codes
  await Qr.updateMany({}, { enabled: false });

  //* Add 1 QR code
  const randomText = generateRandomString(50);
  sendEvent(randomText);
  return await Qr.create({ text: randomText });
}

function getCurrentDate() {
  const date = new Date();
  //* Get Date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  //* Get Time
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
  await User.findOneAndUpdate(
    { _id: userId },
    { $push: { history: nowString } },
  );
}

router.post('/sendQr', async (req, res) => {
  try {
    //* Get the enabled QR
    //* Find the first QR code then check if it is enabled
    //* Retry mechanism
    const maxAttempts = 3;
    let attempts = 0;
    //* Get the last QR code in db (the latest one)
    let qrCode = await Qr.find().sort({ _id: -1 }).limit(1);
    qrCode = qrCode[0];
    while (attempts < maxAttempts) {
      if (qrCode.enabled && qrCode.text === req.body.text) {
        await Qr.findOneAndUpdate({ text: req.body.text }, { enabled: false });
        //* Add points
        await User.updateOne({ _id: req.user.userId }, { $inc: { points: numOfPoints } });

        updateQrCodes();

        //* Send message
        const points = await User.findOne({ _id: req.user.userId }, 'points');
        updateHistory(req.user.userId);
        return res.status(200).json({ message: `You have ${points.points} points` });
      }
      if (qrCode.enabled) return res.status(400).json({ message: 'Invalid QR code' });
      qrCode = await Qr.find().sort({ _id: -1 }).limit(1);
      qrCode = qrCode[0];
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100)); //* Wait for 100ms
    }

    if (!qrCode || !qrCode.enabled) return res.status(500).json({ message: 'An error occured. Please send the request again.' });
    return res.status(400).json({ message: 'Invalid QR code' });
  }
  catch (err) {
    console.error(err);
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
    console.error(err);
    return res.sendStatus(500);
  }
});

router.put('/updateImg', uploadAvatar.single('image'), async (req, res) => {
  try {
    return res.status(200).json({ message: 'Image uploaded successfully' });
  }
  catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

export default router;

export { updateQrCodes };