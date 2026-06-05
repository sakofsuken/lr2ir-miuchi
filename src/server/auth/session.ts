import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { db } from '@/db';
import { sessions, players } from '@/db/schema';

const SESSION_COOKIE = 'lr2ir_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(playerId: number): Promise<string> {
  const id = generateSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id,
    playerId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return id;
}

export async function getSession(): Promise<{ playerId: number } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const rows = await db
    .select({
      playerId: sessions.playerId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (rows.length === 0) return null;

  const session = rows[0];
  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  return { playerId: session.playerId };
}

export async function getSessionPlayer() {
  const session = await getSession();
  if (!session) return null;

  const rows = await db
    .select({
      id: players.id,
      name: players.name,
    })
    .from(players)
    .where(eq(players.id, session.playerId))
    .limit(1);

  return rows[0] ?? null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return;

  await db.delete(sessions).where(eq(sessions.id, sessionId));
  cookieStore.delete(SESSION_COOKIE);
}
