import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

// Load local PP Mori fonts (Regular for body, SemiBold for headings)
import localFont from 'next/font/local';

const ppMoriRegular = localFont({
  src: '../../icon and font/PPMori-Regular.woff2',
  variable: '--font-pp-mori-regular',
  display: 'swap',
});

const ppMoriSemiBold = localFont({
  src: '../../icon and font/PPMori-SemiBold.woff2',
  variable: '--font-pp-mori-semibold',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ChestFi',
  description: 'Tools for token creation, locking, vesting, and more on Robinhood Chain. Built for developers, teams, and projects that need reliable blockchain infrastructure.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${ppMoriRegular.variable} ${ppMoriSemiBold.variable}`}>
        <Providers>
          <div className="min-h-screen">
            <Header />
            <div className="flex relative">
              <Sidebar />
              <main className="flex-1 lg:ml-64 min-h-screen">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}













