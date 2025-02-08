import express from 'express'
import authRouter from './routers/authRouter.js'
import appRouter, { updateQrCodes } from './routers/appRouter.js'
import auth from './middleware/auth.js'
const app = express()
const PORT = process.env.PORT || 8001

app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/dashboard', auth, appRouter)

app.listen(PORT, () => {
  console.log(`Server has started on port: ${PORT}`)
  updateQrCodes()
})