import Link from 'next/link';
import './styles.css';
import Navigation from './_components/Navigation';

export const metadata = { title: 'HGS Control Center', description: 'HGS operational dashboard' };

export default function RootLayout({ children }) {
  return <html lang="ja"><body><div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="HGS Control Center"><span>H</span><div><strong>HGS</strong><small>Control Center</small></div></Link>
      <Navigation />
      <div className="sidebar-foot"><span className="live-dot" /><div><strong>Production</strong><small>自動更新</small></div></div>
    </aside>
    <div className="workspace">
      <div className="mobile-brand"><Link href="/">HGS Control Center</Link><span className="live-dot" /></div>
      <main>{children}</main>
      <footer>HGS Control Center · Notion is Source of Truth · 外部変更は承認経路を通します</footer>
    </div>
  </div></body></html>;
}
