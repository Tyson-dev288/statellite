import React from 'react';
import { WeatherRiskAssessment } from '../services/weatherService';
import { Flame, Droplets, Cloud, AlertTriangle, ShieldCheck, Thermometer, Wind, Bell, Compass } from 'lucide-react';

interface EnvironmentalAlertsProps {
  weather: WeatherRiskAssessment | null;
  onInspectLocation?: () => void;
}

export const EnvironmentalAlerts: React.FC<EnvironmentalAlertsProps> = ({
  weather,
  onInspectLocation,
}) => {
  if (!weather) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              Shiva · Automated Environmental Hazard Alerts
            </h3>
            <p className="text-[11px] text-stone-500">
              Real-time heat monitoring, flood predictions, and meteorological risks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Sentinel &amp; Weather Feed</span>
        </div>
      </div>

      {/* 4 Risk Status Strips: Heat (Red), Flood (Blue), Clouds (White), Vegetation (Green) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* 1. Heat Monitoring (Red System) */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-900 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Heat Monitoring</span>
            </span>
            <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-rose-200/80 text-rose-900">
              {weather.heatRisk.level}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-900">
            {weather.temperatureC}°C
          </div>
          <p className="text-[11px] text-rose-800 leading-tight">
            {weather.heatRisk.message}
          </p>
        </div>

        {/* 2. Flood & Water Accumulation (Blue System) */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Flood Prediction</span>
            </span>
            <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-blue-200/80 text-blue-900">
              {weather.floodRisk.level}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-900">
            {weather.precipitationMm} mm rain
          </div>
          <p className="text-[11px] text-blue-800 leading-tight">
            {weather.floodRisk.message}
          </p>
        </div>

        {/* 3. Cloud Coverage (Optical Satellite Obscuration) */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-800 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-stone-600" />
              <span>Cloud Coverage</span>
            </span>
            <span className="font-mono text-[10px] text-stone-600">
              {weather.cloudCoverPercent}% cover
            </span>
          </div>
          <div className="text-sm font-semibold text-stone-700">
            {weather.cloudRisk.impactOnOpticalSatellite}
          </div>
          <p className="text-[11px] text-stone-500 leading-tight">
            Humidity: {weather.humidityPercent}% · Wind: {weather.windSpeedKmh} km/h
          </p>
        </div>

        {/* 4. Automated Notification Status */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Station Status</span>
            </span>
            <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
              Active
            </span>
          </div>
          <div className="text-sm font-semibold text-emerald-950">
            Shiva Station Operational
          </div>
          <p className="text-[11px] text-emerald-800 leading-tight">
            {weather.alerts.length} active automated notifications in {weather.locationName}
          </p>
        </div>
      </div>

      {/* Active Alerts List */}
      {weather.alerts.length > 0 && (
        <div className="space-y-2 pt-2">
          {weather.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                alert.severity === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'
              }`} />
              <div className="space-y-0.5 flex-1">
                <div className="font-bold">{alert.title}</div>
                <div className="text-[11px] leading-relaxed">{alert.description}</div>
                <div className="text-[11px] font-semibold pt-1">
                  Required Action: <span className="font-normal">{alert.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
