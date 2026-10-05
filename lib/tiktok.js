import { fetchWithTimeout, fetchText, sleep, UA_GOOGLEBOT, unescapeHtml } from './http';

// ---- Gerbang rate-limit tikwm (API gratis: 1 request/detik) ----
let lastTikwmCall = 0;

async function tikwm(pathAndQuery, { retries = 4, timeoutMs = 15000 } = {}) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    const wait = Math.max(0, 1080 - (Date.now() - lastTikwmCall));
    if (wait > 0) await sleep(wait);
    lastTikwmCall = Date.now();
    try {
      const res = await fetchWithTimeout(
        `https://www.tikwm.com/api/${pathAndQuery}`,
        { headers: { Accept: 'application/json' } },
        timeoutMs
      );
      const json = await res.json().catch(() => null);
      if (!json) throw new Error('Respon tikwm rusak');
      if (json.code === 0 && json.data) return json.data;
      const msg = String(json.msg || '');
      if (/limit/i.test(msg)) {
        await sleep(1400);
        continue; // kena rate-limit, tunggu & ulang
      }
      if (/url parsing|invalid/i.test(msg)) {
        throw new Error('Link TikTok-nya nggak valid atau videonya udah nggak ada. Cek lagi link-nya ya.');
      }
      if (/not found|removed|private|banned|deleted/i.test(msg)) {
        throw new Error('Video-nya nggak ketemu. Mungkin dihapus, private, atau daerahnya diblokir.');
      }
      throw new Error('Video-nya nggak bisa diambil dari TikTok. Coba lagi sebentar ya.');
    } catch (e) {
      lastErr = e;
      if (String(e.message || '').includes('nggak ketemu') || String(e.message || '').includes('nggak valid')) throw e;
      await sleep(900);
    }
  }
  throw lastErr || new Error('Gagal ngambil data dari TikTok. Coba lagi sebentar ya.');
}

const normText = (t) => String(t || '').replace(/\s+/g, ' ').trim();

/**
 * Bedah halaman SEO TikTok (versi Googlebot): komentar utama + BALASAN
 * ikut dirender server-side di sini — sumber utama link preset dari owner.
 */
export function parseSeoComments(html) {
  const out = { comments: [], replies: [] };
  const re =
    /data-e2e="comment-username-(\d)"[^>]*>([^<]+)<|<p data-e2e="comment-level-(\d)"[^>]*>\s*<span dir="">([\s\S]*?)<\/span><\/p>/g;
  const pendingUser = { 1: '', 2: '' };
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) {
      pendingUser[+m[1]] = unescapeHtml(m[2]).replace(/@/g, '').trim();
    } else if (m[3] !== undefined) {
      const level = +m[3];
      const text = unescapeHtml(m[4]).trim();
      if (!text) continue;
      const user = pendingUser[level] || '';
      const entry = {
        kind: level === 2 ? 'balasan' : 'komentar',
        user: user ? '@' + user : '',
        text,
      };
      (level === 2 ? out.replies : out.comments).push(entry);
    }
  }
  return out;
}

async function fetchSeoOnce(url, lang = 'en-US,en;q=0.9', timeoutMs = 10000) {
  try {
    const html = await fetchText(
      url,
      { headers: { 'User-Agent': UA_GOOGLEBOT, 'Accept-Language': lang } },
      timeoutMs
    );
    return { parsed: parseSeoComments(html), error: null };
  } catch (e) {
    return { parsed: { comments: [], replies: [] }, error: String(e.message || 'fetch gagal') };
  }
}

async function fetchTikwmComments(url) {
  const out = [];
  let replyTotal = 0;
  try {
    let cursor = 0;
    let hasMore = true;
    let pages = 0;
    while (hasMore && pages < 4) {
      const cd = await tikwm(`comment/list?url=${encodeURIComponent(url)}&count=50&cursor=${cursor}`);
      const list = (cd && cd.comments) || [];
      for (const c of list) {
        out.push({
          kind: 'komentar',
          user: '@' + ((c.user && c.user.unique_id) || ''),
          text: c.text || '',
        });
        replyTotal += Number(c.reply_total) || 0;
      }
      hasMore = Boolean(cd && cd.hasMore) && list.length > 0;
      cursor = cd && typeof cd.cursor === 'number' ? cd.cursor : cursor + list.length;
      pages++;
    }
  } catch {
    /* komentar tikwm gagal → masih ada hasil SEO */
  }
  return { comments: out, replyTotal };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isShort(urlObj) {
  const host = urlObj.hostname.toLowerCase();
  return /^v[mt]\.tiktok\.com$/.test(host) || /^\/t\//.test(urlObj.pathname);
}

export async function huntTikTok(urlObj) {
  let url = urlObj.href;

  // short link (vm/vt.tiktok.com) → resolve dulu biar dapat URL penuh
  if (isShort(urlObj)) {
    try {
      const res = await fetchWithTimeout(url, { headers: { 'User-Agent': UA_GOOGLEBOT } }, 12000);
      if (res.url && /\/video\/\d+/.test(res.url)) url = res.url;
    } catch {
      /* biarkan tikwm yang resolve */
    }
  }

  // meta video via tikwm (SEO attempt-1 jalan paralel)
  const seoFirst = fetchSeoOnce(url);
  const meta = await tikwm(`?url=${encodeURIComponent(url)}&hd=1`);

  if (!meta || (!meta.id && !meta.title)) {
    throw new Error('Video-nya nggak ketemu. Mungkin dihapus, private, atau daerahnya diblokir.');
  }

  const author = meta.author || {};
  const username = author.unique_id || '';
  const video = {
    id: String(meta.id || ''),
    url: username && meta.id ? `https://www.tiktok.com/@${username}/video/${meta.id}` : url,
    title: meta.title || '',
    cover: meta.cover || meta.origin_cover || '',
    author: {
      username,
      nickname: author.nickname || username,
      avatar: author.avatar || '',
    },
    stats: {
      views: num(meta.play_count),
      likes: num(meta.digg_count),
      comments: num(meta.comment_count),
    },
  };

  // komentar utama (tikwm) & komentar+balasan SEO (multi-attempt) — paralel
  const [tikwmResult, seoResult] = await Promise.all([
    fetchTikwmComments(url),
    (async () => {
      const first = await seoFirst;
      const hasData = (p) => p.comments.length > 0 || p.replies.length > 0;
      if (hasData(first.parsed) || !num(meta.comment_count)) return { ...first, ok: true };
      if (video.url && video.url !== url) {
        const second = await fetchSeoOnce(video.url, 'id-ID,id;q=0.9', 8000);
        if (hasData(second.parsed)) return { ...second, ok: true };
      }
      if (video.url) {
        const third = await fetchSeoOnce(`${video.url}?_r=1&lang=id`, 'id-ID,id;q=0.9', 8000);
        if (hasData(third.parsed)) return { ...third, ok: true };
      }
      return { parsed: { comments: [], replies: [] }, ok: false };
    })(),
  ]);

  const sources = [];
  if (video.title) sources.push({ kind: 'deskripsi', user: '@' + username, text: video.title });
  if (author.signature) sources.push({ kind: 'bio', user: '@' + username, text: author.signature });

  // gabung tikwm + komentar SEO (dedupe), lalu balasan SEO
  const seen = new Set(tikwmResult.comments.map((c) => normText(c.text)));
  const comments = [...tikwmResult.comments];
  for (const c of seoResult.parsed.comments) {
    if (!seen.has(normText(c.text))) {
      comments.push(c);
      seen.add(normText(c.text));
    }
  }
  const replies = seoResult.parsed.replies;

  for (const c of comments) sources.push(c);
  for (const r of replies) sources.push(r);

  // catatan kondisi akses buat ditampilkan jujur di UI
  const notes = [];
  const replyTotal = tikwmResult.replyTotal;
  const repliesUnread = replies.length === 0 && replyTotal > 0;
  if (!seoResult.ok && num(meta.comment_count) > 0) {
    notes.push(
      `Akses server ke halaman komentar TikTok lagi dibatasi — ${replyTotal || 'beberapa'} balasan belum bisa dibaca. Coba beberapa saat lagi.`
    );
  }

  return {
    video,
    sources,
    scanned: {
      comments: comments.length,
      replies: replies.length,
      replyTotal,
      repliesUnread,
      notes,
    },
  };
}
