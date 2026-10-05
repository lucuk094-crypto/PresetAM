'use client';

import { useState } from 'react';
import Reveal from './Reveal';
import SectionHead from './SectionHead';
import { Plus } from './Icons';

const FAQS = [
  {
    q: 'Gratis banget? Emang nggak ada catch-nya?',
    a: 'Beneran gratis — tanpa login, tanpa iklan, tanpa batas jumlah hunt. Situs ini cuma alat bantu biar kamu nggak perlu scroll komentar satu-satu nyari link preset.',
  },
  {
    q: 'Data aku aman nggak?',
    a: 'Aman. Kamu nggak perlu login apa pun, dan link yang kamu tempel cuma diproses sekali buat nyari preset. Nggak ada tracking, nggak ada data yang disimpan permanen.',
  },
  {
    q: 'Kenapa kadang balasan/komentar nggak kebaca semua?',
    a: 'TikTok cuma menyajikan sebagian komentar & balasan buat dibaca pihak ketiga. Komentar teratas dan balasan owner (tempat preset biasanya dibagikan) prioritas kami baca. Kalau hasilnya kosong, cek langsung komentar videonya.',
  },
  {
    q: 'Format link apa saja yang didukung?',
    a: 'TikTok (tiktok.com/@user/video/…, vt.tiktok.com/…), YouTube (watch?v=…, youtu.be/…, shorts/…), dan Instagram (instagram.com/p/… atau /reel/…). Tempel apa adanya, platform dideteksi otomatis.',
  },
  {
    q: 'Cara pakai file presetnya gimana?',
    a: 'Preset 5MB (link alightcreative.com) tinggal dibuka di HP tempat Alight Motion terinstall — langsung masuk aplikasi. File XML harus di-download dulu dari Google Drive, lalu di Alight Motion: Preset → ikon import → pilih file XML-nya.',
  },
  {
    q: 'Kenapa Instagram cuma baca caption?',
    a: 'Instagram menutup akses komentarnya untuk pihak ketiga. Buat sementara, IG di-scan di bagian caption/captions-nya saja.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="faq" id="faq">
      <div className="container">
        <SectionHead index="03 / FAQ" title="MASIH ADA YANG NANYA?" sub="Pertanyaan yang sering muncul — jawabannya singkat, padat, beres." />
        <div className="faq-list">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 60}>
                <div className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-q"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span className="faq-n mono">{String(i + 1).padStart(2, '0')}</span>
                    <span className="faq-qt">{f.q}</span>
                    <span className={`faq-plus ${isOpen ? 'rot' : ''}`} aria-hidden="true">
                      <Plus size={15} />
                    </span>
                  </button>
                  <div className="faq-a">
                    <div className="faq-a-inner">
                      <p>{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
