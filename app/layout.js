import './globals.css';

export const metadata = {
  title: 'PREHUNT — Berburu Preset Alight Motion Lewat URL',
  description:
    'Tempel link TikTok, YouTube, atau Instagram. Deskripsi, bio, komentar, sampai balasan di-scan otomatis buat nyari link preset Alight Motion 5MB & XML. Gratis, tanpa login, tanpa iklan.',
  openGraph: {
    title: 'PREHUNT — Berburu Preset Alight Motion Lewat URL',
    description:
      'Tempel link video, dapat link preset 5MB & XML-nya. Deskripsi, bio, komentar & balasan dibedah otomatis.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#141412',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
