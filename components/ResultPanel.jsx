'use client';

import { useEffect, useState } from 'react';
import { LOADING_STEPS } from './Home';
import {
  Bolt,
  Check,
  CopyIcon,
  External,
  PlatformIcon,
  Refresh,
  Share,
  XIcon,
} from './Icons';

const px = (u) => (u ? `/api/img?u=${encodeURIComponent(u)}` : null);

const fmtCompact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
const fmtFull = new Intl.NumberFormat('id-ID');

function useCountUp(target, active, dur = 900) {
  const [v, setV] = useState(() => (target == null ? null : 0));
  useEffect(() => {
    if (target == null) {
      setV(null);
      return;
    }
    if (!active) {
      setV(target);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round((target || 0) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, dur]);
  return v;
}

function Stat({ label, value }) {
  const v = useCountUp(value, true);
  return (
    <div className="stat">
      <small>{label}</small>
      <b>{v == null ? '—' : v >= 10000 ? fmtCompact.format(v) : fmtFull.format(v)}</b>
    </div>
  );
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {}
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }
  return (
    <button type="button" className={`btn btn-sm ${done ? 'btn-lime' : ''}`} onClick={copy}>
      {done ? (
        <>
          <Check size={13} /> TERSALIN!
        </>
      ) : (
        <>
          <CopyIcon size={13} /> COPY LINK
        </>
      )}
    </button>
  );
}

const KIND_LABEL = {
  deskripsi: 'Dari deskripsi',
  bio: 'Dari bio',
  komentar: 'Dari komentar',
  balasan: 'Dari balasan',
};

function PresetCard({ preset, index }) {
  const is5mb = preset.type === '5mb';
  return (
    <article className={`preset-card pc-${preset.type}`} style={{ animationDelay: `${index * 90 + 120}ms` }}>
      <div className="preset-head">
        <span className={`chip type-chip ${is5mb ? 'tc-5mb' : 'tc-xml'}`}>{is5mb ? 'PRESET 5MB' : 'FILE XML'}</span>
        {preset.size ? <span className="chip ghost mono">{preset.size}</span> : null}
      </div>
      <h3 className="preset-name">{preset.name || (is5mb ? 'Preset Alight Motion 5MB' : 'Preset XML')}</h3>
      {preset.source ? (
        <p className="preset-source mono">
          {KIND_LABEL[preset.source.kind] || 'Dari komentar'}
          {preset.source.user ? ` · ${preset.source.user}` : ''}
        </p>
      ) : null}
      {preset.source && preset.source.snippet ? (
        <p className="preset-snippet">“{preset.source.snippet}”</p>
      ) : null}
      <p className="preset-url mono" dir="ltr">
        {shortUrl(preset.url)}
      </p>
      <div className="preset-actions">
        <a className="btn btn-sm btn-lime" href={preset.url} target="_blank" rel="noopener noreferrer">
          {is5mb ? (
            <>
              <Bolt size={12} /> BUKA PRESET
            </>
          ) : (
            <>
              <External size={12} /> AMBIL FILE
            </>
          )}
        </a>
        <CopyButton text={preset.url} />
      </div>
    </article>
  );
}

function shortUrl(u) {
  try {
    const p = new URL(u);
    const path = p.pathname.length > 34 ? p.pathname.slice(0, 34) + '…' : p.pathname;
    return p.hostname + path;
  } catch {
    return u;
  }
}

function ShareButton() {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }
  return (
    <button type="button" className="btn btn-sm" onClick={share}>
      {done ? (
        <>
          <Check size={13} /> LINK HASIL TERSALIN
        </>
      ) : (
        <>
          <Share size={13} /> SHARE
        </>
      )}
    </button>
  );
}

function VideoCard({ video, platform, scanned }) {
  const [coverOk, setCoverOk] = useState(Boolean(video.cover));
  const [avatarOk, setAvatarOk] = useState(Boolean(video.avatar));
  return (
    <article className="video-card" style={{ animationDelay: '80ms' }}>
      <div className="video-cover">
        {coverOk ? (
          <img
            src={px(video.cover)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setCoverOk(false)}
          />
        ) : (
          <div className="cover-fallback">
            <PlatformIcon platform={platform} size={30} />
          </div>
        )}
      </div>
      <div className="video-body">
        <span className={`chip platform p-${platform}`}>
          <PlatformIcon platform={platform} size={12} /> {platform.toUpperCase()}
        </span>
        <p className="video-title">{video.title || 'Nggak ada deskripsi'}</p>
        <div className="video-author">
          {avatarOk && video.avatar ? (
            <img
              className="avatar"
              src={px(video.avatar)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setAvatarOk(false)}
            />
          ) : (
            <span className="avatar avatar-fallback" aria-hidden="true">
              {(video.author.nickname || '?').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="author-text">
            <b>{video.author.nickname || '—'}</b>
            {video.author.username ? <span className="mono">@{video.author.username}</span> : null}
          </div>
        </div>
        <div className="video-stats">
          <Stat label="VIEWS" value={video.stats.views} />
          <Stat label="LIKES" value={video.stats.likes} />
          <Stat label="KOMENTAR" value={video.stats.comments} />
        </div>
        <p className="scan-chips mono">
          <span className="ok">✓ deskripsi</span> <span className="ok">✓ bio</span>{' '}
          {scanned.comments > 0 ? <span className="ok">✓ {scanned.comments} komentar</span> : null}{' '}
          {scanned.replies > 0 ? <span className="ok">✓ {scanned.replies} balasan</span> : null}
        </p>
      </div>
    </article>
  );
}

export default function ResultPanel({ phase, data, error, statusIdx, onRetry }) {
  if (phase === 'idle') return null;

  if (phase === 'loading') {
    return (
      <div className="scan-card" role="status" aria-live="polite">
        <div className="scan-head">
          <span className="loader" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <b className="mono">LAGI NYARI…</b>
        </div>
        <p className="scan-step mono">
          {LOADING_STEPS[statusIdx] || LOADING_STEPS[0]}
          <span className="caret" aria-hidden="true">
            ▍
          </span>
        </p>
        <div className="scanbar" aria-hidden="true">
          <span />
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="fail-card" role="alert">
        <div className="fail-head">
          <XIcon size={16} /> <b>YAH, GAGAL 😤</b>
        </div>
        <p className="fail-msg">{error}</p>
        <div className="fail-actions">
          <button type="button" className="btn btn-sm" onClick={onRetry}>
            <Refresh size={13} /> COBA LAGI
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { video, presets, scanned, platform } = data;
  const found = presets.length > 0;

  return (
    <div className="result-wrap">
      <div className={`res-banner ${found ? '' : 'empty'}`} style={{ animationDelay: '40ms' }}>
        <span className="res-title">
          {found ? `🎉 ${presets.length} PRESET KETEMU!` : '😢 Nggak ketemu preset di video ini'}
        </span>
        <span className="res-tools">
          <span className="mono took">{data.took ? `${data.took}s` : ''}</span>
          <ShareButton />
          <button type="button" className="btn btn-sm" onClick={onRetry}>
            <Refresh size={13} /> CARI ULANG
          </button>
        </span>
      </div>

      <VideoCard video={video} platform={platform} scanned={scanned} />

      {found ? (
        <div className="preset-grid">
          {presets.map((p, i) => (
            <PresetCard key={p.url} preset={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="notfound-card" style={{ animationDelay: '160ms' }}>
          {scanned.repliesUnread ? (
            <div className="nf-strong">
              <p className="nf-strong-title">
                ⚠ {scanned.replyTotal || 'BEBERAPA'} BALASAN TERDETEKSI DI VIDEO INI
              </p>
              <p>
                Preset 5MB/XML biasanya dibagikan owner lewat <b>balasan komentar</b> — tapi TikTok sedang
                membatasi pembacaan balasan dari server kami. Percobaan kedua sering berhasil (jalur aksesnya
                beda). Kalau masih gagal, buka langsung komentarnya:
              </p>
              <div className="nf-actions">
                <button type="button" className="btn btn-sm btn-lime" onClick={onRetry}>
                  <Refresh size={13} /> COBA LAGI
                </button>
                <a className="btn btn-sm" href={video.url} target="_blank" rel="noopener noreferrer">
                  <External size={13} /> BUKA KOMENTAR TIKTOK
                </a>
              </div>
            </div>
          ) : (
            <>
              <p className="nf-title">
                <b>Berikut kemungkinan kenapa:</b>
              </p>
              <ul className="nf-list">
                <li>
                  Preset-nya dibagikan lewat <b>link bio</b> (bukan di deskripsi/komentar) — cek profil akunnya.
                </li>
                <li>Link preset ada di komentar yang <b>lewat batas</b> yang bisa dibaca otomatis.</li>
                <li>Owner ngapus komentar / preset-nya udah nggak dibagikan.</li>
              </ul>
            </>
          )}
          {(scanned.notes || []).map((n, i) => (
            <p key={i} className="nf-note mono">
              ⚠ {n}
            </p>
          ))}
          {!scanned.repliesUnread ? (
            <div className="nf-actions">
              <a className="btn btn-sm" href={video.url} target="_blank" rel="noopener noreferrer">
                <External size={13} /> BUKA VIDEO ASLI
              </a>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
