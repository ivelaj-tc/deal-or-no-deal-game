import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deal or No Deal',
  description: 'Play Deal or No Deal in the browser.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
