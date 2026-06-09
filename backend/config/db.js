const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

global.dbFallback = false;

const connectDB = async () => {
  try {
    // Set a strict 3-second timeout for MongoDB connection to avoid hanging the server launch
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pizza-delivery', {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✔ Connected to MongoDB successfully.');
  } catch (error) {
    console.warn('❌ MongoDB connection failed. Falling back to local file-based database...');
    global.dbFallback = true;
    
    // Create local data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
};

module.exports = connectDB;
