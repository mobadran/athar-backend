import express from 'express'
import db from '../db.js'
const router = express.Router()

const numOfPoints = 500

function updateQrCodes() {
  const qrCodesLength = db.prepare(`SELECT * FROM qr_codes WHERE enabled = 1`).all().length

  // Add 10 QR codes if there are less than 10
  if (qrCodesLength < 10) {
    for (let i = 0; i < 10 - qrCodesLength; i++) {
      // Generate random text 20 characters
      const text = Array(20).fill('').map(() => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')

      // Insert the text
      const insertQrCode = db.prepare(`INSERT INTO qr_codes (text) VALUES (?)`)
      insertQrCode.run(text)
    }
  }
}

router.get('/points', (req, res) => {
  res.status(200).json({ points: db.prepare(`SELECT points FROM users WHERE id = ?`).get(req.user.userId).points })
})

router.post('/sendQr', (req, res) => {
  const qrCodes = db.prepare(`SELECT text, id FROM qr_codes WHERE enabled = 1`).all()

  // console.log(qrCodes)

  if (qrCodes[0].text === req.body.text) {
    // Add points
    db.prepare(`UPDATE users SET points = points + ${numOfPoints} WHERE id = ?`).run(req.user.userId)

    // Disable QR code
    db.prepare(`UPDATE qr_codes SET enabled = 0 WHERE id = ?`).run(qrCodes[0].id)

    // Update QR codes
    updateQrCodes()

    // Send message
    const message = `You have ${db.prepare(`SELECT points FROM users WHERE id = ?`).get(req.user.userId).points} points`
    res.status(200).json({ message })
  } else {
    res.status(403).json({ message: 'Forbidden' })
  }
})

export default router

export { updateQrCodes }