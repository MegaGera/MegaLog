import amqp from 'amqplib';

let connection = null;
let channel = null;
let isConnected = false;
let reconnectInterval = null;
let reconnectAttempts = 0;

const RECONNECT_DELAY = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = Infinity; // Keep trying indefinitely

export const connect = async () => {
  try {
    const rabbitmqUrl = process.env.MEGAQUEUE_URI;
    
    if (!rabbitmqUrl) {
      console.log('⚠️  MEGAQUEUE_URI not configured - skipping RabbitMQ connection');
      return null;
    }
    
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    
    isConnected = true;
    reconnectAttempts = 0;
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ MegaQueue connection error:', err.message);
      handleConnectionLoss();
    });
    
    connection.on('close', () => {
      console.log('⚠️  MegaQueue connection closed');
      handleConnectionLoss();
    });
    
    return channel;
  } catch (error) {
    console.error('❌ Failed to connect to MegaQueue:', error.message);
    handleConnectionLoss();
    return null;
  }
};

export const consume = async (channel, queue, processMessage) => {
  try {
    // Ensure the queue exists
    await channel.assertQueue(queue, {
      durable: true,
      exclusive: false,
      autoDelete: false
    });
    
    // Set prefetch to process one message at a time
    await channel.prefetch(1);
    
    // Start consuming messages
    await channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const success = await processMessage(msg);
        if (success) {
          channel.ack(msg);
        } else {
          channel.nack(msg, false, false); // Don't requeue to prevent infinite loops
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start consuming messages:', error);
    return false;
  }
};

const handleConnectionLoss = () => {
  isConnected = false;
  connection = null;
  channel = null;
  
  if (reconnectInterval) {
    return;
  }
  
  console.log(`⏱️  Will attempt to reconnect to MegaQueue in ${RECONNECT_DELAY / 1000} seconds...`);
  
  reconnectInterval = setInterval(async () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      await connect();
    }
  }, RECONNECT_DELAY);
};

export const closeConnection = async () => {
  try {
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

export const isRabbitMQConnected = () => isConnected; 