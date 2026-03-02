export const config = {
  matcher: '/content/:path*',
};

export default async function middleware(request) {
  // Read access token from cookie
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = match[1];
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  // Verify JWT with Supabase Auth API (server-side, not forgeable)
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!userRes.ok) {
    return new Response('Unauthorized', { status: 401 });
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
    return new Response('Forbidden', { status: 403 });
  }

  // Verify Leadership invitation
  const invitedRes = await fetch(
    `${SUPABASE_URL}/rest/v1/leadership_users?email=eq.${encodeURIComponent(user.email)}&select=email`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const invited = await invitedRes.json();
  if (!Array.isArray(invited) || invited.length === 0) {
    return new Response('Forbidden – Leadership access required', { status: 403 });
  }

  // Allow request to continue
}
