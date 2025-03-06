const jwt = require('jsonwebtoken');
const User = require('../database/userSchema.js');

const auth = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Please Include an Access Token' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Access Token invalid' });
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};

module.exports = auth;