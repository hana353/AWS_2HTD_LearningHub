// src/server.js
// Điểm vào chính, start Express server sau khi connect DB

import dotenv from 'dotenv';
import app from './app.js';
import { poolConnect } from './config/db.js';
import { ensureSingleAdmin } from './models/user.model.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Đảm bảo connect DB trước
    await poolConnect;

     // Seed đảm bảo chỉ có 1 Admin
    await ensureSingleAdmin();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`💡 Please either:`);
        console.error(`   1. Stop the process using port ${PORT}`);
        console.error(`   2. Or change the PORT in your .env file`);
        console.error(`\n   To find and kill the process on Windows:`);
        console.error(`   netstat -ano | findstr :${PORT}`);
        console.error(`   taskkill /PID <PID> /F`);
      } else {
        console.error('Failed to start server:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
