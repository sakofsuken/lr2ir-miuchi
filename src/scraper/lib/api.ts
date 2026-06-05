import { fetchJson } from './client';

interface ApiChartResponse {
  chart: {
    md5: string;
    bmsid: number | null;
    title: string;
    genre: string | null;
    artist: string | null;
    bpm_min: string | null;
    bpm_max: string | null;
    level: string | null;
    keys: string;
    judge_rank: string | null;
    play_count: number;
    play_people: number;
    clear_count: number;
    clear_people: number;
    fc_count: number;
    hard_count: number;
    normal_count: number;
    easy_count: number;
    failed_count: number;
    last_updated_by: string | null;
    last_updated_at: string | null;
    body_url: string | null;
    diff_url: string | null;
    comment: string | null;
    tag_1: string | null;
    tag_2: string | null;
    tag_3: string | null;
    tag_4: string | null;
    tag_5: string | null;
    tag_6: string | null;
    tag_7: string | null;
    tag_8: string | null;
    tag_9: string | null;
    tag_10: string | null;
    suspended: number;
  };
  leaderboard: ApiLeaderboardEntry[];
}

interface ApiLeaderboardEntry {
  rank: number;
  player_id: number;
  player_name: string;
  dan: string;
  clear_type: string;
  letter_rank: string;
  score: number;
  score_max: number;
  combo: number;
  combo_max: number;
  bad_poor: number;
  pgreat: number;
  great: number;
  good: number;
  bad: number;
  poor: number;
  option_1: string;
  option_2: string;
  input: string;
  client: string;
  note: string;
  is_cheated: number;
  has_ghost: boolean;
}

export interface ChartData {
  md5: string;
  bmsId: number | null;
  title: string;
  genre: string | null;
  artist: string | null;
  bpmMin: string | null;
  bpmMax: string | null;
  level: string | null;
  keys: string;
  judgeRank: string | null;
  playCount: number;
  playPeople: number;
  clearCount: number;
  clearPeople: number;
  fcCount: number;
  hardCount: number;
  normalCount: number;
  easyCount: number;
  failedCount: number;
  bodyUrl: string | null;
  diffUrl: string | null;
  comment: string | null;
  tags: string | null;
  suspended: number;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
}

export interface ScoreData {
  songMd5: string;
  playerId: number;
  clear: number;
  exscore: number;
  scoreMax: number | null;
  pg: number;
  gr: number;
  gd: number;
  bd: number;
  pr: number;
  maxcombo: number;
  comboMax: number | null;
  minbp: number;
  option1: string | null;
  option2: string | null;
  input: string | null;
  client: string | null;
  note: string | null;
  isCheated: number;
  hasGhost: number;
}

const CLEAR_TYPE_MAP: Record<string, number> = {
  FAILED: 1,
  EASY: 2,
  NORMAL: 3,
  HARD: 4,
  FULLCOMBO: 5,
  '★FULLCOMBO': 5,
};

function parseClearType(clearType: string): number {
  return CLEAR_TYPE_MAP[clearType] ?? 0;
}

function collectTags(chart: ApiChartResponse['chart']): string | null {
  const tags: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const key = `tag_${i}` as keyof typeof chart;
    const val = chart[key];
    if (typeof val === 'string' && val.length > 0) {
      tags.push(val);
    }
  }
  return tags.length > 0 ? tags.join(',') : null;
}

function mapChart(chart: ApiChartResponse['chart']): ChartData {
  return {
    md5: chart.md5,
    bmsId: chart.bmsid,
    title: chart.title,
    genre: chart.genre,
    artist: chart.artist,
    bpmMin: chart.bpm_min,
    bpmMax: chart.bpm_max,
    level: chart.level,
    keys: chart.keys,
    judgeRank: chart.judge_rank,
    playCount: chart.play_count,
    playPeople: chart.play_people,
    clearCount: chart.clear_count,
    clearPeople: chart.clear_people,
    fcCount: chart.fc_count,
    hardCount: chart.hard_count,
    normalCount: chart.normal_count,
    easyCount: chart.easy_count,
    failedCount: chart.failed_count,
    bodyUrl: chart.body_url,
    diffUrl: chart.diff_url,
    comment: chart.comment,
    tags: collectTags(chart),
    suspended: chart.suspended,
    lastUpdatedBy: chart.last_updated_by,
    lastUpdatedAt: chart.last_updated_at,
  };
}

function mapScore(md5: string, entry: ApiLeaderboardEntry): ScoreData {
  return {
    songMd5: md5,
    playerId: entry.player_id,
    clear: parseClearType(entry.clear_type),
    exscore: entry.score,
    scoreMax: entry.score_max || null,
    pg: entry.pgreat,
    gr: entry.great,
    gd: entry.good,
    bd: entry.bad,
    pr: entry.poor,
    maxcombo: entry.combo,
    comboMax: entry.combo_max || null,
    minbp: entry.bad_poor,
    option1: entry.option_1 || null,
    option2: entry.option_2 || null,
    input: entry.input || null,
    client: entry.client || null,
    note: entry.note || null,
    isCheated: entry.is_cheated,
    hasGhost: entry.has_ghost ? 1 : 0,
  };
}

export interface ChartApiResult {
  chart: ChartData;
  scores: ScoreData[];
  hasMorePages: boolean;
}

export async function fetchChartApi(md5: string, page = 1): Promise<ChartApiResult> {
  const data = await fetchJson<ApiChartResponse>(`/api/charts/${md5}?page=${page}`);

  return {
    chart: mapChart(data.chart),
    scores: data.leaderboard.map((entry) => mapScore(md5, entry)),
    hasMorePages: data.leaderboard.length === 100,
  };
}
