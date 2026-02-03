import mongoose from 'mongoose';

// MongoDB connection configuration
// Supports multiple authentication methods:
// 1. MONGODB_URI (full connection string in env)
// 2. Individual env vars (MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE, etc.)

let isConnected = false;

export const connectToMongoDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    let connectionUri: string;

    // Method 1: Full connection URI
    if (process.env.MONGODB_URI) {
      console.log('Using MongoDB connection from MONGODB_URI');
      connectionUri = process.env.MONGODB_URI;
    }
    // Method 2: Build from individual env vars
    else {
      const host = process.env.MONGODB_HOST || 'localhost';
      const port = process.env.MONGODB_PORT || '27017';
      const database = process.env.MONGODB_DATABASE || 'travox';
      const user = process.env.MONGODB_USER;
      const password = process.env.MONGODB_PASSWORD;
      const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';

      if (user && password) {
        console.log('Using MongoDB connection with authentication');
        connectionUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=${authSource}`;
      } else {
        console.log('Using MongoDB connection without authentication');
        connectionUri = `mongodb://${host}:${port}/${database}`;
      }
    }

    // Mongoose connection options
    const options: mongoose.ConnectOptions = {
      // Connection pool settings
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
      
      // Timeout settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Other settings
      retryWrites: true,
    };

    await mongoose.connect(connectionUri, options);
    isConnected = true;

    console.log('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err: Error) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectFromMongoDB = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

export const getMongooseConnection = (): mongoose.Connection => {
  return mongoose.connection;
};

export { mongoose };
