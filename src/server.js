import express from 'express'
import authRouter from './routers/authRouter.js'
import appRouter, { updateQrCodes } from './routers/appRouter.js'
import auth from './middleware/auth.js'
import cors from 'cors'
const app = express()
const PORT = process.env.PORT || 8001

// Allow requests from frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies if needed
  })
);

app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/dashboard', auth, appRouter)

app.listen(PORT, () => {
  console.log(`Server has started on port: ${PORT}`)
  updateQrCodes()
})