import '../src/index.css';

export const metadata = {
  title: 'Bot AI',
  description: 'AI Assistant powered by advanced AI models',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 