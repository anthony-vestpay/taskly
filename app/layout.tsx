import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Taskly — Ship better work', description: 'A focused task board for your team.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
