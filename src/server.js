import express from 'express'
import db from './db.js'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
const PORT = process.env.PORT || 8001



app.listen(PORT, () => {
  console.log(`Server has started on port: ${PORT}`)
})