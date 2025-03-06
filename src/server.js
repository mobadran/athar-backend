const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
// const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRouter = require('./routers/authRouter.js');
const { updateQrCodes } = require('./routers/appRouter.js');
const appRouter = require('./routers/appRouter.js');
const businessRouter = require('./routers/businessRouter.js');
const auth = require('./middleware/auth.js');

//* Connect to database
const db = require('./database/db.js');
db();

const app = express();
const PORT = process.env.PORT || 8080;

// app.use(
//   cors({
//     origin: "http://127.0.0.1:5500",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.resolve('public')));
app.use('/api/auth', authRouter);
app.use('/api/dashboard', auth, appRouter);
app.use('/api/business', businessRouter);
app.use('/api/*', (req, res) => {
  return res.status(404).json({ error: 'API Not Found' });
});
app.use('/uploads', express.static('uploads'));
app.use('*', (req, res) => {
  return res.status(404).sendFile(path.resolve('public/404.html'));
});

app.listen(PORT, () => {
  console.info(`Server has started on: http://localhost:${PORT}`);
  updateQrCodes();
});