import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Artpulse', template: '%s | Artpulse' },
  description: 'Discover art exhibitions, openings, talks, workshops, and fairs.',
  openGraph: { title: 'Artpulse', description: 'Discover art events near you.', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Artpulse', description: 'Discover art events near you.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
