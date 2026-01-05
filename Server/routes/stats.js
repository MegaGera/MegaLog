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
    
    // Get today's start (midnight UTC)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    // Get yesterday's start (midnight UTC)
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(todayStart);

    const [totalLogs, logsToday, logsYesterday] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({
        timestamp: { $gte: todayStart }
      }),
      Log.countDocuments({
        timestamp: { 
          $gte: yesterdayStart,
          $lt: yesterdayEnd
        }
      })
    ]);

    res.json({
      totalLogs,
      logsToday,
      logsYesterday,
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
    
    // Get today's start (midnight UTC)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    // Get yesterday's start and end (midnight UTC)
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(todayStart);
    
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all unique services
    const services = await Log.distinct('service');
    
    // For each service, get the required stats
    const serviceStats = await Promise.all(services.map(async (service) => {
      const [totalCount, todayCount, yesterdayCount, distinctUsersToday, distinctUsersYesterday, distinctUsersLast30d, latestLog] = await Promise.all([
        Log.countDocuments({ service }),
        Log.countDocuments({ 
          service,
          timestamp: { $gte: todayStart }
        }),
        Log.countDocuments({
          service,
          timestamp: { 
            $gte: yesterdayStart,
            $lt: yesterdayEnd
          }
        }),
        Log.distinct('username', {
          service,
          timestamp: { $gte: todayStart }
        }),
        Log.distinct('username', {
          service,
          timestamp: { 
            $gte: yesterdayStart,
            $lt: yesterdayEnd
          }
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
        todayCount,
        yesterdayCount,
        todayUsersCount: distinctUsersToday.length,
        yesterdayUsersCount: distinctUsersYesterday.length,
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

// Get daily logs data for a specific service
router.get('/services/:serviceName/daily', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { period = '7d' } = req.query; // Default to 7 days
    const now = new Date();
    
    // Calculate days based on period
    let daysToShow;
    switch (period) {
      case '7d':
        daysToShow = 7;
        break;
      case '30d':
        daysToShow = 30;
        break;
      case '3m':
        daysToShow = 90; // 3 months ≈ 90 days
        break;
      default:
        daysToShow = 7;
    }
    
    // Generate array of days
    const days = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      days.push({
        date: startOfDay.toISOString().split('T')[0], // YYYY-MM-DD format
        startOfDay,
        endOfDay
      });
    }
    
    // Get logs count for each day
    const dailyData = await Promise.all(days.map(async (day) => {
      const count = await Log.countDocuments({
        service: serviceName,
        timestamp: {
          $gte: day.startOfDay,
          $lt: day.endOfDay
        }
      });
      
      return {
        date: day.date,
        count
      };
    }));
    
    res.json({
      service: serviceName,
      dailyData
    });
  } catch (error) {
    console.error('Error fetching daily logs data:', error);
    res.status(500).json({ error: 'Failed to fetch daily logs data' });
  }
});

// Get daily distinct users data for a specific service
router.get('/services/:serviceName/daily-users', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { period = '7d' } = req.query; // Default to 7 days
    const now = new Date();
    
    // Calculate days based on period
    let daysToShow;
    switch (period) {
      case '7d':
        daysToShow = 7;
        break;
      case '30d':
        daysToShow = 30;
        break;
      case '3m':
        daysToShow = 90; // 3 months ≈ 90 days
        break;
      default:
        daysToShow = 7;
    }
    
    // Generate array of days
    const days = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      days.push({
        date: startOfDay.toISOString().split('T')[0], // YYYY-MM-DD format
        startOfDay,
        endOfDay
      });
    }
    
    // Get distinct users count for each day
    const dailyData = await Promise.all(days.map(async (day) => {
      const distinctUsers = await Log.distinct('username', {
        service: serviceName,
        timestamp: {
          $gte: day.startOfDay,
          $lt: day.endOfDay
        }
      });
      
      return {
        date: day.date,
        count: distinctUsers.length
      };
    }));
    
    res.json({
      service: serviceName,
      dailyData
    });
  } catch (error) {
    console.error('Error fetching daily users data:', error);
    res.status(500).json({ error: 'Failed to fetch daily users data' });
  }
});

export default router;
