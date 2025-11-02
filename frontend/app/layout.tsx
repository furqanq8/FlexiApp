import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'FlexiApp Dashboard',
  description: 'Rental fleet management portal'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-800">FlexiApp</h1>
            <span className="text-sm text-slate-500">Full-stack fleet &amp; rental operations</span>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
