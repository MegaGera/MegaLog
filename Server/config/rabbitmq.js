import amqp from 'amqplib';

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    const rabbitmqUrl = process.env.MEGAQUEUE_URI;
    
    console.log('Connecting to MegaQueue...');
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
    
    console.log('Connected to MegaQueue successfully');
    console.log('Waiting for messages from logging queue...');
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error('MegaQueue connection error:', err.message);
      process.exit(1);
    });
    
    connection.on('close', () => {
      console.log('MegaQueue connection closed');
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Failed to connect to MegaQueue:', error.message);
    process.exit(1);
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ not connected');
  }
  return channel;
};

const closeConnection = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('MegaQueue connection closed gracefully');
  } catch (error) {
    console.error('Error closing MegaQueue connection:', error);
  }
};

export { connectRabbitMQ, getChannel, closeConnection }; 