import express from 'express';
import { getDB } from '../config/db.js';
import { isRabbitMQConnected } from '../config/rabbitmq.js';

const router = express.Router();

// Get server stats
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    
    const totalLogs = await db.collection('user_logs').countDocuments();
    const recentLogs = await db.collection('user_logs').countDocuments({
      processed_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    // Get RabbitMQ connection status
    const rabbitmqConnected = isRabbitMQConnected();
    
    res.json({
      totalLogs,
      logsLast24h: recentLogs,
      isProcessing: rabbitmqConnected, // Processing is only active when RabbitMQ is connected
      rabbitmqConnected
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router; 