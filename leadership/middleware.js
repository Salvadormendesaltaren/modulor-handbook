import { createServerClient } from '@supabase/ssr';

export const config = {
  matcher: '/content/:path*',
};

export default async function middleware(request) {
  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => {
          const cookie = request.headers.get('cookie') || '';
          return cookie.split(';').map(c => {
            const [name, ...rest] = c.trim().split('=');
            return { name, value: rest.join('=') };
          }).filter(c => c.name);
        },
        setAll: () => {},
      },
    }
  );

  // Verify JWT server-side (not forgeable)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify approved domain
  const domain = user.email.split('@')[1];
  const { data: approved } = await supabase
    .from('approved_domains')
    .select('domain')
    .eq('domain', domain)
    .single();

  if (!approved) {
    return new Response('Forbidden', { status: 403 });
  }

  // Verify Leadership invitation
  const { data: invited } = await supabase
    .from('leadership_users')
    .select('email')
    .eq('email', user.email)
    .single();

  if (!invited) {
    return new Response('Forbidden – Leadership access required', { status: 403 });
  }

  // Allow request to continue
}
