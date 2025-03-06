const express = require('express');
const Qr = require('../database/qrSchema.js');
const Business = require('../database/businessSchema.js');
const router = express.Router();

let clients = [];

router.post('/register', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, location, category, image, password } = req.body;
    if (!name || !description || !location || !category || !image || !password) return res.status(400).json({ message: "All fields are required" });
    const business = await Business.create({ name, description, location, category, image, password });
    return res.status(201).json(business);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get('/qrCode', authenticateBusiness, async (req, res) => {
  try {
    //* Sending all qr codes to the business
    // const qrCodes = await Qr.find({ enabled: true }, { _id: 1 });
    // const qrCodesArray = qrCodes.map(qr => qr._id);
    // return res.status(200).json({ qrCodesArray });
    //* Send only the first qr code to the business
    const text = await getQrCode();
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ToDo: make the qrCodes endpoint an event stream
router.get('/eventStream', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const text = await getQrCode();
    res.write(`data: ${text}\n\n`);

    clients.push(res);

    // const intervalId = setInterval(() => {
    //   res.write(`data: Time: ${Date.now()}\n\n`);
    // }, 1000);
    res.on('close', () => {
      // clearInterval(intervalId);
      res.end();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// router.post('/triggerEvent', (req, res) => {
//   try {
//     sendEvent(req.body.text);
//     return res.status(200).json({ message: "Event triggered" });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

function authenticateAdmin(req, res, next) {
  const admin_token = req.headers['admin'];
  if (!admin_token) return res.status(401).json({ message: "Admin Token not included" });
  if (admin_token !== process.env.ADMIN_TOKEN) return res.status(403).json({ message: "Admin Token invalid" });
  next();
}

async function authenticateBusiness(req, res, next) {
  const { id, password } = req.query;
  if (!id || !password) return res.status(400).json({ message: "ID and password are required" });
  const business = await Business.findById(id, 'password');
  if (!business) return res.status(404).json({ message: "ID is invalid" });
  if (business.password !== password) return res.status(403).json({ message: "Password is invalid" });
  next();
}

async function getQrCode() {
  const qrCode = await Qr.findOne({ enabled: true }, { text: 1 });
  return qrCode.text;
}

function sendEvent(message) {
  clients.forEach(res => {
    res.write(`data: ${message}\n\n`);
  });
}

module.exports = router;

module.exports.sendEvent = sendEvent;