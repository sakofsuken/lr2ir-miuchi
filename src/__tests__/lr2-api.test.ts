import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import iconv from 'iconv-lite';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as schema from '@/db/schema';
import { parseFormBody, decodeShiftJISUrlEncoded } from '@/server/lr2/encoding';

const client = createClient({ url: ':memory:' });
const testDb = drizzle(client, { schema });

vi.mock('@/db', () => ({
  db: testDb,
}));

beforeAll(async () => {
  await migrate(testDb, {
    migrationsFolder: resolve(__dirname, '../../drizzle'),
  });
});

beforeEach(async () => {
  await testDb.delete(schema.ghosts);
  await testDb.delete(schema.scores);
  await testDb.delete(schema.rivals);
  await testDb.delete(schema.charts);
  await testDb.delete(schema.players);
});

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

function encodeShiftJISParam(value: string): string {
  const sjisBytes = iconv.encode(value, 'shift_jis');
  let encoded = '';
  for (const byte of sjisBytes) {
    if (
      (byte >= 0x30 && byte <= 0x39) ||
      (byte >= 0x41 && byte <= 0x5a) ||
      (byte >= 0x61 && byte <= 0x7a)
    ) {
      encoded += String.fromCharCode(byte);
    } else {
      encoded += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return encoded;
}

describe('LR2 encoding utilities', () => {
  it('parseFormBody splits key=value pairs', () => {
    const params = parseFormBody('id=123&name=test&version=100130');
    expect(params.get('id')).toBe('123');
    expect(params.get('name')).toBe('test');
    expect(params.get('version')).toBe('100130');
  });

  it('parseFormBody handles empty pairs (&&)', () => {
    const params = parseFormBody('a=1&&b=2');
    expect(params.get('a')).toBe('1');
    expect(params.get('b')).toBe('2');
  });

  it('decodeShiftJISUrlEncoded decodes Shift_JIS values', () => {
    const encoded = encodeShiftJISParam('テスト');
    const decoded = decodeShiftJISUrlEncoded(encoded);
    expect(decoded).toBe('テスト');
  });
});

describe('login.cgi', () => {
  it('registers a new player when id=0', async () => {
    const { handleLogin } = await import('@/server/lr2/login');
    const passmd5 = md5('testpassword');
    const params = new Map([
      ['id', '0'],
      ['passmd5', passmd5],
      ['name', 'TestPlayer'],
      ['version', '100130'],
    ]);

    const response = await handleLogin(params);
    const body = await response.text();
    expect(body).toMatch(/^#NEW \d+$/);

    const newId = parseInt(body.replace('#NEW ', ''), 10);
    expect(newId).toBeGreaterThan(0);
  });

  it('logs in an existing player', async () => {
    const passmd5 = md5('testpassword');
    await testDb.insert(schema.players).values({
      id: 1001,
      name: 'ExistingPlayer',
      passMd5: passmd5,
    });

    const { handleLogin } = await import('@/server/lr2/login');
    const params = new Map([
      ['id', '1001'],
      ['passmd5', passmd5],
      ['name', 'ExistingPlayer'],
      ['version', '100130'],
    ]);

    const response = await handleLogin(params);
    const body = await response.text();
    expect(body).toMatch(/^#OK1001/);
  });

  it('rejects wrong password', async () => {
    await testDb.insert(schema.players).values({
      id: 1002,
      name: 'Player2',
      passMd5: md5('correctpassword'),
    });

    const { handleLogin } = await import('@/server/lr2/login');
    const params = new Map([
      ['id', '1002'],
      ['passmd5', md5('wrongpassword')],
      ['name', 'Player2'],
      ['version', '100130'],
    ]);

    const response = await handleLogin(params);
    const body = await response.text();
    expect(body).toBe('#DB');
  });

  it('sets passMd5 on first LR2 login for existing player without passMd5', async () => {
    await testDb.insert(schema.players).values({
      id: 1003,
      name: 'WebOnlyPlayer',
    });

    const passmd5 = md5('newpassword');
    const { handleLogin } = await import('@/server/lr2/login');
    const params = new Map([
      ['id', '1003'],
      ['passmd5', passmd5],
      ['name', 'WebOnlyPlayer'],
      ['version', '100130'],
    ]);

    const response = await handleLogin(params);
    const body = await response.text();
    expect(body).toMatch(/^#OK1003/);

    const rows = await testDb
      .select({ passMd5: schema.players.passMd5 })
      .from(schema.players)
      .where(eq(schema.players.id, 1003));
    expect(rows[0].passMd5).toBe(passmd5);
  });
});

describe('score.cgi', () => {
  it('submits a score', async () => {
    const passmd5 = md5('testpassword');
    const songmd5 = 'a'.repeat(32);
    const exscore = 1200;
    const clear = 4;
    const scorehash = md5(passmd5 + songmd5 + exscore.toString() + clear.toString());

    await testDb.insert(schema.players).values({
      id: 2001,
      name: 'ScorePlayer',
      passMd5: passmd5,
    });

    const { handleScore } = await import('@/server/lr2/score');
    const params = new Map([
      ['id', '2001'],
      ['passmd5', passmd5],
      ['songmd5', songmd5],
      ['scorehash', scorehash],
      ['title', 'TestSong'],
      ['genre', 'TestGenre'],
      ['artist', 'TestArtist'],
      ['maxbpm', '180'],
      ['minbpm', '180'],
      ['playlevel', '12'],
      ['clear', clear.toString()],
      ['exscore', exscore.toString()],
      ['pg', '500'],
      ['gr', '200'],
      ['gd', '30'],
      ['bd', '10'],
      ['pr', '5'],
      ['maxcombo', '600'],
      ['playcount', '1'],
      ['clearcount', '1'],
      ['rate', '80'],
      ['minbp', '15'],
      ['totalnotes', '745'],
      ['opt_history', '0'],
      ['opt_this', '0'],
      ['line', '7'],
      ['judge', '0'],
      ['inputtype', '0'],
      ['ghost', ''],
      ['rseed', '12345'],
      ['clear_db', '0'],
      ['clear_ex', '0'],
      ['clear_sd', '0'],
    ]);

    const response = await handleScore(params);
    const body = await response.text();
    expect(body).toBe('#OK');

    const scoreRows = await testDb
      .select()
      .from(schema.scores)
      .where(eq(schema.scores.songMd5, songmd5));
    expect(scoreRows).toHaveLength(1);
    expect(scoreRows[0].exscore).toBe(1200);
    expect(scoreRows[0].clear).toBe(4);

    const chartRows = await testDb
      .select()
      .from(schema.charts)
      .where(eq(schema.charts.md5, songmd5));
    expect(chartRows).toHaveLength(1);
    expect(chartRows[0].title).toBe('TestSong');
  });

  it('rejects invalid scorehash', async () => {
    const passmd5 = md5('testpassword');
    await testDb.insert(schema.players).values({
      id: 2002,
      name: 'HashPlayer',
      passMd5: passmd5,
    });

    const { handleScore } = await import('@/server/lr2/score');
    const params = new Map([
      ['id', '2002'],
      ['passmd5', passmd5],
      ['songmd5', 'b'.repeat(32)],
      ['scorehash', 'invalidhash'],
      ['exscore', '100'],
      ['clear', '2'],
      ['totalnotes', '100'],
    ]);

    const response = await handleScore(params);
    const body = await response.text();
    expect(body).toBe('#ERROR');
  });
});

describe('getrankingxml.cgi', () => {
  it('returns ranking XML', async () => {
    const songmd5 = 'c'.repeat(32);
    await testDb.insert(schema.players).values([
      { id: 3001, name: 'Player1' },
      { id: 3002, name: 'Player2' },
    ]);
    await testDb.insert(schema.charts).values({
      md5: songmd5,
      title: 'RankingSong',
      keys: '7',
    });
    await testDb.insert(schema.scores).values([
      {
        songMd5: songmd5,
        playerId: 3001,
        clear: 5,
        exscore: 2000,
        pg: 900,
        gr: 200,
        gd: 10,
        bd: 5,
        pr: 3,
        maxcombo: 1118,
        minbp: 8,
      },
      {
        songMd5: songmd5,
        playerId: 3002,
        clear: 3,
        exscore: 1500,
        pg: 600,
        gr: 300,
        gd: 50,
        bd: 20,
        pr: 10,
        maxcombo: 800,
        minbp: 30,
      },
    ]);

    const { handleGetRanking } = await import('@/server/lr2/ranking');
    const params = new Map([
      ['songmd5', songmd5],
      ['id', '3001'],
      ['lastupdate', ''],
    ]);

    const response = await handleGetRanking(params);
    const body = await response.text();
    expect(body).toContain('#');
    expect(body).toContain('<ranking>');
    expect(body).toContain('<name>Player1</name>');
    expect(body).toContain('<name>Player2</name>');
    expect(body).toContain('<pg>900</pg>');

    const player1Pos = body.indexOf('Player1');
    const player2Pos = body.indexOf('Player2');
    expect(player1Pos).toBeLessThan(player2Pos);
  });
});

describe('getghost.cgi', () => {
  it('returns top ghost data', async () => {
    const songmd5 = 'd'.repeat(32);
    await testDb.insert(schema.players).values({ id: 4001, name: 'GhostPlayer' });
    await testDb.insert(schema.charts).values({ md5: songmd5, title: 'GhostSong', keys: '7' });
    await testDb.insert(schema.scores).values({
      songMd5: songmd5,
      playerId: 4001,
      clear: 4,
      exscore: 1800,
      pg: 800,
      gr: 200,
      maxcombo: 1000,
      minbp: 5,
    });
    await testDb.insert(schema.ghosts).values({
      songMd5: songmd5,
      playerId: 4001,
      data: Buffer.from('J3XZZZ', 'utf-8'),
    });

    const { handleGetGhost } = await import('@/server/lr2/ghost');
    const params = new Map([
      ['songmd5', songmd5],
      ['mode', 'top'],
      ['playerid', '0'],
    ]);

    const response = await handleGetGhost(params);
    const buffer = Buffer.from(await response.arrayBuffer());
    const body = iconv.decode(buffer, 'shift_jis');
    expect(body).toContain('#GhostPlayer,1800,0,J3XZZZ');
  });

  it('returns NOPLAYER when no scores exist', async () => {
    const { handleGetGhost } = await import('@/server/lr2/ghost');
    const params = new Map([
      ['songmd5', 'e'.repeat(32)],
      ['mode', 'top'],
      ['playerid', '0'],
    ]);

    const response = await handleGetGhost(params);
    const body = await response.text();
    expect(body).toContain('NOPLAYER');
  });
});
