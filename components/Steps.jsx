import Reveal from './Reveal';
import SectionHead from './SectionHead';
import { CopyIcon, Bolt, External } from './Icons';

const STEPS = [
  {
    n: '1',
    title: 'SALIN LINK',
    desc: 'Buka video TikTok, YouTube, atau Instagram yang preset-nya pengen kamu ambil. Salin link videonya dari tombol share.',
    icon: <CopyIcon size={26} />,
    tilt: '-1.2deg',
  },
  {
    n: '2',
    title: 'TEMPEL & HUNT',
    desc: 'Tempel link ke kolom di atas, tekan HUNT! Deskripsi, bio, komentar, sampai balasan di-scan otomatis.',
    icon: <Bolt size={28} />,
    tilt: '0.8deg',
  },
  {
    n: '3',
    title: 'AMBIL PRESET',
    desc: 'Link preset 5MB & XML langsung nongol. Tinggal dibuka di Alight Motion atau di-copy buat nanti.',
    icon: <External size={26} />,
    tilt: '-0.8deg',
  },
];

export default function Steps() {
  return (
    <section className="steps" id="cara-pakai">
      <div className="container">
        <SectionHead index="01 / CARA PAKAI" title="TINGGAL SALIN — TEMPEL — BERES." sub="Nggak perlu login. Nggak perlu install apa-apa." />
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <article className="step-card" style={{ '--tilt': s.tilt }}>
                <span className="step-num" aria-hidden="true">
                  {s.n}
                </span>
                <span className="step-icon">{s.icon}</span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
