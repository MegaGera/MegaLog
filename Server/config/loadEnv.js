import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

// Check for required MongoDB environment variables
if (!process.env.MONGO_URI || !process.env.DB_NAME) {
  console.error('Missing required environment variables: MONGO_URI or DB_NAME');
  process.exit(1);
}

// Warn if RabbitMQ environment variable is missing (but don't exit)
if (!process.env.MEGAQUEUE_URI) {
  console.warn('⚠️  MEGAQUEUE_URI not set - RabbitMQ features will be disabled');
} 