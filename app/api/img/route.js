import { fetchWithTimeout } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOSTS = [
  /(^|\.)tiktokcdn(-us)?\.com$/,
  /(^|\.)tiktokcdn\.com$/,
  /(^|\.)tiktok\.com$/,
  /(^|\.)tikwm\.com$/,
  /(^|\.)ytimg\.com$/,
  /(^|\.)cdninstagram\.com$/,
  /(^|\.)fbcdn\.net$/,
  /(^|\.)instagram\.com$/,
];

function allowed(u) {
  try {
    const host = new URL(u).hostname.toLowerCase();
    return ALLOWED_HOSTS.some((re) => re.test(host));
  } catch {
    return false;
  }
}

/** Proxy gambar (avatar/cover) biar nggak kena blokir hotlink dari browser. */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get('u');
  if (!u || !allowed(u)) {
    return new Response('Not allowed', { status: 400 });
  }
  try {
    const res = await fetchWithTimeout(u, { headers: { Accept: 'image/*' } }, 10000);
    if (!res.ok) return new Response('Upstream error', { status: 502 });
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('Fetch failed', { status: 502 });
  }
}
