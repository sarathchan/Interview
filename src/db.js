const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  const mongoUri =
    process.env.MONGO_URI || 'mongodb://localhost:27017/salary_credit_db';

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    autoIndex: true
  });

  isConnected = true;
  console.log('MongoDB connected');
}

module.exports = { connectDB };



