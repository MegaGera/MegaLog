import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('📊 MongoDB is already connected');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME
    });

    isConnected = true;
    console.log('📊 MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('📊 MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    process.exit(1);
  }
};

export const getConnection = () => mongoose.connection;
