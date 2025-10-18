// =================================================================
//                      IMPORTS & INITIAL SETUP
// =================================================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const initializeSocketManager = require('./sockets/socketManager');

// --- Connect to Database ---
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
  },
});

// =================================================================
//                      MIDDLEWARE CONFIGURATION
// =================================================================
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
});
app.use(sessionMiddleware);

// --- Passport Setup ---
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport); // Pass passport instance to config

// =================================================================
//                      ROUTES & SOCKETS
// =================================================================
// --- API Routes ---
app.use('/auth', authRoutes);

// --- Initialize Socket.IO ---
initializeSocketManager(io, sessionMiddleware);

// =================================================================
//                      SERVER LISTENING
// =================================================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});