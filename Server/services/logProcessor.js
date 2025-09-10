import { getConnection } from '../config/db.js';
import Log from '../models/log.js';
import { connect, consume } from '../config/rabbitmq.js';

class LogProcessor {
  constructor() {
    this.channel = null;
    this.queue = process.env.QUEUE_NAME || 'logging';
    this.isProcessing = false;
  }

  async initialize() {
    try {
      // RabbitMQ connection will be handled by the connect() function
      console.log('LogProcessor initialized');
    } catch (error) {
      console.error('Failed to initialize LogProcessor:', error);
      throw error;
    }
  }

  async processMessage(message) {
    try {
      const logData = JSON.parse(message.content.toString());
      
      // Create a new log entry using the Mongoose model
      const log = new Log({
        timestamp: new Date(logData.timestamp),
        action: logData.action,
        username: logData.username,
        service: logData.service,
        // Add any other fields from logData
      });

      // Save the log to MongoDB
      await log.save();
      
      console.log(`✅ Processed log: ${logData.action} by ${logData.username} in ${logData.service}`);
      
      return true;
    } catch (error) {
      console.error('Error processing message:', error);
      return false;
    }
  }

  async startConsuming() {
    try {
      this.channel = await connect();
      if (!this.channel) {
        throw new Error('No RabbitMQ channel available');
      }

      await consume(this.channel, this.queue, this.processMessage.bind(this));
      this.isProcessing = true;
      
      console.log(`🔄 Started consuming messages from queue: ${this.queue}`);
    } catch (error) {
      console.error('Failed to start consuming messages:', error);
      this.isProcessing = false;
      throw error;
    }
  }

  async stop() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      this.isProcessing = false;
      console.log('🛑 Stopped consuming messages');
    } catch (error) {
      console.error('Error stopping consumer:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const connection = getConnection();
      if (!connection || connection.readyState !== 1) {
        return null;
      }

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [totalLogs, logsLast24h] = await Promise.all([
        Log.countDocuments(),
        Log.countDocuments({
          timestamp: { $gte: twentyFourHoursAgo }
        })
      ]);

      return {
        totalLogs,
        logsLast24h,
        isProcessing: this.isProcessing,
        rabbitmqConnected: this.channel !== null
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

export default LogProcessor; 