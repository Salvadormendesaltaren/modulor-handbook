import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export const config = {
  matcher: '/content/:path*',
};

export async function middleware(request) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Verify JWT server-side (not forgeable)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Verify approved domain
  const domain = user.email.split('@')[1];
  const { data: approved } = await supabase
    .from('approved_domains')
    .select('domain')
    .eq('domain', domain)
    .single();

  if (!approved) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return response;
}
