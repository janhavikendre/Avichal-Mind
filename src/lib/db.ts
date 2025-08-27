import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function connectDB() {
  console.log('🔍 Database connection state:', connection.isConnected);
  console.log('🔍 MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set');
  console.log('🔍 MONGODB_URI preview:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'Not set');
  
  if (connection.isConnected) {
    console.log('✅ Already connected to database');
    return;
  }

  try {
    console.log('🔍 Connecting to MongoDB...');
    const db = await mongoose.connect(MONGODB_URI);
    connection.isConnected = db.connections[0].readyState;
    
    console.log('✅ MongoDB connected successfully');
    console.log('🔍 Database name:', db.connection.name);
    console.log('🔍 Connection state:', db.connections[0].readyState);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function disconnectDB() {
  if (connection.isConnected) {
    await mongoose.disconnect();
    connection.isConnected = 0;
    console.log('MongoDB disconnected');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

export { connectDB, disconnectDB };
