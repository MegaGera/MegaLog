import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

// Get all logs with pagination
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      db.collection('user_logs')
        .find({})
        .sort({ processed_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('user_logs').countDocuments()
    ]);

    res.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get logs grouped by service
router.get('/by-service', async (req, res) => {
  try {
    const db = getDB();
    
    const pipeline = [
      {
        $group: {
          _id: '$service',
          logs: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          service: '$_id',
          logs: { $slice: ['$logs', 10] }, // Limit to 10 logs per service for preview
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ];

    const serviceGroups = await db.collection('user_logs').aggregate(pipeline).toArray();
    res.json(serviceGroups);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get logs for a specific service
router.get('/service/:service', async (req, res) => {
  try {
    const db = getDB();
    const service = decodeURIComponent(req.params.service);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      db.collection('user_logs')
        .find({ service })
        .sort({ processed_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('user_logs').countDocuments({ service })
    ]);

    res.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching service logs:', error);
    res.status(500).json({ error: 'Failed to fetch service logs' });
  }
});

// Search logs
router.get('/search', async (req, res) => {
  try {
    const db = getDB();
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchFilter = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { action: { $regex: query, $options: 'i' } },
        { service: { $regex: query, $options: 'i' } },
        { microservice: { $regex: query, $options: 'i' } }
      ]
    };

    const [logs, total] = await Promise.all([
      db.collection('user_logs')
        .find(searchFilter)
        .sort({ processed_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('user_logs').countDocuments(searchFilter)
    ]);

    res.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({ error: 'Failed to search logs' });
  }
});

export default router; 