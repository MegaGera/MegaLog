import express from 'express';
import { sendDailyResumeEmail } from '../services/dailyResumeJob.js';

const router = express.Router();

// Manual trigger for the daily resume email (useful for testing)
router.post('/daily-resume', async (req, res) => {
  try {
    const { stats } = await sendDailyResumeEmail();
    res.json({
      ok: true,
      period: stats.period,
      megaauth: {
        newUsersCount: stats.megaauth.newUsersCount,
        loginsTotal: stats.megaauth.loginsTotal,
        distinctLoginUsers: stats.megaauth.distinctLoginUsers
      },
      megagoal: {
        distinctUsers: stats.megagoal.distinctUsers,
        sessions: stats.megagoal.sessions,
        matchesCreated: stats.megagoal.matchesCreated
      }
    });
  } catch (error) {
    console.error('Error triggering daily resume:', error);
    res.status(500).json({ error: error.message || 'Failed to send daily resume' });
  }
});

export default router;
