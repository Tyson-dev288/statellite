import React, { useState } from 'react';
import { RealTimeHazardAlert } from '../services/realTimeAlerts';
import {
  Bell,
  X,
  AlertTriangle,
  Flame,
  Droplets,
  CloudLightning,
  Sun,
  MapPin,
  ExternalLink,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface RealTimeAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: RealTimeHazardAlert[];
  onNavigateToAlert: (alert: RealTimeHazardAlert) => void;
}

export const RealTimeAlertsDrawer: React.FC<RealTimeAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onNavigateToAlert,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border-l border-stone-800 text-stone-100 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Shiva Station · Real-Time Alerts</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Live Sentinel satellite telemetry &amp; hazard prediction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title={soundEnabled ? 'Mute Alerts' : 'Unmute Alerts'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="px-4 py-2.5 border-b border-stone-800 bg-stone-950/50 flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filter === 'ALL'
                ? 'bg-stone-800 text-white border border-stone-700'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              filter === 'CRITICAL'
                ? 'bg-rose-950 border border-rose-600 text-rose-300'
                : 'text-stone-400 hover:text-rose-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('WARNING')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              filter === 'WARNING'
                ? 'bg-amber-950 border border-amber-600 text-amber-300'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Warnings ({warningCount})
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
              <p>No active alerts in this category.</p>
              <p className="text-[11px] text-stone-600">All monitored agricultural sectors operating normally.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                    isCritical
                      ? 'bg-rose-950/40 border-rose-600/70 text-rose-100 shadow-md shadow-rose-950/50'
                      : 'bg-amber-950/30 border-amber-600/60 text-amber-100'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {alert.type === 'heat' && (
                        <span className="p-1.5 rounded-md bg-rose-500/20 text-rose-400">
                          <Flame className="w-4 h-4" />
                        </span>
                      )}
                      {alert.type === 'flood' && (
                        <span className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
                          <Droplets className="w-4 h-4" />
                        </span>
                      )}
                      {alert.type === 'weather' && (
                        <span className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400">
                          <CloudLightning className="w-4 h-4" />
                        </span>
                      )}
                      {alert.type === 'drought' && (
                        <span className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
                          <Sun className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCritical
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-stone-400 ml-2 font-mono">
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="font-bold text-white text-xs leading-snug">
                      {alert.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-0.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{alert.locationName}</span>
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {alert.villageOrTown}, {alert.district}, {alert.state}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-stone-300 leading-relaxed bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                    {alert.description}
                  </p>

                  {/* Required Countermeasure */}
                  <div className="text-[11px] text-stone-200">
                    <span className="font-bold text-emerald-400">Action: </span>
                    <span>{alert.actionRequired}</span>
                  </div>

                  {/* Action Button: Fly Shiva Station Here */}
                  <button
                    onClick={() => onNavigateToAlert(alert)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Fly Shiva Station &amp; Inspect Map</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-stone-800 text-center text-[10px] text-stone-500 bg-stone-950">
          Auto-synchronized with Copernicus Sentinel satellites &amp; Open-Meteo telemetry
        </div>
      </div>
    </div>
  );
};
