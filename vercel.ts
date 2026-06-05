import { routes, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'pnpm build',
  framework: 'nextjs',
  regions: ['hnd1'],
  rewrites: [routes.rewrite('/~lavalse/LR2IR/2/:path*', '/api/lr2/:path*')],
};
