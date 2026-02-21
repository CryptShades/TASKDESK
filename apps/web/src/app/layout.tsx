import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/context/user-context';
import { RealtimeProvider } from '@/context/realtime-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Taskdesk',
  description: 'Campaign Execution Risk Detection System for service agencies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}>
        <UserProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
