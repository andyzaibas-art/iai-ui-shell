import React from 'react';
import { NavLink } from 'react-router-dom';

type Item = {
  to: string;
  label: string;
  icon: string;
};

const items: Item[] = [
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/write', label: 'Write', icon: '✍️' },
  { to: '/search', label: 'Search', icon: '🔎' },
  { to: '/history', label: 'History', icon: '🕘' },
  { to: '/rules', label: 'Rules', icon: '📜' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/help', label: 'Help', icon: '❓' }
];

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sidebarHeader">
        <div className="brandMark" aria-hidden="true">
          <span className="brandDot" />
          <span className="brandText">I.A.I</span>
        </div>
        <div className="brandSub">UI shell</div>
      </div>

      <nav className="nav" aria-label="Primary">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `navItem ${isActive ? 'active' : ''}`}
          >
            <span className="navIcon" aria-hidden="true">
              {it.icon}
            </span>
            <span className="navLabel">{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebarFooter">
        <div className="miniHint">
          Local-only demo • No backend
        </div>
      </div>
    </aside>
  );
}
