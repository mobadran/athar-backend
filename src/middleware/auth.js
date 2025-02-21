import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log(decoded)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' })
  }
}

export default auth