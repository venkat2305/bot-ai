import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bot AI',
  description: 'AI Assistant powered by advanced AI models',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}