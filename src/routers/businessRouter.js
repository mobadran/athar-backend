import express from 'express';
import Qr from '../database/qrSchema.js';
import Business from '../database/businessSchema.js';
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const admin_token = req.headers['admin'];
    const { name, description, location, category, image, password } = req.body;
    if (!name || !description || !location || !category || !image || !password) return res.status(400).json({ message: "All fields are required" });
    if (!admin_token) return res.status(401).json({ message: "Admin Token not included" });
    if (admin_token !== process.env.ADMIN_TOKEN) return res.status(403).json({ message: "Admin Token invalid" });
    const business = await Business.create({ name, description, location, category, image, password });
    return res.status(201).json(business);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get('/qrCodes', async (req, res) => {
  const { id, password } = req.query;
  const business = await Business.findById(id, 'password');
  if (!business) return res.status(404).json({ message: "Business Not Found" });
  if (!business.password === password) return res.status(403).json({ message: "Password is invalid" });
  const qrCodes = await Qr.find({ enabled: true }, { _id: 1 });
  const qrCodesArray = qrCodes.map(qr => qr._id);
  return res.status(200).json({ qrCodesArray });
});

// ToDo: make the qrCodes endpoint an event stream
router.get('/eventStream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('data: Connected\n\n');
  const intervalId = setInterval(() => {
    res.write(`data: Time: ${Date.now()}\n\n`);
  }, 1000);
  res.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

export default router;