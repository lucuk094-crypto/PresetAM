export function normalizeUrl(input) {
  let raw = String(input || '').trim();
  // buang karakter tak terlihat & kutip yang sering nyelip pas paste
  raw = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^["'<]+|["'>]+$/g, '');
  // link hasil copy dari HTML kadang masih ber-entitas (&amp;) — beresin
  raw = raw.replace(/&amp;/gi, '&');
  if (!raw) throw new Error('Link-nya kosong. Tempel link video TikTok, YouTube, atau Instagram dulu ya.');
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw.replace(/^\/+/, '');
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Format link nggak valid. Cek lagi link-nya ya.');
  }
  if (!url.hostname.includes('.')) {
    throw new Error('Format link nggak valid. Cek lagi link-nya ya.');
  }
  return url;
}

export function detectPlatform(url) {
  const host = url.hostname.toLowerCase();
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
  if (/(^|\.)youtube\.com$/.test(host) || /(^|\.)youtu\.be$/.test(host) || /(^|\.)youtube-nocookie\.com$/.test(host)) {
    return 'youtube';
  }
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
  return null;
}

export function extractTikTokId(url) {
  const m = url.pathname.match(/\/(?:video|photo)\/(\d{6,})/);
  return m ? m[1] : null;
}

export function isTikTokShortLink(url) {
  const host = url.hostname.toLowerCase();
  if (/^v[mt]\.tiktok\.com$/.test(host)) return true;
  if (/(^|\.)tiktok\.com$/.test(host) && /^\/t\//.test(url.pathname)) return true;
  return false;
}

export function extractYouTubeId(url) {
  const host = url.hostname.toLowerCase();
  if (host.endsWith('youtu.be')) {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? id.split('?')[0] : null;
  }
  const v = url.searchParams.get('v');
  if (v) return v;
  const m = url.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

export function extractInstagramCode(url) {
  const m = url.pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export function extractGenericUrl(input) {
  const m = String(input || '').match(/https?:\/\/[^\s"'<>]+/i);
  return m ? m[0] : null;
}
