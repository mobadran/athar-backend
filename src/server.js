import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routers/authRouter.js';
import appRouter, { updateQrCodes } from './routers/appRouter.js';
import businessRouter from './routers/businessRouter.js';
import auth from './middleware/auth.js';

//* Connect to database
import db from './database/db.js';
db();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: "http://localhost:5500",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/dashboard', auth, appRouter);
app.use('/api/business', businessRouter);
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.info(`Server has started on: http://localhost:${PORT}`);
  updateQrCodes();
});