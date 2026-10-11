import React from 'react';
import { UserProfile } from '../services/storage';
import { Settings, Bell } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'monitoring' | 'disaster' | 'fields' | 'history';
  onSelectTab: (tab: 'dashboard' | 'monitoring' | 'disaster' | 'fields' | 'history') => void;
  user: UserProfile;
  onOpenSettings: () => void;
  onOpenRealTimeAlerts?: () => void;
  alertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenSettings,
  onOpenRealTimeAlerts,
  alertCount = 4,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg group-hover:bg-emerald-600/30 transition-colors">
            🌾
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              CropSense AI
            </div>
            <div className="text-[11px] text-stone-400 font-normal">
              Agricultural Monitoring &amp; Disaster Assessment
            </div>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Clean single-line text links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'dashboard'
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('monitoring')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'monitoring'
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            Crop Monitoring
          </button>

          <button
            onClick={() => onSelectTab('disaster')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'disaster'
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            Disaster Assessment
          </button>

          <button
            onClick={() => onSelectTab('fields')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'fields'
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            My Fields
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'history'
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-semibold'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            Analysis History
          </button>
        </nav>

        {/* Zone 3: Real-Time Alerts, Settings & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenRealTimeAlerts && (
            <button
              onClick={onOpenRealTimeAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-600/70 text-rose-300 hover:bg-rose-900/80 transition-colors text-xs font-semibold shadow-xs"
              title="Real-Time Hazard Alerts"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <Bell className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Real-Time Alerts</span>
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {alertCount}
              </span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
            <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-300">
              {user.displayName.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium text-stone-200 truncate max-w-[120px]">
                {user.displayName}
              </div>
              <div className="text-[10px] text-stone-400 truncate max-w-[120px]">
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
