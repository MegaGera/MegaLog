import { getDB } from '../config/db.js';
import { getChannel, isRabbitMQConnected } from '../config/rabbitmq.js';

class LogProcessor {
  constructor() {
    this.db = null;
    this.channel = null;
    this.isProcessing = false;
    this.consumerTag = null;
  }

  async initialize() {
    try {
      this.db = getDB();
      
      // Try to get RabbitMQ channel, but don't fail if it's not available
      this.channel = getChannel();
      
      if (this.channel) {
        console.log('✅ LogProcessor initialized with RabbitMQ connection');
      } else {
        console.log('⚠️  LogProcessor initialized without RabbitMQ (will retry when available)');
      }
      
      // Set up global reconnection handler
      global.logProcessorReconnect = () => {
        this.handleRabbitMQReconnection();
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize LogProcessor:', error);
      throw error;
    }
  }

  async handleRabbitMQReconnection() {
    console.log('🔄 RabbitMQ reconnected, updating LogProcessor...');
    
    this.channel = getChannel();
    
    if (this.channel && !this.isProcessing) {
      console.log('🚀 Starting message consumption after reconnection...');
      await this.startConsuming();
    }
  }

  async startConsuming() {
    if (!isRabbitMQConnected() || !this.channel) {
      console.log('⚠️  RabbitMQ not available, skipping message consumption');
      return false;
    }

    if (this.isProcessing) {
      console.warn('⚠️  LogProcessor is already consuming messages');
      return true;
    }

    try {
      this.isProcessing = true;
      
      const result = await this.channel.consume('logging', async (msg) => {
        if (msg !== null) {
          await this.processMessage(msg);
        }
      });
      
      this.consumerTag = result.consumerTag;
      
      console.log('✅ LogProcessor started consuming from logging queue');
      return true;
    } catch (error) {
      console.error('❌ Error starting message consumption:', error);
      this.isProcessing = false;
      this.channel = null; // Reset channel on error
      return false;
    }
  }

  async processMessage(msg) {
    try {
      // Check if we still have a valid channel
      if (!this.channel || !isRabbitMQConnected()) {
        console.warn('⚠️  Lost RabbitMQ connection during message processing');
        this.isProcessing = false;
        return;
      }

      // Parse the message
      const logData = JSON.parse(msg.content.toString());

      // Add processing metadata
      const enrichedLog = {
        ...logData,
        processed_at: new Date().toISOString(),
        message_id: msg.properties.messageId || null,
        delivery_tag: msg.fields.deliveryTag
      };

      // Store in MongoDB
      await this.storeLog(enrichedLog);
      
      // Acknowledge message
      this.channel.ack(msg);
      
      console.log(`📝 Log processed: ${logData.username} - ${logData.action}`);
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      console.error('Message content:', msg.content.toString());
      
      // Only try to nack if we still have a channel
      if (this.channel && isRabbitMQConnected()) {
        try {
          // Reject message and don't requeue to prevent infinite loops
          this.channel.nack(msg, false, false);
        } catch (nackError) {
          console.error('❌ Error nacking message:', nackError);
        }
      }
    }
  }

  async storeLog(logData) {
    try {
      const result = await this.db.collection('user_logs').insertOne(logData);
      
      if (!result.insertedId) {
        throw new Error('Failed to insert log into database');
      }
      
      return result.insertedId;
    } catch (error) {
      console.error('❌ Database insertion error:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const totalLogs = await this.db.collection('user_logs').countDocuments();
      const recentLogs = await this.db.collection('user_logs').countDocuments({
        processed_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      return {
        totalLogs,
        logsLast24h: recentLogs,
        isProcessing: this.isProcessing,
        rabbitmqConnected: isRabbitMQConnected()
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return null;
    }
  }

  async stop() {
    console.log('🛑 Stopping LogProcessor...');
    
    try {
      if (this.consumerTag && this.channel && isRabbitMQConnected()) {
        await this.channel.cancel(this.consumerTag);
        console.log('✅ Consumer cancelled');
      }
    } catch (error) {
      console.error('❌ Error cancelling consumer:', error);
    }
    
    this.isProcessing = false;
    this.consumerTag = null;
    
    // Clear global reconnection handler
    if (global.logProcessorReconnect) {
      delete global.logProcessorReconnect;
    }
  }
}

export default LogProcessor; 