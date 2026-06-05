import * as cheerio from 'cheerio';

export interface PlayerListItem {
  id: number;
  name: string;
  danSp: string | null;
  danDp: string | null;
  playCount: number;
  fcCount: number;
}

export interface RivalInfo {
  playerId: number;
  rivalId: number;
}

export interface TableInfo {
  id: number;
  name: string;
  symbol: string;
}

export interface TableLevel {
  level: string;
  href: string;
}

export interface TableChartEntry {
  md5: string;
  level: string;
}

export interface BbsMessage {
  id: number;
  playerId: number | null;
  playerName: string | null;
  message: string;
  postedAt: string;
}

function parseDan(danText: string): { sp: string | null; dp: string | null } {
  const parts = danText.split('/').map((s) => s.trim());
  const sp = parts[0] && parts[0] !== '-' ? parts[0] : null;
  const dp = parts[1] && parts[1] !== '-' ? parts[1] : null;
  return { sp, dp };
}

export function parsePagination(html: string): { currentPage: number; totalPages: number } {
  const $ = cheerio.load(html);
  const paginationText = $('.pagination').text().trim();
  const match = paginationText.match(/page\s+(\d+)\s+of\s+(\d+)/);
  if (!match) {
    return { currentPage: 1, totalPages: 1 };
  }
  return {
    currentPage: parseInt(match[1], 10),
    totalPages: parseInt(match[2], 10),
  };
}

export function parsePlayerList(html: string): PlayerListItem[] {
  const $ = cheerio.load(html);
  const players: PlayerListItem[] = [];

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 6) return;

    const nameLink = $(cells[1]).find('a');
    const href = nameLink.attr('href');
    if (!href) return;

    const idMatch = href.match(/\/players\/(\d+)/);
    if (!idMatch) return;

    const id = parseInt(idMatch[1], 10);
    const name = nameLink.text().trim();
    const danText = $(cells[3]).text().trim();
    const { sp, dp } = parseDan(danText);
    const playCount = parseInt($(cells[4]).text().trim().replace(/,/g, ''), 10) || 0;
    const fcCount = parseInt($(cells[5]).text().trim().replace(/,/g, ''), 10) || 0;

    players.push({
      id,
      name,
      danSp: sp,
      danDp: dp,
      playCount,
      fcCount,
    });
  });

  return players;
}

export function parsePlayerRivals(html: string, playerId: number): RivalInfo[] {
  const $ = cheerio.load(html);
  const rivals: RivalInfo[] = [];

  $('.rival-chip a').each((_i, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const match = href.match(/\/players\/(\d+)/);
    if (!match) return;

    rivals.push({
      playerId,
      rivalId: parseInt(match[1], 10),
    });
  });

  return rivals;
}

export function parseTableList(html: string): TableInfo[] {
  const $ = cheerio.load(html);
  const tables: TableInfo[] = [];

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 3) return;

    const link = $(cells[0]).find('a');
    const href = link.attr('href');
    if (!href) return;

    const match = href.match(/\/tables\/(\d+)/);
    if (!match) return;

    tables.push({
      id: parseInt(match[1], 10),
      name: link.text().trim(),
      symbol: $(cells[1]).text().trim(),
    });
  });

  return tables;
}

export function parseTableLevels(html: string): TableLevel[] {
  const $ = cheerio.load(html);
  const levels: TableLevel[] = [];

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;

    const link = $(cells[0]).find('a');
    const href = link.attr('href');
    if (!href) return;

    const text = link.text().trim();
    const symbolMatch = text.match(/^.+?(\S+)$/);
    const level = symbolMatch ? symbolMatch[1] : text;

    levels.push({ level, href });
  });

  return levels;
}

export function parseTableCharts(html: string, level: string): TableChartEntry[] {
  const $ = cheerio.load(html);
  const charts: TableChartEntry[] = [];

  $('table tbody tr').each((_i, row) => {
    const link = $(row).find('td a').first();
    const href = link.attr('href');
    if (!href) return;

    const match = href.match(/\/charts\/([a-f0-9]{32})/);
    if (!match) return;

    charts.push({ md5: match[1], level });
  });

  return charts;
}

export function parseBbsMessages(html: string): BbsMessage[] {
  const $ = cheerio.load(html);
  const messages: BbsMessage[] = [];

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;

    const id = parseInt($(cells[0]).text().trim(), 10);
    if (isNaN(id)) return;

    const playerLink = $(cells[1]).find('a');
    let playerId: number | null = null;
    let playerName: string | null = null;

    if (playerLink.length > 0) {
      const href = playerLink.attr('href');
      if (href) {
        const match = href.match(/\/players\/(\d+)/);
        if (match) {
          playerId = parseInt(match[1], 10);
        }
      }
      playerName = playerLink.text().trim();
    }

    const message = $(cells[2]).text().trim();
    const postedAt = $(cells[3]).text().trim();

    messages.push({ id, playerId, playerName, message, postedAt });
  });

  return messages;
}
