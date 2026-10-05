'use client';

import { useMemo, useState } from 'react';
import { Bolt, Search, PlatformIcon } from './Icons';

export const EXAMPLE_URL =
  'https://www.tiktok.com/@prstvall/video/7691670073114725640?is_from_webapp=1&sender_device=pc';

function detectLive(v) {
  if (!v || v.length < 8) return null;
  const raw = /^https?:\/\//i.test(v) ? v : 'https://' + v.replace(/^\/+/, '');
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
    if (/(^|\.)youtube\.com$/.test(host) || host === 'youtu.be') return 'youtube';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    return null;
  } catch {
    return null;
  }
}

export default function HuntForm({ onHunt, loading }) {
  const [val, setVal] = useState('');
  const platform = useMemo(() => detectLive(val), [val]);

  function submit(e) {
    e.preventDefault();
    const v = val.trim();
    if (!v || loading) return;
    onHunt(v);
  }

  return (
    <form className="hunt-card" onSubmit={submit}>
      <div className="hunt-top">
        <label htmlFor="hunt-url" className="hunt-label">
          <Search size={13} /> URL VIDEO
        </label>
        <span className="hunt-hint mono">TIKTOK ✦ YOUTUBE ✦ INSTAGRAM</span>
      </div>

      <div className="hunt-row">
        <input
          id="hunt-url"
          className={`hunt-input mono ${val.length > 8 && !platform ? 'invalid' : ''}`}
          placeholder="tempel di sini → tiktok.com/@user/video/…"
          spellCheck="false"
          autoComplete="off"
          autoCapitalize="off"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn btn-lime btn-hunt" disabled={loading || !val.trim()}>
          {loading ? (
            <>
              <span className="mini-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              SABAR…
            </>
          ) : (
            <>
              <Bolt size={15} /> HUNT!
            </>
          )}
        </button>
      </div>

      <div className="hunt-meta">
        {platform ? (
          <span className={`chip platform p-${platform}`}>
            <PlatformIcon platform={platform} size={12} /> {platform.toUpperCase()} KEDETEKSI
          </span>
        ) : (
          <span className="chip ghost">DETEKSI PLATFORM OTOMATIS</span>
        )}
        <button
          type="button"
          className="example-btn mono"
          disabled={loading}
          onClick={() => setVal(EXAMPLE_URL)}
        >
          → isi contoh link tiktok
        </button>
      </div>
    </form>
  );
}
