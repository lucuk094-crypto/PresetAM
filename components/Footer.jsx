import { Bolt } from './Icons';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo">
              <span className="logo-badge">
                <Bolt size={16} />
              </span>
              PRE<span className="logo-hl">HUNT</span>
            </span>
            <p className="footer-tag">Berburu preset Alight Motion lewat satu URL.</p>
          </div>
          <div className="footer-col">
            <b className="mono">NAVIGASI</b>
            <a href="#hunt">Hunt preset</a>
            <a href="#cara-pakai">Cara pakai</a>
            <a href="#fitur">Fitur</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <b className="mono">SUPPORTED</b>
            <span>TikTok</span>
            <span>YouTube</span>
            <span>Instagram</span>
            <span>Alight Motion</span>
          </div>
        </div>
        <div className="footer-legal">
          <p>
            © {new Date().getFullYear()} PREHUNT — bukan produk resmi TikTok, YouTube, Instagram, atau Alight
            Motion. Semua video & preset milik pemiliknya masing-masing.
          </p>
          <p className="mono footer-made">dibangun dengan brutalisme halus ✦ deploy di mana aja (vercel-ready)</p>
        </div>
      </div>
    </footer>
  );
}
