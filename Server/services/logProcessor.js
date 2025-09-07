import { getDB } from '../config/db.js';
import { getChannel } from '../config/rabbitmq.js';

class LogProcessor {
  constructor() {
    this.db = null;
    this.channel = null;
    this.isProcessing = false;
  }

  async initialize() {
    try {
      this.db = getDB();
      this.channel = getChannel();
      console.log('LogProcessor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LogProcessor:', error);
      throw error;
    }
  }

  async startConsuming() {
    if (this.isProcessing) {
      console.warn('LogProcessor is already consuming messages');
      return;
    }

    try {
      this.isProcessing = true;
      
      await this.channel.consume('logging', async (msg) => {
        if (msg !== null) {
          await this.processMessage(msg);
        }
      });
      
      console.log('LogProcessor started consuming from logging queue');
    } catch (error) {
      console.error('Error starting message consumption:', error);
      this.isProcessing = false;
      throw error;
    }
  }

  async processMessage(msg) {
    try {
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
      
      console.log(`Log processed: ${logData.username} - ${logData.action}`);
      
    } catch (error) {
      console.error('Error processing message:', error);
      console.error('Message content:', msg.content.toString());
      
      // Reject message and don't requeue to prevent infinite loops
      this.channel.nack(msg, false, false);
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
      console.error('Database insertion error:', error);
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
        isProcessing: this.isProcessing
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  async stop() {
    console.log('Stopping LogProcessor...');
    this.isProcessing = false;
  }
}

export default LogProcessor; 