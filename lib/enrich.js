import { fetchText, fetchWithTimeout, unescapeHtml, UA_BROWSER } from './http';

function humanSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Header HTTP dibaca sebagai latin1 — kalau aslinya UTF-8 (emoji di nama file),
// beresin dulu biar nggak jadi "vallzyâ¨"
function fixHeaderEncoding(s) {
  try {
    if (/[\u00c2-\u00f4][\u0080-\u00bf]/.test(s)) {
      return decodeURIComponent(escape(s));
    }
  } catch {}
  return s;
}

/** Ngambil nama asli preset: judul halaman share Alight Motion & nama file Google Drive. */
export async function enrichPresets(presets) {
  await Promise.allSettled(
    presets.map(async (p) => {
      if (!p) return;
      try {
        if (p.type === '5mb') {
          const html = await fetchText(p.url, {}, 8000);
          const t =
            unescapeHtml((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '') ||
            unescapeHtml((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
          const name = t
            .replace(/\s*[-–|]\s*Alight Motion.*$/i, '')
            .replace(/\s*[-–|]\s*Google Drive.*$/i, '')
            .trim();
          if (name) p.name = name;
        } else if (p.type === 'xml' && p.driveId) {
          // pakai header download: dapat nama file + ukuran persis sekaligus
          try {
            const res = await fetchWithTimeout(
              `https://drive.usercontent.google.com/download?id=${p.driveId}&export=download&confirm=t`,
              { method: 'HEAD', headers: { 'User-Agent': UA_BROWSER } },
              8000
            );
            const len = res.headers.get('content-length');
            const disp = fixHeaderEncoding(res.headers.get('content-disposition') || '');
            const nameMatch = unescapeHtml((disp.match(/filename="([^"]+)"/) || [])[1] || '');
            if (nameMatch) p.name = nameMatch.replace(/\.xml$/i, '');
            if (len) p.size = humanSize(len);
            if (nameMatch && len) return;
          } catch {}
          // fallback: parse halaman view Drive
          const html = await fetchText(`https://drive.google.com/file/d/${p.driveId}/view`, {}, 8000);
          let name =
            unescapeHtml((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '')
              .replace(/\s*-\s*Google Drive\s*$/i, '')
              .trim();
          if (!name) name = unescapeHtml((html.match(/'title':\s*'([^']+)'/) || [])[1] || '').trim();
          if (name) p.name = name.replace(/\.xml$/i, '');
        }
      } catch {
        /* biarkan nama default */
      }
    })
  );
  return presets;
}
