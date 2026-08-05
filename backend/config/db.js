const mongoose = require('mongoose');
const dns = require('dns');

// Some Windows/network setups fail to resolve mongodb+srv:// SRV records
// even though the OS-level DNS resolver works fine (a known Node.js quirk).
// Pointing Node's resolver at Google's DNS directly works around it.
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Establishes the MongoDB connection using Mongoose.
 * Fails fast with a clear message if the URI is missing or unreachable,
 * since every other part of the API depends on this succeeding first.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not set. Copy .env.example to .env and configure it.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect is handled by the driver.');
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
