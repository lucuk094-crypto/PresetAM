import { fetchText, UA_GOOGLEBOT, unescapeHtml } from './http';

function parseCompact(s) {
  const m = String(s || '').replace(/,/g, '').match(/^([\d.]+)\s*([KMB]?)/i);
  if (!m) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1;
  const n = parseFloat(m[1]) * mult;
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function huntInstagram(code) {
  const html = await fetchText(
    `https://www.instagram.com/p/${code}/`,
    { headers: { 'User-Agent': UA_GOOGLEBOT, 'Accept-Language': 'en-US,en;q=0.9' } },
    16000
  );

  const meta = (prop) => unescapeHtml((html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`)) || [])[1] || '');
  const desc = meta('og:description');
  if (!desc) {
    throw new Error('Post Instagram-nya nggak bisa diakses. Mungkin private, dihapus, atau dibatasi Instagram.');
  }
  const title = meta('og:title');
  const image = meta('og:image');

  // Format: `60M likes, 4M comments - username on January 4, 2019: "caption"`
  // (caption bisa kepotong sama Instagram — jadi kutip penutup dibuat opsional)
  let likes = null;
  let commentsCount = null;
  let username = '';
  let caption = '';
  const m = desc.match(
    /^([\d.,]+[KMB]?)\s*likes?,\s*([\d.,]+[KMB]?)\s*comments?\s*-\s*([A-Za-z0-9._]+)\s+on\s+[^:]*:\s*"?(([\s\S]*?)"?)\s*$/
  );
  if (m) {
    likes = parseCompact(m[1]);
    commentsCount = parseCompact(m[2]);
    username = m[3];
    caption = (m[4] || '').replace(/…"?\s*$/, '…').trim();
  } else {
    caption = desc.replace(/^[\d.,]+[KMB]?\s*likes?,\s*[\d.,]+[KMB]?\s*comments?\s*-\s*/, '');
  }
  if (caption) caption = caption.replace(/^"|"$/g, '');

  const video = {
    id: code,
    url: `https://www.instagram.com/p/${code}/`,
    title: caption || title || 'Post Instagram',
    cover: image,
    author: { username, nickname: username || 'Akun Instagram', avatar: '' },
    stats: { views: null, likes, comments: commentsCount },
  };

  const sources = caption ? [{ kind: 'deskripsi', user: '@' + username, text: caption }] : [];

  return {
    video,
    sources,
    scanned: {
      comments: 0,
      replies: 0,
      notes: ['Instagram cuma bisa dicek di bagian caption — komentar IG ditutup untuk akses pihak ketiga.'],
    },
  };
}
