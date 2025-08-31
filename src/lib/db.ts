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
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  
  if (connection.isConnected) {
    console.log('✅ Already connected to database');
    return;
  }

  try {
    console.log('🔍 Connecting to MongoDB...');
    
    // Add connection options for better error handling
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    const db = await mongoose.connect(MONGODB_URI, options);
    connection.isConnected = db.connections[0].readyState;
    
    console.log('✅ MongoDB connected successfully');
    console.log('🔍 Database name:', db.connection.name);
    console.log('🔍 Connection state:', db.connections[0].readyState);
    console.log('🔍 Host:', db.connection.host);
    console.log('🔍 Port:', db.connection.port);
    
    // Test the connection
    if (db.connection.db) {
      await db.connection.db.admin().ping();
      console.log('✅ Database ping successful');
    } else {
      console.log('⚠️ Database connection established but db object is undefined');
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('❌ Error name:', (error as any).name);
    console.error('❌ Error message:', (error as Error).message);
    console.error('❌ Error code:', (error as any).code);
    
    // Reset connection state
    connection.isConnected = 0;
    
    // Provide specific error messages for common issues
    if ((error as any).name === 'MongoNetworkError') {
      throw new Error(`Network error connecting to MongoDB: ${(error as Error).message}. Please check your internet connection and MongoDB URI.`);
    }
    
    if ((error as any).name === 'MongoServerSelectionError') {
      throw new Error(`Cannot connect to MongoDB server: ${(error as Error).message}. Please check your MongoDB URI and ensure the server is running.`);
    }
    
    if ((error as any).code === 'ENOTFOUND') {
      throw new Error(`DNS lookup failed for MongoDB host. Please check your MongoDB URI: ${(error as Error).message}`);
    }
    
    if ((error as any).code === 'ECONNREFUSED') {
      throw new Error(`Connection refused to MongoDB. Please check if MongoDB is running and the URI is correct: ${(error as Error).message}`);
    }
    
    throw error;
  }
}

async function disconnectDB() {
  if (connection.isConnected) {
    try {
      await mongoose.disconnect();
      connection.isConnected = 0;
      console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      connection.isConnected = 0;
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

export { connectDB, disconnectDB };
