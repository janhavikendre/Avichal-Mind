import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function connectDB(retryCount = 0, maxRetries = 3) {
  console.log('🔍 Database connection state:', connection.isConnected);
  console.log('🔍 MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set');
  console.log('🔍 MONGODB_URI preview:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'Not set');
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 Retry attempt:', retryCount + 1, 'of', maxRetries + 1);
  
  if (connection.isConnected) {
    console.log('✅ Already connected to database');
    return;
  }

  try {
    console.log('🔍 Connecting to MongoDB...');
    
    // Add connection options for better error handling and retry logic
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased from 5000
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000, // Add connection timeout
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: 30000,
    };
    
    // Set mongoose-specific options
    mongoose.set('bufferCommands', false);
    
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
    
    // Retry logic for network errors
    if (retryCount < maxRetries && (
      (error as any).name === 'MongoNetworkError' ||
      (error as any).name === 'MongoServerSelectionError' ||
      (error as any).code === 'ETIMEOUT' ||
      (error as Error).message.includes('ETIMEOUT')
    )) {
      console.log(`🔄 Retrying connection in ${(retryCount + 1) * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return connectDB(retryCount + 1, maxRetries);
    }
    
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
    
    if ((error as any).code === 'ETIMEOUT' || (error as Error).message.includes('ETIMEOUT')) {
      throw new Error(`MongoDB connection timeout. Please check your internet connection and try again: ${(error as Error).message}`);
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
