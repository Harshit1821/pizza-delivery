require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const dbService = require('./models/dbService');

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for local development simplicity
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for easy debugging
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Pizza Delivery API is running.' });
});

// Socket.io Real-time handlers
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`⚡ Socket joined user room: ${userId}`);
  });

  socket.on('join_admin', () => {
    socket.join('admins');
    console.log('⚡ Socket joined admin room');
  });

  socket.on('disconnect', () => {
    console.log('⚡ Client disconnected:', socket.id);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Try connecting to MongoDB first (falls back if offline/not installed)
  await connectDB();
  
  // Populates stock options (Mongoose or local MockDb)
  await dbService.initializeInventory();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`✔ Pizza Delivery server listening on port ${PORT}`);
    console.log(`✔ Database Mode: ${global.dbFallback ? 'Local JSON Fallback DB' : 'MongoDB'}`);
    console.log(`✔ Socket.io Enabled`);
    console.log(`=======================================================`);
  });
};

startServer();
