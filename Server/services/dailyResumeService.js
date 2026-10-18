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

const formatMatchLabel = (details = {}) => {
  const home = details.teams?.home?.name || details.homeTeam;
  const away = details.teams?.away?.name || details.awayTeam;
  if (home && away) {
    const league = details.league?.name || details.leagueName;
    return league ? `${home} vs ${away} (${league})` : `${home} vs ${away}`;
  }
  if (details.fixtureId) return `Fixture ${details.fixtureId}`;
  if (details.matchId) return `Match ${details.matchId}`;
  return 'Unknown match';
};

const matchKeyFromDetails = (details = {}) => {
  if (details.fixtureId != null) return `fixture:${details.fixtureId}`;
  if (details.fixture?.id != null) return `fixture:${details.fixture.id}`;
  if (details.matchId != null) return `match:${details.matchId}`;
  return `label:${formatMatchLabel(details)}`;
};

const bumpNamedCount = (map, key, name) => {
  if (!key) return;
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
  } else {
    map.set(key, { name: name || key, count: 1 });
  }
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

  const emailByUsername = new Map();
  for (const log of registers) {
    if (log.username && log.details?.email) {
      emailByUsername.set(log.username, log.details.email);
    }
  }

  const authUserMap = new Map();
  for (const log of authLogs) {
    if (!log.username) continue;
    if (!authUserMap.has(log.username)) {
      authUserMap.set(log.username, {
        username: log.username,
        ...(emailByUsername.get(log.username)
          ? { email: emailByUsername.get(log.username) }
          : {})
      });
    }
  }

  const megaauth = {
    newUsersCount: registers.length,
    newUsers: registers.map((log) => ({
      username: log.username,
      ...(log.details?.email ? { email: log.details.email } : {})
    })),
    loginsTotal: logins.length,
    loginsNormal: logins.filter((log) => log.details?.loginType === 'normal').length,
    loginsTest: logins.filter((log) => log.details?.loginType === 'test').length,
    distinctLoginUsers: new Set(logins.map((log) => log.username).filter(Boolean)).size,
    distinctUsers: [...authUserMap.values()].sort((a, b) =>
      String(a.username).localeCompare(String(b.username))
    ),
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

  const users = [...usersByTimestamp.entries()]
    .map(([username, timestamps]) => ({
      username,
      sessions: countSessions(timestamps)
    }))
    .sort((a, b) => b.sessions - a.sessions || a.username.localeCompare(b.username));

  const sessions = users.reduce((sum, user) => sum + user.sessions, 0);

  const matchCreatedLogs = activityLogs.filter((log) => log.action === 'MATCH_CREATED');
  const matchesCreatedList = matchCreatedLogs.map((log) => ({
    label: formatMatchLabel(log.details),
    username: log.username
  }));

  const interactions = activityLogs.filter((log) => log.action === 'MATCH_INTERACTION');
  const interactionByType = {
    reaction: 0,
    match_rating: 0,
    player_voted: 0,
    other: 0
  };
  const interactionsByMatchMap = new Map();

  for (const log of interactions) {
    const type = log.details?.type;
    if (type === 'reaction') interactionByType.reaction += 1;
    else if (type === 'match_rating') interactionByType.match_rating += 1;
    else if (type === 'player_voted') interactionByType.player_voted += 1;
    else interactionByType.other += 1;

    const key = matchKeyFromDetails(log.details || {});
    const label = formatMatchLabel(log.details || {});
    if (!interactionsByMatchMap.has(key)) {
      interactionsByMatchMap.set(key, {
        label,
        count: 0,
        reaction: 0,
        match_rating: 0,
        player_voted: 0,
        other: 0,
        users: new Set()
      });
    }
    const entry = interactionsByMatchMap.get(key);
    entry.count += 1;
    if (type === 'reaction') entry.reaction += 1;
    else if (type === 'match_rating') entry.match_rating += 1;
    else if (type === 'player_voted') entry.player_voted += 1;
    else entry.other += 1;
    if (log.username) entry.users.add(log.username);
  }

  const interactionsByMatch = [...interactionsByMatchMap.values()]
    .map((entry) => ({
      label: entry.label,
      count: entry.count,
      reaction: entry.reaction,
      match_rating: entry.match_rating,
      player_voted: entry.player_voted,
      other: entry.other,
      users: [...entry.users].sort()
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const favouriteTeams = activityLogs
    .filter((log) => log.action === 'ADD_FAVOURITE_TEAM')
    .map((log) => ({
      username: log.username,
      name: log.details?.teamName || `Team ${log.details?.teamId || 'unknown'}`
    }));

  const favouriteLeagues = activityLogs
    .filter((log) => log.action === 'ADD_FAVOURITE_LEAGUE')
    .map((log) => ({
      username: log.username,
      name: log.details?.leagueName || `League ${log.details?.leagueId || 'unknown'}`
    }));

  const pageViewCounts = new Map();
  const pageEntityCounts = {
    'player-info': new Map(),
    team: new Map(),
    'league-detail': new Map()
  };

  for (const log of activityLogs) {
    if (!String(log.action || '').startsWith('VIEW_PAGE_')) continue;
    const page = pageNameFromLog(log);
    pageViewCounts.set(page, (pageViewCounts.get(page) || 0) + 1);

    const details = log.details || {};
    if (page === 'player-info') {
      const id = details.playerId != null ? String(details.playerId) : details.playerName;
      bumpNamedCount(pageEntityCounts['player-info'], id, details.playerName);
    } else if (page === 'team') {
      const id = details.teamId != null ? String(details.teamId) : details.teamName;
      bumpNamedCount(pageEntityCounts.team, id, details.teamName);
    } else if (page === 'league-detail') {
      const id = details.leagueId != null ? String(details.leagueId) : details.leagueName;
      bumpNamedCount(pageEntityCounts['league-detail'], id, details.leagueName);
    }
  }

  const pageViews = [...pageViewCounts.entries()]
    .map(([page, count]) => {
      const entityMap = pageEntityCounts[page];
      const items = entityMap
        ? [...entityMap.values()]
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
            .map(({ name, count: itemCount }) => ({ name, count: itemCount }))
        : undefined;
      return {
        page,
        count,
        ...(items?.length ? { items } : {})
      };
    })
    .sort((a, b) => b.count - a.count || a.page.localeCompare(b.page));

  const megagoal = {
    distinctUsers: users.length,
    sessions,
    users,
    matchesCreated: matchCreatedLogs.length,
    matchesCreatedList,
    matchesDeleted: activityLogs.filter((log) => log.action === 'MATCH_DELETED').length,
    interactions: {
      total: interactions.length,
      ...interactionByType,
      byMatch: interactionsByMatch
    },
    favouriteTeamsAdded: favouriteTeams.length,
    favouriteLeaguesAdded: favouriteLeagues.length,
    favouriteTeams,
    favouriteLeagues,
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
