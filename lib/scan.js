import { unescapeHtml } from './http';

// Pola link preset Alight Motion
const PAT_5MB = /(?:https?:\/\/)?(?:www\.)?alightcreative\.com\/[^\s"'<>]+/gi;
const PAT_DRIVE = /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/[^\s"'<>]+/gi;
const PAT_XML = /https?:\/\/[^\s"'<>]+?\.xml(?:\?[^\s"'<>]*)?/gi;

const TRIM_END = /[)\].,;:'"»”›…!?}]+$/;

function normalizeMatch(raw) {
  let url = String(raw).trim().replace(TRIM_END, '');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url;
}

function driveIdFrom(url) {
  const m = url.match(
    /drive\.google\.com\/(?:file\/d\/([A-Za-z0-9_-]+)|open\?id=([A-Za-z0-9_-]+)|uc\?(?:export=download&)?id=([A-Za-z0-9_-]+))/i
  );
  return m ? m[1] || m[2] || m[3] : null;
}

function makeSnippet(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= 180) return t;
  return t.slice(0, 177).trimEnd() + '…';
}

/**
 * blobs: [{ kind: 'deskripsi'|'bio'|'komentar'|'balasan', user?: '@xxx', text }]
 * → daftar preset unik (di-dedupe berdasarkan URL)
 */
export function scanTexts(blobs) {
  const map = new Map();
  const add = (rawUrl, type, blob) => {
    let url = normalizeMatch(rawUrl);
    if (url.length > 600) return;
    let driveId = null;
    if (type === 'xml') {
      driveId = driveIdFrom(url);
      if (driveId) url = `https://drive.google.com/file/d/${driveId}/view`;
    }
    const key = url.toLowerCase();
    if (map.has(key)) return;
    map.set(key, {
      type,
      url,
      driveId,
      name: null,
      size: null,
      source: {
        kind: blob.kind || 'komentar',
        user: blob.user || '',
        snippet: makeSnippet(blob.text),
      },
    });
  };

  for (const blob of blobs) {
    const text = unescapeHtml(blob.text || '');
    if (!text) continue;
    let m;
    PAT_5MB.lastIndex = 0;
    while ((m = PAT_5MB.exec(text))) add(m[0], '5mb', blob);
    PAT_DRIVE.lastIndex = 0;
    while ((m = PAT_DRIVE.exec(text))) add(m[0], 'xml', blob);
    PAT_XML.lastIndex = 0;
    while ((m = PAT_XML.exec(text))) add(m[0], 'xml', blob);
  }

  // urutan prioritas tampil: 5MB dulu, baru XML
  const all = [...map.values()];
  all.sort((a, b) => (a.type === b.type ? 0 : a.type === '5mb' ? -1 : 1));
  return all;
}

export const SOURCE_LABEL = {
  deskripsi: 'Dari deskripsi',
  bio: 'Dari bio',
  komentar: 'Dari komentar',
  balasan: 'Dari balasan',
};
