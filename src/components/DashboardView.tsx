import React, { useState, useEffect } from 'react';
import { SavedField, AnalysisRecord, PolygonCoords } from '../types';
import { PRESET_REGIONS } from '../data/presets';
import { computeVegetationDensity } from '../services/satelliteEngine';
import { fetchLiveEnvironmentalRisks, WeatherRiskAssessment } from '../services/weatherService';
import { LeafletMap } from './LeafletMap';
import { EnvironmentalAlerts } from './EnvironmentalAlerts';
import {
  ArrowUpRight,
  Activity,
  AlertTriangle,
  Waves,
  MapPin,
  ChevronRight,
  Trees,
  Bell,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  fields: SavedField[];
  analyses: AnalysisRecord[];
  onNavigate: (
    tab: 'monitoring' | 'disaster' | 'fields' | 'history',
    presetId?: string
  ) => void;
  onSelectFieldForAnalysis: (field: SavedField) => void;
  onOpenAlerts?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  fields,
  analyses,
  onNavigate,
  onSelectFieldForAnalysis,
  onOpenAlerts,
}) => {
  const totalFields = fields.length;
  const totalAreaHa = fields.reduce((acc, f) => acc + f.areaHectares, 0);

  const fieldsWithNdvi = fields.filter((f) => f.lastNdvi !== undefined);
  const avgNdvi =
    fieldsWithNdvi.length > 0
      ? fieldsWithNdvi.reduce((acc, f) => acc + (f.lastNdvi || 0), 0) / fieldsWithNdvi.length
      : 0.61;

  const stressedCount = fields.filter(
    (f) => f.healthStatus === 'Stressed' || f.healthStatus === 'Severely stressed'
  ).length;

  const floodAnalyses = analyses.filter((a) => a.type === 'flood');
  const totalFloodedHa = floodAnalyses.reduce(
    (acc, a) => acc + (a.details.floodedHa || 0),
    0
  );

  const avgDensity = computeVegetationDensity(avgNdvi);

  // Overview map state on Dashboard
  const [dashboardCoords, setDashboardCoords] = useState<PolygonCoords | null>(
    PRESET_REGIONS[1].coords
  );
  const [weatherAssessment, setWeatherAssessment] = useState<WeatherRiskAssessment | null>(null);

  useEffect(() => {
    fetchLiveEnvironmentalRisks(30.901, 75.857, 'Shiva Ludhiana Sector').then((w) => {
      setWeatherAssessment(w);
    });
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner with "Shiva" Station */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded uppercase">
              Shiva Station
            </span>
            <span className="text-xs text-stone-400">
              Satellite-Based AI Agricultural Monitoring &amp; Disaster Assessment
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Shiva Agricultural Monitoring &amp; Disaster Intelligence
          </h1>
          <p className="text-stone-300 text-sm leading-relaxed mb-6">
            Multi-spectral crop intelligence, heat hazard detection, radar flood prediction, and village-level field boundary measurements.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('monitoring')}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap"
            >
              <Activity className="w-4 h-4" />
              <span>Launch Crop Health Monitoring</span>
            </button>
            <button
              onClick={() => onNavigate('disaster')}
              className="px-5 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Waves className="w-4 h-4 text-blue-400" />
              <span>Assess Disaster Damage</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Area */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Shiva Monitored Area</span>
            <span className="font-mono">{totalFields} parcels</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {totalAreaHa.toFixed(1)}
            </div>
            <span className="text-xs font-semibold text-stone-600">hectares</span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            {(totalAreaHa * 2.471).toFixed(1)} acres across active farm holdings
          </div>
        </div>

        {/* Card 2: Average NDVI & Density */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Average NDVI</span>
            <span
              className="font-bold text-[11px] px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: avgDensity.color }}
            >
              {avgDensity.category}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div
              className="text-2xl font-bold font-mono tabular-nums"
              style={{ color: avgDensity.color }}
            >
              {avgNdvi.toFixed(3)}
            </div>
            <span className="text-xs font-medium text-stone-500">/ 1.000</span>
          </div>
          <div className="mt-2 text-xs text-emerald-800 flex items-center gap-1">
            <Trees className="w-3.5 h-3.5" />
            <span>{avgDensity.fvcPercent}% avg ground cover</span>
          </div>
        </div>

        {/* Card 3: Crop Stress Alerts */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Crop Stress Alerts</span>
            <span className="font-mono text-amber-700">Threshold &lt; 0.40</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                stressedCount > 0 ? 'text-amber-700' : 'text-stone-900'
              }`}
            >
              {stressedCount}
            </div>
            <span className="text-xs text-stone-500">parcels flagged</span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            {stressedCount > 0
              ? 'Vegetative or moisture stress identified'
              : 'All monitored fields within nominal bounds'}
          </div>
        </div>

        {/* Card 4: Disaster Inundation */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Disaster Inundated Area</span>
            <span className="text-blue-700 font-mono">Radar Water Mask</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
              {totalFloodedHa.toFixed(1)}
            </div>
            <span className="text-xs text-stone-500">hectares</span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            Delineated via satellite SAR backscatter
          </div>
        </div>
      </div>

      {/* Live Interactive Map on the Dashboard (Shows Shiva station and color-coded layers immediately) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Shiva · Satellite Earth Observation Overview
            </h2>
            <p className="text-xs text-stone-500">
              Color-coded environmental layers: Green (Vegetation), Red (Heat), Blue (Water), Clouds (Cover), Cyan (Flood Risk)
            </p>
          </div>
          <button
            onClick={() => onNavigate('monitoring')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Open Full Monitoring &rarr;</span>
          </button>
        </div>

        <LeafletMap
          coords={dashboardCoords}
          onPolygonChange={setDashboardCoords}
          height="460px"
          onOpenAlerts={onOpenAlerts}
        />
      </div>

      {/* Automated Environmental Hazard Alerts Center */}
      <EnvironmentalAlerts weather={weatherAssessment} />

      {/* Monitored Farm Parcels Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Shiva Monitored Parcels</h2>
            <p className="text-xs text-stone-500">
              Identified village/town names, total measured area, exact NDVI, and vegetation density
            </p>
          </div>
          <button
            onClick={() => onNavigate('fields')}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View all parcels</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((field) => {
            const fieldNdvi = field.lastNdvi ?? 0.65;
            const density = computeVegetationDensity(fieldNdvi);

            return (
              <div
                key={field.id}
                className="bg-white rounded-xl border border-stone-200 p-4 hover:border-emerald-300 transition-all cursor-pointer shadow-xs group"
                onClick={() => onSelectFieldForAnalysis(field)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {field.name}
                    </h3>
                    <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {field.locationDetails?.villageOrTown || field.locationName}
                      </span>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-xs shrink-0"
                    style={{ backgroundColor: density.color }}
                  >
                    {density.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Area</span>
                    <span className="font-mono font-bold text-stone-900">{field.areaHectares} ha</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Exact NDVI</span>
                    <span className="font-mono font-bold text-emerald-700">{fieldNdvi.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
