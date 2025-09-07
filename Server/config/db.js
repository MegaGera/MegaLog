import { MongoClient } from 'mongodb';

let db = null;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    db = client.db(process.env.DB_NAME);
    console.log('Connected to MegaLog MongoDB successfully');
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Index on timestamp for chronological queries
    await db.collection('user_logs').createIndex({ timestamp: -1 });
    
    // Index on username for user-specific queries
    await db.collection('user_logs').createIndex({ username: 1 });
    
    // Index on service for service-specific queries
    await db.collection('user_logs').createIndex({ service: 1 });
    
    // Index on action for action-specific queries
    await db.collection('user_logs').createIndex({ action: 1 });
    
    // Compound index for common query patterns
    await db.collection('user_logs').createIndex({ 
      service: 1, 
      username: 1, 
      timestamp: -1 
    });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

export { connectDB, getDB }; 