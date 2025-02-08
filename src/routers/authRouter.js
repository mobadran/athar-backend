import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
const router = express.Router()

router.post('/register', (req, res) => {
  const { name, email, password } = req.body

  // Return status 409 (User Conflict) if user already exists
  const existingUser = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email)
  if (existingUser) return res.status(409).json({ message: 'User already exists' })

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10)

  // Insert new user
  const insertUser = db.prepare(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`)
  const result = insertUser.run(name, email, hashedPassword)

  // Return token with status 201 (Created)
  const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '1h' })
  res.status(201).json({ token })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body

  const data = db.prepare(`SELECT id, password FROM users WHERE email = ?`).get(email)

  // Return status 404 (Not Found) if user does not exist
  if (!data) return res.status(404).json({ message: 'User not found' })

  // Return status 401 (Unauthorized) if password is incorrect
  const isPasswordValid = bcrypt.compareSync(password, data.password)
  if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' })

  // Return token with status 200 (OK)
  const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET, { expiresIn: '1h' })
  res.json({ token })
})

export default router