import type { Metadata } from 'next';
import './globals.css';
import { SiteNav } from "@/components/navigation/site-nav";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { ToastViewport } from "@/components/ui/toast";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: 'Artpulse', template: '%s | Artpulse' },
  description: 'Discover art exhibitions, openings, talks, workshops, and fairs.',
  openGraph: { title: 'Artpulse', description: 'Discover art events near you.', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Artpulse', description: 'Discover art events near you.' },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900">
        <SiteNav />
        <div className="pb-20 md:pb-0">{children}</div>
        <ToastViewport />
        <MobileBottomNav isAuthenticated={Boolean(user)} />
      </body>
    </html>
  );
}
