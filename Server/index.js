/* 
  MegaLog Server
  Consumes user action logs from MegaQueue and stores them in MongoDB
*/
import './config/loadEnv.js';
import { connectDB } from './config/db.js';
import { connectRabbitMQ, closeConnection } from './config/rabbitmq.js';
import LogProcessor from './services/logProcessor.js';

console.log('🚀 Starting MegaLog Server...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Initialize services
const logProcessor = new LogProcessor();

const startApplication = async () => {
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await connectDB();
    
    // Connect to RabbitMQ
    console.log('🐰 Connecting to MegaQueue...');
    await connectRabbitMQ();
    
    // Initialize log processor
    console.log('⚙️  Initializing LogProcessor...');
    await logProcessor.initialize();
    
    // Start consuming messages
    console.log('🔄 Starting message consumption...');
    await logProcessor.startConsuming();
    
    console.log('✅ MegaLog Server is running and processing logs!');
    console.log('Press Ctrl+C to stop the server');
    
    // Show stats every 300 seconds (5 minutes) in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(async () => {
        const stats = await logProcessor.getStats();
        if (stats) {
          console.log(`📈 Stats - Total: ${stats.totalLogs}, Last 24h: ${stats.logsLast24h}`);
        }
      }, 300000); // 5 minutes
    }
    
  } catch (error) {
    console.error('❌ Failed to start MegaLog Server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop processing new messages
    await logProcessor.stop();
    
    // Close RabbitMQ connection
    await closeConnection();
    
    console.log('✅ MegaLog Server stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
startApplication(); 