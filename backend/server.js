const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const { setupSocketInteractions } = require('./socketHandler');
const { setIo } = require('./controllers/rideController');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Uber Server is up and running.' });
});

// Socket.io Connection (Delegated to handler)
setupSocketInteractions(io);
// Inject io into the ride controller for server-side emissions
setIo(io);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uber-clone';
console.log('Connecting to MongoDB database...');
mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start Server only after DB connection
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
