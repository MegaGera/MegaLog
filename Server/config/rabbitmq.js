import amqp from 'amqplib';

let connection = null;
let channel = null;
let isConnected = false;
let reconnectInterval = null;
let reconnectAttempts = 0;

const RECONNECT_DELAY = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = Infinity; // Keep trying indefinitely

const connectRabbitMQ = async (isReconnect = false) => {
  try {
    const rabbitmqUrl = process.env.MEGAQUEUE_URI;
    
    // If no RabbitMQ URL is configured, skip connection attempt
    if (!rabbitmqUrl) {
      if (!isReconnect) {
        console.log('⚠️  MEGAQUEUE_URI not configured - skipping RabbitMQ connection');
      }
      return false;
    }
    
    if (!isReconnect) {
      console.log('🐰 Connecting to MegaQueue...');
    } else {
      console.log(`🔄 Reconnecting to MegaQueue (attempt ${reconnectAttempts + 1})...`);
    }
    
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    
    // Ensure the logging queue exists (Consumer creates if needed)
    await channel.assertQueue('logging', {
      durable: true,        // Messages will survive broker restarts
      exclusive: false,     // Other connections can access it
      autoDelete: false     // Queue persists when consumers disconnect
    });
    
    // Set prefetch to process one message at a time for better load distribution
    await channel.prefetch(1);
    
    isConnected = true;
    reconnectAttempts = 0;
    
    // Clear any existing reconnect interval
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    
    console.log('✅ Connected to MegaQueue successfully');
    console.log('🔄 Waiting for messages from logging queue...');
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ MegaQueue connection error:', err.message);
      handleConnectionLoss();
    });
    
    connection.on('close', () => {
      console.log('⚠️  MegaQueue connection closed');
      handleConnectionLoss();
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to connect to MegaQueue:', error.message);
    handleConnectionLoss();
    return false;
  }
};

const handleConnectionLoss = () => {
  isConnected = false;
  connection = null;
  channel = null;
  
  // Don't start multiple reconnect intervals
  if (reconnectInterval) {
    return;
  }
  
  console.log(`⏱️  Will attempt to reconnect to MegaQueue in ${RECONNECT_DELAY / 1000} seconds...`);
  
  reconnectInterval = setInterval(async () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const success = await connectRabbitMQ(true);
      
      if (success) {
        // Notify LogProcessor about reconnection
        global.logProcessorReconnect && global.logProcessorReconnect();
      }
    }
  }, RECONNECT_DELAY);
};

const getChannel = () => {
  if (!channel || !isConnected) {
    return null; // Return null instead of throwing
  }
  return channel;
};

const isRabbitMQConnected = () => {
  return isConnected;
};

const closeConnection = async () => {
  try {
    // Clear reconnect interval
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    
    isConnected = false;
    
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('✅ MegaQueue connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing MegaQueue connection:', error);
  }
};

export { connectRabbitMQ, getChannel, closeConnection, isRabbitMQConnected }; 