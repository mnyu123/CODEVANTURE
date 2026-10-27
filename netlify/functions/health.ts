import type { Config } from '@netlify/functions';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json(
      { error: 'Method not allowed.' },
      { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } },
    );
  }

  return Response.json(
    { service: 'CODEVANTURE', status: 'ok', stage: 'scaffold' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export const config: Config = {
  path: '/api/health',
};
