import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Taskly — Ship better work', description: 'A focused task board for your team.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);else if(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
