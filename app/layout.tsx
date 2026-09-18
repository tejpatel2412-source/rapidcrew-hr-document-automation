import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rapidcrew HR Document Automation',
  description: 'Local-first HR document automation for salary slips and employment letters.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
