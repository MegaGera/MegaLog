import express from 'express';
import Log from '../models/log.js';
import { isRabbitMQConnected } from '../config/rabbitmq.js';

const router = express.Router();

// Helper function to safely convert timestamp to ISO string
const toISOString = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  // If it's already a string, try to parse it as a Date first
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? timestamp : date.toISOString();
};

// Get general server stats
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalLogs, logsLast24h] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({
        timestamp: { $gte: twentyFourHoursAgo }
      })
    ]);

    res.json({
      totalLogs,
      logsLast24h,
      isProcessing: isRabbitMQConnected(),
      rabbitmqConnected: isRabbitMQConnected()
    });
  } catch (error) {
    console.error('Error fetching general stats:', error);
    res.status(500).json({ error: 'Failed to fetch general statistics' });
  }
});

// Get service-specific stats
router.get('/services', async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all unique services
    const services = await Log.distinct('service');
    
    // For each service, get the required stats
    const serviceStats = await Promise.all(services.map(async (service) => {
      const [totalCount, last24HoursCount, distinctUsersLast24h, distinctUsersLast30d, latestLog] = await Promise.all([
        Log.countDocuments({ service }),
        Log.countDocuments({ 
          service,
          timestamp: { $gte: twentyFourHoursAgo }
        }),
        Log.distinct('username', {
          service,
          timestamp: { $gte: twentyFourHoursAgo }
        }),
        Log.distinct('username', {
          service,
          timestamp: { $gte: thirtyDaysAgo }
        }),
        Log.findOne({ service })
          .sort({ timestamp: -1 })
          .select('timestamp action username')
          .lean()
      ]);

      return {
        service,
        totalCount,
        last24HoursCount,
        users24HoursCount: distinctUsersLast24h.length,
        users30DaysCount: distinctUsersLast30d.length,
        latestLog: latestLog ? {
          ...latestLog,
          timestamp: toISOString(latestLog.timestamp)
        } : null
      };
    }));

    res.json(serviceStats);
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ error: 'Failed to fetch service statistics' });
  }
});

export default router;
