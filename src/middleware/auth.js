import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Please Include an Access Token' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Access Token invalid' });
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};

export default auth;