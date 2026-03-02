import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  // Check auth cookie
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) {
    return res.status(401).send('Unauthorized');
  }

  const token = match[1];
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  // Verify JWT with Supabase Auth API
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!userRes.ok) {
    return res.status(401).send('Unauthorized');
  }

  const user = await userRes.json();

  // Verify approved domain
  const domain = user.email.split('@')[1];
  const domainRes = await fetch(
    `${SUPABASE_URL}/rest/v1/approved_domains?domain=eq.${encodeURIComponent(domain)}&select=domain`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const domains = await domainRes.json();
  if (!Array.isArray(domains) || domains.length === 0) {
    return res.status(403).send('Forbidden');
  }

  // Validate and serve the file
  const file = req.query.file;
  if (!file || !/^redux\/[\w.-]+\.md$/.test(file)) {
    return res.status(400).send('Invalid file path');
  }

  // Try multiple possible base paths
  const candidates = [
    join(process.cwd(), '_content', file),
    join(process.cwd(), 'team', '_content', file),
    join('/var/task', '_content', file),
  ];

  for (const fullPath of candidates) {
    try {
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.send(content);
      }
    } catch {}
  }

  // Debug: list what's actually in cwd
  let debug = '';
  try {
    const cwd = process.cwd();
    const files = readdirSync(cwd);
    debug = `cwd=${cwd}, files=[${files.join(',')}]`;
  } catch (e) {
    debug = `cwd error: ${e.message}`;
  }

  return res.status(404).send(`Not found. Debug: ${debug}`);
}
