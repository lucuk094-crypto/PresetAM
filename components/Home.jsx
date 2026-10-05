'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Ticker from './Ticker';
import Nav from './Nav';
import HuntForm from './HuntForm';
import ResultPanel from './ResultPanel';
import Steps from './Steps';
import Features from './Features';
import Faq from './Faq';
import Footer from './Footer';
import { Bolt, Sparkle, ArrowDown } from './Icons';

export const LOADING_STEPS = [
  'Nyiapin alat bedah preset…',
  'Ngebaca deskripsi & bio akun…',
  'Nyelonong ke komentar…',
  'Ngecek balasan satu-satu…',
  'Nyaring link 5MB & XML…',
  'Ngerapihin hasilnya…',
];

export default function Home() {
  const [phase, setPhase] = useState('idle'); // idle | loading | done | error
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const resultRef = useRef(null);
  const lastUrl = useRef('');
  const didAuto = useRef(false);

  const hunt = useCallback(async (url, fresh = false) => {
    lastUrl.current = url;
    setPhase('loading');
    setStatusIdx(0);
    setError('');
    try {
      const r = await fetch(`/api/hunt?url=${encodeURIComponent(url)}${fresh ? '&fresh=1' : ''}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Ada yang error.');
      setData(j);
      setPhase('done');
      try {
        const u = new URL(window.location.href);
        u.search = '?url=' + encodeURIComponent(url);
        window.history.replaceState(null, '', u.toString());
      } catch {}
    } catch (e) {
      setError(String(e.message || 'Koneksi ke server gagal. Coba lagi ya.'));
      setPhase('error');
    }
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  }, []);

  // auto-hunt kalau ada ?url= / ?id= di address bar (hasil bisa di-share)
  useEffect(() => {
    if (didAuto.current) return;
    didAuto.current = true;
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('url') || sp.get('id');
      if (q) hunt(q);
    } catch {}
  }, [hunt]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setStatusIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1)), 1250);
    return () => clearInterval(t);
  }, [phase]);

  return (
    <>
      <Ticker />
      <Nav />
      <main id="top">
        <section className="hero" id="hunt">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="hero-badge">
                <Bolt size={12} /> V1.0 — GRATIS · TANPA LOGIN · TANPA IKLAN
              </p>
              <h1 className="hero-title">
                NYARI PRESET <span className="hlt hlt-pink">ALIGHT&nbsp;MOTION</span> CUMA LEWAT{' '}
                <span className="stroke">SATU URL</span>
              </h1>
              <p className="hero-sub">
                Tempel link video TikTok, YouTube, atau Instagram — deskripsi, bio, komentar, sampai{' '}
                <b>balasan</b> dibedah satu-satu buat nyari link preset <b className="t-lime">5MB</b> &amp;{' '}
                <b className="t-pink">XML</b>. Beres dalam hitungan detik.
              </p>
            </div>

            <div className="hero-art" aria-hidden="true">
              <svg className="starburst" viewBox="0 0 200 200">
                <path
                  d="M100 4 118 52 160 24 150 74 200 78 162 112 200 146 150 150 160 200 118 172 100 220 82 172 40 200 50 150 0 146 38 112 0 78 50 74 40 24 82 52Z"
                  fill="var(--lime)"
                  stroke="var(--ink)"
                  strokeWidth="5"
                />
                <text x="100" y="94" textAnchor="middle" className="sb-text">5MB</text>
                <text x="100" y="122" textAnchor="middle" className="sb-text">+XML</text>
              </svg>
              <span className="float-chip fc-1">auto&nbsp;scan</span>
              <span className="float-chip fc-2">komentar ✓</span>
              <span className="float-chip fc-3">balasan ✓</span>
              <svg className="hero-arrow" viewBox="0 0 100 90">
                <path d="M8 6 C 40 10, 70 30, 72 66" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
                <path d="M58 58 L73 72 L80 52" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="container hero-form">
            <HuntForm onHunt={hunt} loading={phase === 'loading'} />
          </div>

          <div className="container">
            <div ref={resultRef} className="result-slot">
              <ResultPanel
                phase={phase}
                data={data}
                error={error}
                statusIdx={statusIdx}
                onRetry={() => hunt(lastUrl.current, true)}
              />
            </div>
          </div>

          <div className="hero-scroll mono" aria-hidden="true">
            <ArrowDown size={14} /> scroll
          </div>
        </section>

        <div className="marquee-lime" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((n) => (
              <div className="marquee-half" key={n}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i}>
                    PREHUNT <Sparkle size={12} /> CARI PRESET <Sparkle size={12} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Steps />
        <Features />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
