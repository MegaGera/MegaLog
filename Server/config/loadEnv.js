import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

if (!process.env.MONGO_URI || !process.env.DB_NAME || !process.env.MEGAQUEUE_URI) {
  console.error('Missing environment variables: MONGO_URI, DB_NAME, or MEGAQUEUE_URI');
  process.exit(1);
} 