import { Sparkle } from './Icons';

const ITEMS = [
  'BERBURU PRESET ALIGHT MOTION',
  'TEMPeL URL — LINK LANGSUNG KELUAR',
  'DESKRIPSI + BIO + KOMENTAR + BALASAN',
  'PRESET 5MB & XML',
  'TIKTOK',
  'YOUTUBE',
  'INSTAGRAM',
  'GRATIS',
  'TANPA LOGIN',
  'TANPA IKLAN',
];

function Half() {
  return (
    <div className="ticker-half">
      {ITEMS.map((t, i) => (
        <span className="ticker-item" key={i}>
          {t}
          <Sparkle size={11} className="tick-star" />
        </span>
      ))}
    </div>
  );
}

export default function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <Half />
        <Half />
      </div>
    </div>
  );
}
