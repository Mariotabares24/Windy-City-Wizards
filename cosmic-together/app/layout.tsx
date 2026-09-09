import type { Metadata } from 'next';
import { Manrope, Instrument_Serif } from 'next/font/google';
import './globals.css';

const geistSans = Manrope({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Instrument_Serif({
  variable: '--font-editorial',
  weight: '400',
  style: ['normal', 'italic'],
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
        {children}
      </body>
    </html>
  );
}
