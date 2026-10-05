import Reveal from './Reveal';
import SectionHead from './SectionHead';
import { Bolt, PlatformIcon, Check, Share } from './Icons';

const FEATURES = [
  {
    title: 'SERBA OTOMATIS',
    desc: 'Deskripsi, bio, komentar, sampai balasan dibedah satu-satu. Link 5MB (Alight Creative) & XML (Google Drive) diambil tanpa kamu ngapa-ngapain.',
    icon: <Bolt size={22} />,
  },
  {
    title: '3 PLATFORM',
    desc: 'TikTok, YouTube, dan Instagram — semua format link-nya dikenali: biasa, singkat (vt.tiktok.com / youtu.be), sampai shorts & reels.',
    icon: <PlatformIcon platform="tiktok" size={22} />,
  },
  {
    title: 'AMAN & PRIVAT',
    desc: 'Nggak ada login, nggak ada iklan, nggak ada tracking. Link cuma diproses buat nyari preset — habis itu beres.',
    icon: <Check size={24} />,
  },
  {
    title: 'HASIL BISA DI-SHARE',
    desc: 'Link hasil hunt bisa langsung dikirim ke teman — dibuka otomatis nampilin hasil yang sama. Ada API publiknya juga buat developer.',
    icon: <Share size={22} />,
  },
];

export default function Features() {
  return (
    <section className="features" id="fitur">
      <div className="container">
        <SectionHead invert index="02 / FITUR" title="KENCANG, PEDAS, NGGAK RIBET." sub="Semua yang kamu butuhin buat berburu preset — nggak lebih, nggak kurang." />
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="feat-reveal">
              <article className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="terminal-card">
            <div className="term-bar">
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="mono term-title">API PUBLIK — GET /api/hunt</span>
            </div>
            <pre className="term-body mono" dir="ltr">
{`GET /api/hunt?url=https://vt.tiktok.com/Zxxx/

{
  "ok": true,
  "platform": "tiktok",
  "presets": [
    { "type": "5mb", "url": "https://alightcreative.com/am/share/…" },
    { "type": "xml", "url": "https://drive.google.com/file/d/…" }
  ]
}`}
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
