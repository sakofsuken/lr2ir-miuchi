import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { ghosts } from '@/db/schema';
import { getSession } from '@/server/auth/session';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ md5: string; playerId: string }> },
) {
  const { md5, playerId } = await params;
  const id = parseInt(playerId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid playerId' }, { status: 400 });
  }

  const rows = await db
    .select({ data: ghosts.data })
    .from(ghosts)
    .where(and(eq(ghosts.songMd5, md5), eq(ghosts.playerId, id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Ghost not found' }, { status: 404 });
  }

  return new Response(new Uint8Array(rows[0].data), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${md5}_${playerId}.ghost"`,
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ md5: string; playerId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { md5, playerId } = await params;
  const id = parseInt(playerId, 10);
  if (isNaN(id) || id !== session.playerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.arrayBuffer();
  const data = Buffer.from(body);

  await db
    .insert(ghosts)
    .values({ songMd5: md5, playerId: id, data })
    .onConflictDoUpdate({
      target: [ghosts.songMd5, ghosts.playerId],
      set: { data },
    });

  return NextResponse.json({ success: true });
}
