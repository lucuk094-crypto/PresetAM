import { fetchWithTimeout, fetchText, fetchJson, UA_BROWSER } from './http';

/** Ekstrak JSON seimbang {..} setelah marker — tahan string yang berisi kurung. */
function extractBalancedJson(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const s = html.indexOf('{', i + marker.length);
  if (s < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = s; j < html.length; j++) {
    const ch = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(s, j + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Jalan-jalan ke seluruh struktur JSON, kumpulkan hasil predikat. */
function deepCollect(o, pred, out = []) {
  if (Array.isArray(o)) {
    for (const v of o) deepCollect(v, pred, out);
  } else if (o && typeof o === 'object') {
    if (pred(o)) out.push(o);
    for (const v of Object.values(o)) deepCollect(v, pred, out);
  }
  return out;
}

async function innertubeNext(key, clientVersion, continuation) {
  const res = await fetchWithTimeout(
    `https://www.youtube.com/youtubei/v1/next?key=${key}&prettyPrint=false`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA_BROWSER },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } },
        continuation,
      }),
    },
    15000
  );
  if (!res.ok) throw new Error(`innertube ${res.status}`);
  return res.json();
}

function collectComments(json, seen) {
  const found = [];
  const holders = deepCollect(json, (o) => !!o.commentEntityPayload);
  for (const h of holders) {
    const p = h.commentEntityPayload;
    const id = p.properties && p.properties.commentId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    found.push({
      kind: (p.properties && p.properties.replyLevel) > 0 ? 'balasan' : 'komentar',
      user: (p.author && p.author.displayName) || '',
      text: (p.properties && p.properties.content && p.properties.content.content) || '',
    });
  }
  return found;
}

function collectTokens(json) {
  const tokens = [];
  for (const o of deepCollect(json, (x) => !!x.continuationCommand)) {
    const t = o.continuationCommand.token;
    if (t && !tokens.includes(t)) tokens.push(t);
  }
  return tokens;
}

function findCommentSectionToken(ytd) {
  let token = null;
  deepCollect(ytd, (o) => {
    if (token) return false;
    if (o.sectionIdentifier === 'comment-item-section') {
      const cir = (o.contents || [])[0] || {};
      token =
        cir.continuationItemRenderer &&
        cir.continuationItemRenderer.continuationEndpoint &&
        cir.continuationItemRenderer.continuationEndpoint.continuationCommand &&
        cir.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
      return true;
    }
    return false;
  });
  return token;
}

export async function huntYouTube(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;

  const [oembed, html] = await Promise.all([
    fetchJson(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      {},
      10000
    ).catch(() => null),
    fetchText(
      watchUrl,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+417; SOCS=CAI',
        },
      },
      16000
    ),
  ]);

  const player = extractBalancedJson(html, 'ytInitialPlayerResponse') || {};
  const ytd = extractBalancedJson(html, 'ytInitialData') || {};
  const vd = player.videoDetails || {};

  if (!vd.videoId && !(oembed && oembed.title)) {
    throw new Error('Video YouTube-nya nggak ketemu. Mungkin dihapus atau private.');
  }

  const stats = { views: vd.viewCount ? Number(vd.viewCount) : null, likes: null, comments: null };
  const ccMatch = html.match(/"commentCount":\{"simpleText":"([^"]+)"/);
  if (ccMatch) stats.comments = parseCompact(ccMatch[1]);
  const likeMatch = html.match(/"likeCountIfLikedNumber":"(\d+)"|"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"([\d.,]+)[^"]*"/);
  if (likeMatch) stats.likes = likeMatch[2] ? parseCompact(likeMatch[2]) : Number(likeMatch[1]);

  const video = {
    id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: (oembed && oembed.title) || vd.title || '',
    cover:
      (oembed && oembed.thumbnail_url) ||
      (vd.thumbnail && vd.thumbnail.thumbnails && vd.thumbnail.thumbnails.length
        ? vd.thumbnail.thumbnails[vd.thumbnail.thumbnails.length - 1].url
        : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
    author: {
      username: (vd.author || (oembed && oembed.author_name) || 'channel').replace(/\s+/g, ''),
      nickname: (oembed && oembed.author_name) || vd.author || '',
      avatar: '',
    },
    stats,
  };

  const sources = [];
  if (vd.shortDescription) sources.push({ kind: 'deskripsi', user: video.author.username, text: vd.shortDescription });

  // ---- Komentar + balasan via inner tube API ----
  const comments = [];
  const notes = [];
  const key = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || [])[1];
  const clientVersion = (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) || [])[1] || '2.20240610.00.00';
  const firstToken = ytd ? findCommentSectionToken(ytd) : null;

  if (!key || !firstToken) {
    notes.push('Komentar nggak bisa dibaca (kemungkinan dimatikan).');
  } else {
    const seen = new Set();
    const visited = new Set();
    const queue = [firstToken];
    let budget = 7; // total permintaan lanjutan (halaman + balasan)
    try {
      while (queue.length && budget > 0) {
        const tok = queue.shift();
        if (visited.has(tok)) continue;
        visited.add(tok);
        budget--;
        const json = await innertubeNext(key, clientVersion, tok);
        comments.push(...collectComments(json, seen));
        if (budget > 0) {
          for (const t of collectTokens(json)) {
            if (!visited.has(t) && !queue.includes(t) && queue.length < 4) queue.push(t);
          }
        }
      }
    } catch {
      if (!comments.length) notes.push('Sebagian komentar nggak kebaca. Hasil mungkin belum lengkap.');
    }
  }

  for (const c of comments) sources.push(c);
  const top = comments.filter((c) => c.kind === 'komentar').length;
  const reps = comments.filter((c) => c.kind === 'balasan').length;

  return { video, sources, scanned: { comments: top, replies: reps, notes } };
}

function parseCompact(s) {
  const m = String(s || '').replace(/,/g, '').match(/^([\d.]+)\s*([KMB]?)/i);
  if (!m) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1;
  const n = parseFloat(m[1]) * mult;
  return Number.isFinite(n) ? Math.round(n) : null;
}
