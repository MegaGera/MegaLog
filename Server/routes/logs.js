import express from 'express';
import Log from '../models/log.js';

const router = express.Router();

// Get logs with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build filter object from query parameters
    const filter = {};
    if (req.query.service) filter.service = req.query.service;
    if (req.query.username) filter.username = req.query.username;
    if (req.query.action) filter.action = req.query.action;
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      Log.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(filter)
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get unique values for filters
router.get('/filters', async (req, res) => {
  try {
    const [services, usernames, actions] = await Promise.all([
      Log.distinct('service'),
      Log.distinct('username'),
      Log.distinct('action')
    ]);

    res.json({
      services: services.sort(),
      usernames: usernames.sort(),
      actions: actions.sort()
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// Get logs for a specific service
router.get('/service/:service', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const filter = { service: req.params.service };
    
    // Add date range filter if provided
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      Log.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(filter)
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching service logs:', error);
    res.status(500).json({ error: 'Failed to fetch service logs' });
  }
});

// Get distinct usernames for a specific service
router.get('/service/:service/usernames', async (req, res) => {
  try {
    const usernames = await Log.distinct('username', { service: req.params.service });
    res.json({ usernames: usernames.sort() });
  } catch (error) {
    console.error('Error fetching service usernames:', error);
    res.status(500).json({ error: 'Failed to fetch service usernames' });
  }
});

// Get distinct actions for a specific service
router.get('/service/:service/actions', async (req, res) => {
  try {
    const actions = await Log.distinct('action', { service: req.params.service });
    res.json({ actions: actions.sort() });
  } catch (error) {
    console.error('Error fetching service actions:', error);
    res.status(500).json({ error: 'Failed to fetch service actions' });
  }
});

// Get all distinct usernames (prepared for future use)
router.get('/usernames', async (req, res) => {
  try {
    const usernames = await Log.distinct('username');
    res.json({ usernames: usernames.sort() });
  } catch (error) {
    console.error('Error fetching all usernames:', error);
    res.status(500).json({ error: 'Failed to fetch usernames' });
  }
});

// Get all distinct actions (prepared for future use)
router.get('/actions', async (req, res) => {
  try {
    const actions = await Log.distinct('action');
    res.json({ actions: actions.sort() });
  } catch (error) {
    console.error('Error fetching all actions:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

export default router; 