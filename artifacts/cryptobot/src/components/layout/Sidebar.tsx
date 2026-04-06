import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, History, Settings, TrendingUp } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyze', icon: Zap, label: 'Analyze' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-16 md:w-56 bg-surface border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border hidden md:flex items-center gap-2">
        <TrendingUp className="text-accent w-5 h-5" />
        <span className="font-heading text-xs text-accent tracking-wider uppercase">CryptoBot</span>
      </div>
      <div className="p-2 md:p-3 flex md:hidden items-center justify-center border-b border-border">
        <TrendingUp className="text-accent w-5 h-5" />
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-body text-sm ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border hidden md:block">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
          <span className="text-text-secondary font-mono text-xs">LIVE</span>
        </div>
      </div>
    </aside>
  );
}
