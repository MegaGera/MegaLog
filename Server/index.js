/* 
  MegaLog Server
  Consumes user action logs from MegaQueue and stores them in MongoDB
  Provides REST API for log retrieval
*/
import './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { connect, closeConnection, isRabbitMQConnected } from './config/rabbitmq.js';
import LogProcessor from './services/logProcessor.js';
import logsRouter from './routes/logs.js';
import statsRouter from './routes/stats.js';

console.log('🚀 Starting MegaLog Server...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
if (process.env.NODE_ENV === 'production') {
  console.log("Production mode - cors")
  const allowedOrigins = [/\.?megagera\.com$/];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.some((regex) => regex.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }, 
    credentials: true
  };

  app.use(cors(corsOptions));
} else {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5713',
    credentials: true
  }));
}

// Validate Api Key
if (process.env.NODE_ENV === 'production') {
  const validateApiKey = async (req, res, next) => {
    try {
      const headers = new Headers({
        Cookie: "access_token=" + req.cookies.access_token
      });
      const validateRequest = new Request(process.env.VALIDATE_URI, {
        headers: headers,
      });
      const validateResponse = await fetch(validateRequest);
      const validateData = await validateResponse.json();
      req.validateData = validateData.data;
      if (validateResponse.status === 200) {
        next();
      } else {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Can\'t validate token' });
    }
  };
  app.use(validateApiKey)
}

// API Routes
app.use('/api/logs', logsRouter);
app.use('/api/stats', statsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'MegaLog Server',
    rabbitmqConnected: isRabbitMQConnected()
  });
});

// Initialize services
const logProcessor = new LogProcessor();

const startApplication = async () => {
  try {
    // Connect to MongoDB (this is critical - fail if unavailable)
    console.log('📊 Connecting to MongoDB...');
    await connectDB();
    
    // Try to connect to RabbitMQ (non-critical - continue if unavailable)
    console.log('🐰 Connecting to MegaQueue...');
    const rabbitmqChannel = await connect();
    const rabbitmqConnected = rabbitmqChannel !== null;
    
    if (!rabbitmqConnected) {
      console.log('⚠️  MegaQueue unavailable - server will continue without message processing');
      console.log('🔄 Will attempt reconnection every 30 seconds...');
    }
    
    // Initialize log processor (this will work even without RabbitMQ)
    console.log('⚙️  Initializing LogProcessor...');
    await logProcessor.initialize();
    
    // Start consuming messages (only if RabbitMQ is available)
    if (rabbitmqConnected) {
      console.log('🔄 Starting message consumption...');
      await logProcessor.startConsuming();
    }
    
    // Start Express server
    console.log(`🌐 Starting HTTP server on port ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(`✅ HTTP API server is running on port ${PORT}`);
    });
    
    // Store server reference for graceful shutdown
    app.locals.server = server;
    
    console.log('✅ MegaLog Server is running!');
    if (rabbitmqConnected) {
      console.log('🔄 Processing logs from MegaQueue');
    } else {
      console.log('📊 API endpoints available (RabbitMQ will reconnect automatically)');
    }
    console.log('Press Ctrl+C to stop the server');
    
    // Show stats every 300 seconds (5 minutes) in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(async () => {
        const stats = await logProcessor.getStats();
        if (stats) {
          const rabbitStatus = stats.rabbitmqConnected ? '🟢 Connected' : '🔴 Disconnected';
          console.log(`📈 Stats - Total: ${stats.totalLogs}, Today: ${stats.logsToday}, Yesterday: ${stats.logsYesterday}, RabbitMQ: ${rabbitStatus}`);
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
    
    // Close HTTP server
    if (app.locals.server) {
      await new Promise((resolve) => {
        app.locals.server.close(resolve);
      });
      console.log('🌐 HTTP server closed');
    }
    
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