import Log from '../models/log.js';

const SESSION_GAP_MS = 30 * 60 * 1000;
const MAILING_QUEUE = 'mailing';
const RESUME_TIMEZONE = 'Europe/Dublin';

const isApiOrAdminAction = (action = '') =>
  action.startsWith('API_') || action.startsWith('ADMIN_');

const formatPeriodLabel = (from, to) => {
  const opts = {
    timeZone: RESUME_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  const fromLabel = new Intl.DateTimeFormat('en-GB', opts).format(from);
  const toLabel = new Intl.DateTimeFormat('en-GB', opts).format(to);
  return `${fromLabel} → ${toLabel} (Europe/Dublin)`;
};

const countSessions = (timestamps) => {
  if (!timestamps.length) return 0;

  const sorted = [...timestamps].sort((a, b) => a - b);
  let sessions = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] >= SESSION_GAP_MS) {
      sessions += 1;
    }
  }

  return sessions;
};

const pageNameFromLog = (log) => {
  if (log.details?.page) return String(log.details.page);
  if (typeof log.action === 'string' && log.action.startsWith('VIEW_PAGE_')) {
    return log.action.replace(/^VIEW_PAGE_/, '').toLowerCase().replace(/_/g, '-');
  }
  return 'unknown';
};

export const getResumeWindow = (now = new Date()) => {
  const to = now;
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return { from, to };
};

export const buildDailyResumeStats = async (now = new Date()) => {
  const { from, to } = getResumeWindow(now);

  const [authLogs, goalLogs] = await Promise.all([
    Log.find({
      service: 'megaauth',
      timestamp: { $gte: from, $lt: to }
    }).select('username action details timestamp').lean(),
    Log.find({
      service: 'megagoal',
      timestamp: { $gte: from, $lt: to }
    }).select('username action details timestamp').lean()
  ]);

  const registers = authLogs.filter((log) => log.action === 'USER_REGISTER');
  const logins = authLogs.filter((log) => log.action === 'USER_LOGIN');
  const loginUsernames = new Set(logins.map((log) => log.username).filter(Boolean));

  const megaauth = {
    newUsersCount: registers.length,
    newUsers: registers.map((log) => ({
      username: log.username,
      ...(log.details?.email ? { email: log.details.email } : {})
    })),
    loginsTotal: logins.length,
    loginsNormal: logins.filter((log) => log.details?.loginType === 'normal').length,
    loginsTest: logins.filter((log) => log.details?.loginType === 'test').length,
    distinctLoginUsers: loginUsernames.size,
    passwordChanged: authLogs.filter((log) => log.action === 'PASSWORD_CHANGED').length,
    passwordReset: authLogs.filter((log) => log.action === 'PASSWORD_RESET').length,
    testUsersCreated: authLogs.filter((log) => log.action === 'TEST_USER_CREATED').length
  };

  const activityLogs = goalLogs.filter((log) => !isApiOrAdminAction(log.action));
  const usersByTimestamp = new Map();

  for (const log of activityLogs) {
    if (!log.username) continue;
    if (!usersByTimestamp.has(log.username)) {
      usersByTimestamp.set(log.username, []);
    }
    usersByTimestamp.get(log.username).push(new Date(log.timestamp).getTime());
  }

  let sessions = 0;
  for (const timestamps of usersByTimestamp.values()) {
    sessions += countSessions(timestamps);
  }

  const interactions = activityLogs.filter((log) => log.action === 'MATCH_INTERACTION');
  const interactionByType = {
    reaction: 0,
    match_rating: 0,
    player_voted: 0,
    other: 0
  };

  for (const log of interactions) {
    const type = log.details?.type;
    if (type === 'reaction') interactionByType.reaction += 1;
    else if (type === 'match_rating') interactionByType.match_rating += 1;
    else if (type === 'player_voted') interactionByType.player_voted += 1;
    else interactionByType.other += 1;
  }

  const pageViewCounts = new Map();
  for (const log of activityLogs) {
    if (!String(log.action || '').startsWith('VIEW_PAGE_')) continue;
    const page = pageNameFromLog(log);
    pageViewCounts.set(page, (pageViewCounts.get(page) || 0) + 1);
  }

  const pageViews = [...pageViewCounts.entries()]
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count || a.page.localeCompare(b.page));

  const megagoal = {
    distinctUsers: usersByTimestamp.size,
    sessions,
    matchesCreated: activityLogs.filter((log) => log.action === 'MATCH_CREATED').length,
    matchesDeleted: activityLogs.filter((log) => log.action === 'MATCH_DELETED').length,
    interactions: {
      total: interactions.length,
      ...interactionByType
    },
    favouriteTeamsAdded: activityLogs.filter((log) => log.action === 'ADD_FAVOURITE_TEAM').length,
    favouriteLeaguesAdded: activityLogs.filter((log) => log.action === 'ADD_FAVOURITE_LEAGUE').length,
    feedbackSubmitted: activityLogs.filter((log) => log.action === 'FEEDBACK_SUBMITTED').length,
    pageViews
  };

  return {
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      label: formatPeriodLabel(from, to)
    },
    megaauth,
    megagoal
  };
};

export const buildDailyResumeMailMessage = (stats) => {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: RESUME_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(stats.period.to));

  return {
    template: 'daily_resume',
    subject: `Mega daily resume — ${day}`,
    stats
  };
};

export { MAILING_QUEUE, RESUME_TIMEZONE };
