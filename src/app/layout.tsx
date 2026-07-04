import type { Metadata, Viewport } from 'next';
import { Big_Shoulders_Display, Inter } from 'next/font/google';
import './globals.css';

const display = Big_Shoulders_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'AgendaBarba — Agendamento online para barbearias',
    template: '%s | AgendaBarba',
  },
  description:
    'Agendamento online com sinal pago na hora. Elimine furos de agenda na sua barbearia.',
};

export const viewport: Viewport = {
  themeColor: '#1B1B1D',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${body.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
