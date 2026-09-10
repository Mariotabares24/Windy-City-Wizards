import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AgentBubble } from '@/components/agent-bubble';
import { Starfield } from '@/components/starfield';

const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Space_Grotesk({
  variable: '--font-editorial',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cosmic Together — Find your kind of perfect',
  description:
    'A little guidance. Your favorite people. A whole new way to shop fashion, home, and gadgets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Starfield />
        {children}
        <AgentBubble />
      </body>
    </html>
  );
}
