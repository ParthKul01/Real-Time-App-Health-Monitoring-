const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

// Import Routes
const authRoutes = require('./routes/authRoutes');

// Import the Database Pool and the Monitoring Engine
const db = require('./config/db');
const { startMonitoringEngine } = require('./services/monitorEngine');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

// Verify Database Connection and Start the Engine
(async () => {
  try {
    // Test the pool connection to AWS RDS
    const connection = await db.getConnection();
    console.log(`✅ Connected to AWS RDS MySQL Database: ${process.env.DB_NAME}`);
    connection.release();

    // Start the real-time background ping engine loop (checks every 15 seconds)
    startMonitoringEngine(db, 15000);

  } catch (err) {
    console.error('❌ Database connection failed on startup:', err.message);
  }
})();

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});