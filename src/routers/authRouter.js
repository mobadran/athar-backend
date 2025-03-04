import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../database/userSchema.js';
import fs from 'fs';
import path from 'path';
const router = express.Router();

//* Register Endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ message: 'All fields are required' });

    //* Return status 409 (User Conflict) if email already exists
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already exists' });
    //* Return status 409 (User Conflict) if phone already exists
    if (await User.findOne({ phone })) return res.status(409).json({ message: 'Phone number already exists' });

    //* Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    //* Insert new user
    await User.create({ name, email, phone, password: hashedPassword });

    //* Just create the user without returning any token. The user will have to login to get the token.
    res.status(201).json({ message: 'User created' });

  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: 'Server error' });
  }
});

//* Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Phone and password fields are required' });

    //* Find user by phone
    const user = await User.findOne({ phone }, '_id password');
    //* Return status 404 (Not Found) if user does not exist
    if (!user) return res.status(404).json({ message: 'User not found' });

    //* Return status 401 (Unauthorized) if password is incorrect
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

    //* Return token with status 200 (OK)
    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);
    await User.updateOne({ _id: user._id }, { refreshToken });
    res.cookie('refreshToken', refreshToken, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true
    }).json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    //* If no refresh token provided, send 401 (Unauthorized)
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      //* If refresh token is invalid, send 403 (Forbidden)
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });
      //* Otherwise, remove refresh token and clear cookie
      await User.findByIdAndUpdate(decoded.userId, { refreshToken: '' });
      res.clearCookie('refreshToken').json({ message: 'Logged out from all devices' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/deleteAccount', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { phone, password } = req.query;

    //* If no refresh token provided, send 401 (Unauthorized)
    if (!refreshToken || !phone || !password) return res.status(401).json({ message: 'No refresh token, phone number, or password provided' });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      //* If refresh token is invalid, send 403 (Forbidden)
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });

      //* Find user by ID
      const user = await User.findById(decoded.userId);

      //* Return status 404 (Not Found) if user does not exist
      if (!user) return res.status(404).json({ message: 'User not found' });

      //* If refresh token is invalid, send 403 (Forbidden)
      if (user.refreshToken !== refreshToken) return res.status(403).json({ message: 'Invalid refresh token' });

      //* Return status 401 (Unauthorized) if username or password is incorrect
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (user.phone !== phone || !isPasswordValid) return res.status(401).json({ message: 'Invalid phone or password' });

      //* Remove user
      await User.findByIdAndDelete(decoded.userId);

      //* Delete user's avatar
      const imgPath = path.join('uploads', 'avatars', `${decoded.userId}.png`);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }

      res.clearCookie('refreshToken').sendStatus(204);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//* Get Access Token Endpoint
router.get('/accessToken', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    //* If no refresh token provided, send 401 (Unauthorized)
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      //* If refresh token is invalid, send 403 (Forbidden)
      if (err) return res.status(403).json({ message: 'Refresh Token Invalid' });

      //* Check if refresh token is still in the database
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).send({ message: 'User not found' });
      if (user.refreshToken !== refreshToken) return res.status(403).json({ message: 'Refresh Token Invalid' });

      //* Sign a new access token and send it
      const accessToken = createAccessToken(decoded.userId);
      res.json({ accessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

function createRefreshToken(userId) {
  return jwt.sign({ userId, role: "User" }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
}

function createAccessToken(userId) {
  return jwt.sign({ userId, role: "User" }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export default router;