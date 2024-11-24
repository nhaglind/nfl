import { unstable_cacheLife as cacheLife } from 'next/cache';

export type TeamBasicInfo = {
  id: string;
  displayName: string;
  logo?: string;
  color?: string;
};

type GameData = {
  id: string;
  date: string;
  name: string;
  teamId: string;
  rank: number;
  logo: string;
  color: string;
  homeScore?: number;
  awayScore?: number;
  winner?: boolean;
};

type TeamData = {
  id: string;
  name: string;
  logo: string;
  color: string;
  record: string;
  standing: string;
  games: GameData[];
};

type CompetitorData = {
  id: string;
  homeAway: string;
  team: TeamBasicInfo;
  score?: {
    value: number;
    displayValue: string;
  };
  winner?: boolean;
  records?: { summary: string }[];
  curatedRank: { current: number };
};

type ConferenceRankingEntry = {
  name: string;
  teamId: string;
  logo: string;
  color: string;
  conferenceWinLoss: string;
  gamesBack: string;
  overallWinLoss: string;
};

const DARK_LOGO_TEAMS = [];
const DEFAULT_LOGO = 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png';

function getTeamColor(teamName: string): string {
  return DARK_LOGO_TEAMS.includes(teamName) ? '000000' : 'N/A';
}

function getStat(stats: any[], name: string): string {
  return stats.find((stat: any) => stat.name === name)?.displayValue ?? '';
}

export async function getTeamData(teamId: string): Promise<TeamData> {
  'use cache';
  cacheLife('weeks');

  if (teamId.includes('teamId')) {
    return {
      id: teamId,
      name: '',
      logo: '',
      color: '',
      record: '',
      standing: '',
      games: [],
    };
  }

  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch team data: ${res.statusText}`);
  }

  const data = await res.json();

  const games: GameData[] = data.events.map((event: any) => {
    const competitors = event.competitions[0].competitors;
    const favoriteTeam = competitors.find((team: any) => team.id === teamId);
    const otherTeam = competitors.find((team: any) => team.id !== teamId);

    if (!favoriteTeam || !otherTeam) {
      throw new Error(
        'Expected to find both the favorite team and an opposing team in the event competitors'
      );
    }

    const color = getTeamColor(otherTeam.team.displayName);
    const logo = otherTeam.team.logos?.[0]?.href ?? DEFAULT_LOGO;

    return {
      id: event.competitions[0].id,
      date: event.competitions[0].status.type.shortDetail,
      name: otherTeam.team.displayName,
      teamId: otherTeam.team.id,
      logo,
      color,
      homeScore: favoriteTeam.score?.value,
      awayScore: otherTeam.score?.value,
      winner: favoriteTeam.winner,
    };
  });

  return {
    id: teamId,
    name: data.team.displayName,
    logo: data.team.logo,
    color: data.team.color,
    record: data.team.recordSummary,
    standing: data.team.standingSummary,
    games,
  };
}

export async function getAllTeamIds(): Promise<TeamBasicInfo[]> {
  'use cache';
  cacheLife('weeks');
  
  const response = await fetch(
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams'
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch team IDs: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data?.sports?.[0]?.leagues?.[0]?.teams) {
    throw new Error('Unexpected API response structure');
  }

  const teams: TeamBasicInfo[] = data.sports[0].leagues[0].teams
    .map((team: any) => ({
      id: team.team.id,
      displayName: team.team.displayName,
      abbreviation: team.team.abbreviation,
      name: team.team.name,
      location: team.team.location,
      color: team.team.color,
      alternateColor: team.team.alternateColor,
      logo: team.team.logos?.[0]?.href ?? ''
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return teams;
}

export async function getTodaySchedule() {
  'use cache';
  cacheLife('days');

  const res = await fetch(
    'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch today's schedule: ${res.statusText}`);
  }

  const data = await res.json();

  const games = data.events.map((event: any) => {
    const [homeTeam, awayTeam] = event.competitions[0].competitors;

    if (!homeTeam || !awayTeam) {
      throw new Error(
        'Expected to find both home and away teams in the event competitors'
      );
    }

    return {
      status: event.competitions[0].status.type.shortDetail,
      homeTeam: formatTeamData(homeTeam),
      awayTeam: formatTeamData(awayTeam),
    };
  });

  return {
    date: new Date().toISOString(),
    games,
  };
}

function formatTeamData(teamData: CompetitorData) {
  return {
    name: teamData.team.displayName,
    teamId: teamData.team.id,
    logo: teamData.team.logo ?? null,
    color: getTeamColor(teamData.team.displayName),
    score: teamData.score,
    winner: teamData.winner,
    record: teamData.records?.[0]?.summary ?? 'N/A'
  };
}

export async function getConferenceRankings() {
  'use cache';
  cacheLife('hours');
  
  const res = await fetch(
    'https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings?region=us&lang=en&contentorigin=espn&group=8&season=2024'
  );
  
  if (!res.ok) {
    throw new Error(`Failed to fetch conference rankings: ${res.statusText}`);
  }
  
  const data = await res.json();
  
  if (!data?.children?.[0]?.standings?.entries) {
    console.error('Unexpected data structure:', JSON.stringify(data, null, 2));
    throw new Error('Unexpected standings data structure');
  }

  let teamsData = data.children[0].standings.entries.map((entry: any) => {
    const { team, stats } = entry;
    return {
      name: team.displayName,
      teamId: team.id,
      logo: team.logos?.[0]?.href ?? null,
      color: getTeamColor(team.displayName),
      conferenceWinLoss: getStat(stats, 'vs. Conf.'),
      gamesBack: getStat(stats, 'gamesBehind'),
      overallWinLoss: `${getStat(stats, 'wins')}-${getStat(stats, 'losses')}`,
    };
  });

  return teamsData.sort((a, b) => {
    if (a.gamesBack === '-' && b.gamesBack !== '-') return -1;
    if (a.gamesBack !== '-' && b.gamesBack === '-') return 1;
    if (a.gamesBack === '-' && b.gamesBack === '-') return 0;
    return parseFloat(a.gamesBack) - parseFloat(b.gamesBack);
  });
}
