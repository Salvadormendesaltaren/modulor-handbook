export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = match[1];
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Verify JWT with user's token
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!userRes.ok) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await userRes.json();

  // Use service key if available, otherwise fall back to user token
  const dbHeaders = SERVICE_KEY
    ? { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    : { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` };

  // Check domain, leadership, and role in parallel
  const domain = user.email.split('@')[1];
  const [domainRes, leadershipRes, profileRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/approved_domains?domain=eq.${encodeURIComponent(domain)}&select=domain`,
      { headers: dbHeaders }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/leadership_users?email=eq.${encodeURIComponent(user.email)}&select=email`,
      { headers: dbHeaders }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${user.id}&select=role`,
      { headers: dbHeaders }
    ),
  ]);

  const domainData = await domainRes.json();
  const leadershipData = await leadershipRes.json();
  const profileData = await profileRes.json();

  const domainApproved = Array.isArray(domainData) && domainData.length > 0;
  const isLeadership = Array.isArray(leadershipData) && leadershipData.length > 0;
  const role = (Array.isArray(profileData) && profileData.length > 0) ? profileData[0].role : 'team';

  // Upsert profile (fire and forget)
  if (domainApproved) {
    const upsertHeaders = SERVICE_KEY
      ? { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }
      : { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' };

    const meta = user.user_metadata || {};
    fetch(`${SUPABASE_URL}/rest/v1/user_profiles?on_conflict=id`, {
      method: 'POST',
      headers: upsertHeaders,
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: meta.full_name || null,
        avatar_url: meta.avatar_url || null,
        last_login: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  res.setHeader('Cache-Control', 'private, no-cache');
  return res.json({ domainApproved, isLeadership, role });
}
