import { parseFormBody } from '@/server/lr2/encoding';
import { handleGetGhost } from '@/server/lr2/ghost';
import { handleGetInsaneList } from '@/server/lr2/insanelist';
import { handleLogin } from '@/server/lr2/login';
import { handleGetPlayer } from '@/server/lr2/player';
import { handleGetRanking } from '@/server/lr2/ranking';
import { handleScore } from '@/server/lr2/score';

const HANDLERS: Record<string, (params: Map<string, string>) => Promise<Response>> = {
  'login.cgi': handleLogin,
  'score.cgi': handleScore,
  'getrankingxml.cgi': handleGetRanking,
  'getplayerxml.cgi': handleGetPlayer,
  'getghost.cgi': handleGetGhost,
  'getinsanelist.cgi': () => handleGetInsaneList(),
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const endpoint = path[path.length - 1];

  const handler = HANDLERS[endpoint];
  if (!handler) {
    return new Response('Not Found', { status: 404 });
  }

  const rawBody = await request.text();
  const formParams = parseFormBody(rawBody);

  return handler(formParams);
}
