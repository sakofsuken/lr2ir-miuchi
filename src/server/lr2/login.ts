import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { players, rivals } from '@/db/schema';
import { createLR2Response } from './encoding';

export async function handleLogin(params: Map<string, string>): Promise<Response> {
  const id = parseInt(params.get('id') ?? '0', 10);
  const passmd5 = params.get('passmd5') ?? '';
  const name = params.get('name') ?? '';

  if (!passmd5) {
    return createLR2Response('DB');
  }

  if (id === 0) {
    return handleRegistration(passmd5, name);
  }

  return handleLoginExisting(id, passmd5);
}

async function handleRegistration(passmd5: string, name: string): Promise<Response> {
  if (!name) {
    return createLR2Response('DB');
  }

  const result = await db
    .insert(players)
    .values({
      name,
      passMd5: passmd5,
    })
    .returning({ id: players.id });

  const newId = result[0].id;
  return createLR2Response(`NEW ${newId}`);
}

async function handleLoginExisting(id: number, passmd5: string): Promise<Response> {
  const rows = await db
    .select({
      id: players.id,
      passMd5: players.passMd5,
    })
    .from(players)
    .where(eq(players.id, id))
    .limit(1);

  if (rows.length === 0) {
    return createLR2Response('DB');
  }

  const player = rows[0];

  if (!player.passMd5) {
    await db.update(players).set({ passMd5: passmd5 }).where(eq(players.id, id));
  } else if (player.passMd5 !== passmd5) {
    return createLR2Response('DB');
  }

  const rivalRows = await db
    .select({ rivalId: rivals.rivalId })
    .from(rivals)
    .where(eq(rivals.playerId, id))
    .limit(20);

  const rivalIds = rivalRows.map((r) => r.rivalId);
  const csvParts = [id.toString(), '0', ...rivalIds.map((r) => r.toString())];
  return createLR2Response(`OK${csvParts.join(',')}`);
}
