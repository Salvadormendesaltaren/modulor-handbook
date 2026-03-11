import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findContent(file) {
  const candidates = [
    join(__dirname, '..', '_content', file),
    join(process.cwd(), '_content', file),
    join('/var/task', '_content', file),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

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
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Headers for DB queries: service key bypasses RLS; fallback to user token
  const dbHeaders = SERVICE_KEY
    ? { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    : { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` };

  // Validate file path early (no network needed)
  const file = req.query.file;
  if (!file || !/^(redux|full|lite)\/[\w.-]+\.md$/.test(file) || file.includes('..')) {
    return res.status(400).send('Invalid file path');
  }

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

  // Check domain + leadership in parallel
  const domain = user.email.split('@')[1];
  const needsLeadership = file.startsWith('full/') || file.startsWith('lite/');

  const checks = [
    fetch(
      `${SUPABASE_URL}/rest/v1/approved_domains?domain=eq.${encodeURIComponent(domain)}&select=domain`,
      { headers: dbHeaders }
    ),
  ];
  if (needsLeadership) {
    checks.push(
      fetch(
        `${SUPABASE_URL}/rest/v1/leadership_users?email=eq.${encodeURIComponent(user.email)}&select=email`,
        { headers: dbHeaders }
      )
    );
  }

  const results = await Promise.all(checks);

  const domains = await results[0].json();
  if (!Array.isArray(domains) || domains.length === 0) {
    return res.status(403).send('Forbidden');
  }

  if (needsLeadership) {
    const invited = await results[1].json();
    if (!Array.isArray(invited) || invited.length === 0) {
      return res.status(403).send('Forbidden');
    }
  }

  const fullPath = findContent(file);
  if (!fullPath) {
    return res.status(404).send('Not found');
  }

  const content = readFileSync(fullPath, 'utf-8');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Cache-Control', 'private, max-age=300');
  return res.send(content);
}
