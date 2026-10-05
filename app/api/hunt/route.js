import { normalizeUrl, detectPlatform, extractYouTubeId, extractInstagramCode } from '@/lib/detect';
import { huntTikTok } from '@/lib/tiktok';
import { huntYouTube } from '@/lib/youtube';
import { huntInstagram } from '@/lib/instagram';
import { scanTexts } from '@/lib/scan';
import { enrichPresets } from '@/lib/enrich';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Cache kecil di memori (serverless instance), TTL 5 menit
const CACHE = new Map();
const TTL = 5 * 60 * 1000;

async function doHunt(rawUrl) {
  const urlObj = normalizeUrl(rawUrl);
  const platform = detectPlatform(urlObj);
  if (!platform) {
    throw new Error('Link-nya nggak dikenali. Pakai link video TikTok, YouTube, atau Instagram ya.');
  }

  let data;
  if (platform === 'tiktok') {
    data = await huntTikTok(urlObj);
  } else if (platform === 'youtube') {
    const id = extractYouTubeId(urlObj);
    if (!id) throw new Error('ID video-nya nggak ketemu di link YouTube kamu.');
    data = await huntYouTube(id);
  } else {
    const code = extractInstagramCode(urlObj);
    if (!code) throw new Error('Kode post Instagram-nya nggak ketemu. Pakai link format instagram.com/p/… atau /reel/…');
    data = await huntInstagram(code);
  }

  const presets = scanTexts(data.sources);
  await enrichPresets(presets);

  return {
    ok: true,
    platform,
    video: data.video,
    presets,
    scanned: data.scanned || {},
  };
}

async function handle(rawUrl, fresh) {
  if (!rawUrl) {
    return Response.json({ ok: false, error: 'Parameter ?url= kosong.' }, { status: 400 });
  }

  const cacheKey = String(rawUrl).trim().toLowerCase();
  const now = Date.now();
  if (!fresh) {
    const hit = CACHE.get(cacheKey);
    if (hit && now - hit.ts < TTL) return Response.json(hit.data);
  }

  const started = Date.now();
  try {
    const data = await doHunt(rawUrl);
    const payload = { ...data, took: ((Date.now() - started) / 1000).toFixed(1) };
    CACHE.set(cacheKey, { data: payload, ts: now });
    if (CACHE.size > 200) {
      const oldest = CACHE.keys().next().value;
      CACHE.delete(oldest);
    }
    return Response.json(payload);
  } catch (e) {
    return Response.json(
      { ok: false, error: String((e && e.message) || 'Ada yang error. Coba lagi ya.') },
      { status: 200 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  return handle(searchParams.get('url') || searchParams.get('id'), searchParams.get('fresh') === '1');
}

export async function POST(req) {
  try {
    const body = await req.json();
    return handle(body && body.url, body && body.fresh);
  } catch {
    return Response.json({ ok: false, error: 'Body request-nya bukan JSON valid.' }, { status: 400 });
  }
}
