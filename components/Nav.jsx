'use client';

import { useEffect, useState } from 'react';
import { Bolt } from './Icons';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <a className="logo" href="#top" aria-label="PREHUNT — kembali ke atas">
          <span className="logo-badge">
            <Bolt size={16} />
          </span>
          <span className="logo-word">
            PRE<span className="logo-hl">HUNT</span>
          </span>
        </a>
        <nav className="nav-links" aria-label="Navigasi utama">
          <a href="#cara-pakai">Cara Pakai</a>
          <a href="#fitur">Fitur</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="btn btn-ink btn-sm nav-cta" href="#hunt">
          <Bolt size={12} /> MULAI HUNT
        </a>
      </div>
    </header>
  );
}
