import cron from 'node-cron';
import { isRabbitMQConnected, publishToQueue } from '../config/rabbitmq.js';
import {
  buildDailyResumeMailMessage,
  buildDailyResumeStats,
  MAILING_QUEUE,
  RESUME_TIMEZONE
} from './dailyResumeService.js';

let scheduledTask = null;

export const sendDailyResumeEmail = async (now = new Date()) => {
  if (!isRabbitMQConnected()) {
    throw new Error('RabbitMQ is not connected — cannot send daily resume');
  }

  const stats = await buildDailyResumeStats(now);
  const message = buildDailyResumeMailMessage(stats);

  await publishToQueue(MAILING_QUEUE, message);

  console.log(
    `📧 Daily resume queued (${stats.period.label}) — ` +
    `auth registers=${stats.megaauth.newUsersCount}, ` +
    `goal users=${stats.megagoal.distinctUsers}, sessions=${stats.megagoal.sessions}`
  );

  return { stats, message };
};

export const startDailyResumeJob = () => {
  if (scheduledTask) {
    return scheduledTask;
  }

  // 23:00 Ireland local time (Europe/Dublin)
  scheduledTask = cron.schedule(
    '0 23 * * *',
    async () => {
      try {
        console.log('⏰ Running daily resume job...');
        await sendDailyResumeEmail();
      } catch (error) {
        console.error('❌ Daily resume job failed:', error.message);
      }
    },
    {
      timezone: RESUME_TIMEZONE
    }
  );

  console.log(`🗓️  Daily resume scheduled at 23:00 Irish time (${RESUME_TIMEZONE})`);
  return scheduledTask;
};

export const stopDailyResumeJob = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('🛑 Daily resume job stopped');
  }
};
