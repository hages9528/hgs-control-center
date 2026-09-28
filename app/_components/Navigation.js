'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  ['/', 'overview', '概要'],
  ['/ads', 'campaign', 'Google広告'],
  ['/line-yahoo-ads', 'campaign', 'LINEヤフー広告'],
  ['/line', 'chat', '公式LINE'],
  ['/stripe', 'card', 'Stripe'],
  ['/profit', 'profit', '利益推移'],
  ['/metrics', 'metrics', '統合指標'],
  ['/commands', 'queue', '指令'],
  ['/integrations', 'link', '連携設定'],
];

export function Icon({ name }) {
  const paths = {
    overview: <><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" /></>,
    campaign: <><path d="M3 11v2h3l5 4V7l-5 4H3Zm12.5 1a3.5 3.5 0 0 0-2.5-3.35v6.7A3.5 3.5 0 0 0 15.5 12Z" /><path d="M14 5.2v2.1a5 5 0 0 1 0 9.4v2.1a7 7 0 0 0 0-13.6Z" /></>,
    chat: <path d="M4 4h16v12H8l-4 4V4Zm4 5h8M8 12h5" />,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    queue: <><path d="M5 6h14M5 12h14M5 18h9" /><circle cx="3" cy="6" r="1" /><circle cx="3" cy="12" r="1" /><circle cx="3" cy="18" r="1" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></>,
    activity: <path d="M3 12h4l2-6 4 12 2-6h6" />,
    metrics: <><path d="M5 19V9M12 19V5M19 19v-7" /><path d="M3 19h18" /></>,
    profit: <><path d="M4 17l5-5 4 3 7-8" /><path d="M15 7h5v5" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.activity}</svg>;
}

export default function Navigation() {
  const pathname = usePathname();
  return <nav className="side-nav" aria-label="メインナビゲーション">
    {items.map(([href, icon, label]) => {
      const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
      return <Link key={href} href={href} className={active ? 'active' : ''}><Icon name={icon} /><span>{label}</span></Link>;
    })}
  </nav>;
}
