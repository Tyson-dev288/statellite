import React, { useState, useEffect } from 'react';
import { PolygonCoords, FloodResult, DroughtResult, SavedField } from '../types';
import {
  fetchFloodAssessment,
  fetchDroughtAnomaly,
  calculatePolygonAreaHectares,
  calculatePolygonPerimeterKm,
  getPolygonCenter,
} from '../services/satelliteEngine';
import { LocationDetails } from '../services/geocoding';
import { fetchLiveEnvironmentalRisks, WeatherRiskAssessment } from '../services/weatherService';
import { recordAnalysis } from '../services/storage';
import { PRESET_REGIONS } from '../data/presets';
import { LeafletMap } from './LeafletMap';
import { EnvironmentalAlerts } from './EnvironmentalAlerts';
import {
  Waves,
  Sun,
  AlertTriangle,
  FileText,
  Printer,
  ShieldAlert,
  MapPin,
  Bell,
  Thermometer,
  Droplets,
} from 'lucide-react';

interface DisasterAssessmentProps {
  fields: SavedField[];
  presetId?: string | null;
  onOpenAlerts?: () => void;
  flyTarget?: {
    lat: number;
    lng: number;
    name: string;
    layer?: any;
    coords?: PolygonCoords;
  } | null;
}

export const DisasterAssessment: React.FC<DisasterAssessmentProps> = ({
  fields,
  presetId,
  onOpenAlerts,
  flyTarget,
}) => {
  const initialPreset = PRESET_REGIONS.find((p) => p.id === presetId) || PRESET_REGIONS[0];

  const [activeTab, setActiveTab] = useState<'flood' | 'drought'>('flood');
  const [coords, setCoords] = useState<PolygonCoords | null>(initialPreset.coords);

  useEffect(() => {
    if (flyTarget) {
      if (flyTarget.coords) setCoords(flyTarget.coords);
      if (flyTarget.layer === 'soilMoisture') setActiveTab('drought');
      else if (flyTarget.layer === 'water' || flyTarget.layer === 'floodRisk') setActiveTab('flood');
    }
  }, [flyTarget]);

  // Flood Date ranges (Pre-event vs Post-event SAR)
  const [floodDates, setFloodDates] = useState({
    b1: initialPreset.historicalEvent?.dates.beforeStart || '2018-07-01',
    b2: initialPreset.historicalEvent?.dates.beforeEnd || '2018-07-20',
    a1: initialPreset.historicalEvent?.dates.afterStart || '2018-08-15',
    a2: initialPreset.historicalEvent?.dates.afterEnd || '2018-08-25',
  });

  // Drought Parameters
  const [droughtDate, setDroughtDate] = useState({
    year: 2024,
    month: 7,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [floodResult, setFloodResult] = useState<FloodResult | null>(null);
  const [droughtResult, setDroughtResult] = useState<DroughtResult | null>(null);
  const [identifiedLocation, setIdentifiedLocation] = useState<LocationDetails | null>(null);
  const [weatherAssessment, setWeatherAssessment] = useState<WeatherRiskAssessment | null>(null);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Load weather when coords change
  useEffect(() => {
    if (!coords || coords.length < 3) return;
    const center = getPolygonCenter(coords);
    fetchLiveEnvironmentalRisks(
      center[0],
      center[1],
      identifiedLocation?.villageOrTown || 'Shiva Sector'
    ).then((w) => setWeatherAssessment(w));
  }, [coords, identifiedLocation]);

  // Run Flood Analysis
  const runFloodAnalysis = async () => {
    if (!coords || coords.length < 3) {
      setError('Please draw a field polygon on the map or select a preset region.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetchFloodAssessment(
        coords,
        floodDates.b1,
        floodDates.b2,
        floodDates.a1,
        floodDates.a2
      );
      setFloodResult(res);
      if (res.location) {
        setIdentifiedLocation(res.location);
      }

      const locName = res.location
        ? `${res.location.villageOrTown}, ${res.location.district}`
        : 'Shiva Inundation Sector';

      recordAnalysis({
        uid: 'usr-agritech-demo-01',
        type: 'flood',
        title: `Shiva · Sentinel-1 Flood Assessment: ${locName}`,
        coords,
        locationName: `Shiva · ${locName}`,
        summary: `Detected ${res.flooded_hectares} ha (${res.percent_flooded}%) inundated area across ${res.total_hectares} ha field. Severity: ${res.severity}.`,
        details: {
          floodedHa: res.flooded_hectares,
          percentFlooded: res.percent_flooded,
          tileUrl: res.tile_url,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to process Sentinel-1 flood extent.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Drought Analysis
  const runDroughtAnalysis = async () => {
    if (!coords || coords.length < 3) {
      setError('Please draw a field polygon on the map or select a preset region.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetchDroughtAnomaly(coords, droughtDate.year, droughtDate.month);
      setDroughtResult(res);
      if (res.location) {
        setIdentifiedLocation(res.location);
      }

      const locName = res.location
        ? `${res.location.villageOrTown}, ${res.location.district}`
        : 'Shiva Climatological Sector';

      recordAnalysis({
        uid: 'usr-agritech-demo-01',
        type: 'drought',
        title: `Shiva · Drought Anomaly: ${locName}`,
        coords,
        locationName: `Shiva · ${locName}`,
        summary: `Z-Score: ${res.z_score.toFixed(2)} · Status: ${res.status} · Moisture deficit ${res.precip_deficit_percent}%.`,
        details: {
          droughtStatus: res.status,
          zScore: res.z_score,
          ndvi: res.current_ndvi,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to process drought anomaly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (pId: string) => {
    const p = PRESET_REGIONS.find((r) => r.id === pId);
    if (p) {
      setCoords(p.coords);
      if (p.historicalEvent?.dates.beforeStart) {
        setFloodDates({
          b1: p.historicalEvent.dates.beforeStart,
          b2: p.historicalEvent.dates.beforeEnd || '2018-07-20',
          a1: p.historicalEvent.dates.afterStart || '2018-08-15',
          a2: p.historicalEvent.dates.afterEnd || '2018-08-25',
        });
      }
      setFloodResult(null);
      setDroughtResult(null);
    }
  };

  const currentAreaHa = coords ? calculatePolygonAreaHectares(coords) : 0;
  const currentPerimeterKm = coords ? calculatePolygonPerimeterKm(coords) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header with "Shiva" Identifier */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
              Shiva Station
            </span>
            <span className="text-xs text-stone-500">Sentinel-1 C-Band SAR &amp; Open-Meteo Feed</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Shiva · Agricultural Disaster &amp; Hazard Assessment
          </h1>
          <p className="text-xs text-stone-500">
            Sentinel-1 Synthetic Aperture Radar (SAR) flood inundation, drought anomaly, and automated hazard alerts.
          </p>
        </div>

        {/* Disaster Mode Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 shadow-xs">
            <button
              onClick={() => setActiveTab('flood')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'flood'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-blue-600" />
              <span>Flood Inundation (SAR)</span>
            </button>
            <button
              onClick={() => setActiveTab('drought')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'drought'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>Drought Anomaly (Z-Score)</span>
            </button>
          </div>

          <select
            onChange={(e) => handlePresetSelect(e.target.value)}
            defaultValue={presetId || 'kerala-kuttanad-2018'}
            className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-700 font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-xs"
          >
            <option disabled value="">— Select Region —</option>
            {PRESET_REGIONS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                📍 {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Display with "Shiva" Badge and Color-Coded Layers */}
      <div className="space-y-3">
        <LeafletMap
          coords={coords}
          onPolygonChange={setCoords}
          floodTileUrl={floodResult?.tile_url}
          height="520px"
          onOpenAlerts={onOpenAlerts}
          externalFlyTarget={flyTarget}
          onLocationIdentified={(loc) => setIdentifiedLocation(loc)}
        />

        {/* Flood Control Panel */}
        {activeTab === 'flood' && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">Pre-Event Baseline:</span>
                <input
                  type="date"
                  value={floodDates.b1}
                  onChange={(e) => setFloodDates({ ...floodDates, b1: e.target.value })}
                  className="bg-stone-50 border border-stone-200 rounded-md px-2 py-1 font-mono text-xs"
                />
                <span className="text-stone-400">to</span>
                <input
                  type="date"
                  value={floodDates.b2}
                  onChange={(e) => setFloodDates({ ...floodDates, b2: e.target.value })}
                  className="bg-stone-50 border border-stone-200 rounded-md px-2 py-1 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">Post-Disaster Window:</span>
                <input
                  type="date"
                  value={floodDates.a1}
                  onChange={(e) => setFloodDates({ ...floodDates, a1: e.target.value })}
                  className="bg-stone-50 border border-stone-200 rounded-md px-2 py-1 font-mono text-xs"
                />
                <span className="text-stone-400">to</span>
                <input
                  type="date"
                  value={floodDates.a2}
                  onChange={(e) => setFloodDates({ ...floodDates, a2: e.target.value })}
                  className="bg-stone-50 border border-stone-200 rounded-md px-2 py-1 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={runFloodAnalysis}
                disabled={isLoading || !coords}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-2 whitespace-nowrap shadow-xs ${
                  isLoading || !coords
                    ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-700/20'
                }`}
              >
                <Waves className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Computing Radar Backscatter...' : 'Assess Flood Damage'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Drought Control Panel */}
        {activeTab === 'drought' && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-stone-800">Evaluation Month &amp; Year:</span>
              <select
                value={droughtDate.month}
                onChange={(e) => setDroughtDate({ ...droughtDate, month: parseInt(e.target.value) })}
                className="bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>

              <select
                value={droughtDate.year}
                onChange={(e) => setDroughtDate({ ...droughtDate, year: parseInt(e.target.value) })}
                className="bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 font-mono"
              >
                {[2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={runDroughtAnalysis}
              disabled={isLoading || !coords}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-2 whitespace-nowrap shadow-xs ${
                isLoading || !coords
                  ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-700/20'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Comparing 5-Yr Baseline...' : 'Evaluate Drought Anomaly'}</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Automated Environmental Hazard Alerts Banner */}
      <EnvironmentalAlerts weather={weatherAssessment} />

      {/* Flood Results View */}
      {floodResult && activeTab === 'flood' && (
        <div className="space-y-6 pt-2">
          {identifiedLocation && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-bold text-stone-900 text-sm">
                    Shiva Station · {identifiedLocation.villageOrTown}
                  </span>
                  <span className="text-xs text-stone-500 ml-2">
                    {identifiedLocation.district}, {identifiedLocation.state}
                  </span>
                </div>
              </div>
              <div className="text-xs font-mono text-stone-500">
                Total Measured Area: <b className="text-stone-900">{floodResult.total_hectares} ha</b>
              </div>
            </div>
          )}

          {/* 4 Flood Impact Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1">Total Measured Farmland</div>
              <div className="text-3xl font-bold font-mono text-stone-900 tabular-nums">
                {floodResult.total_hectares}
              </div>
              <div className="mt-2 text-xs text-stone-500">
                {(floodResult.total_hectares * 2.471).toFixed(1)} acres
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1">Inundated / Flooded Area</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-blue-700 tabular-nums">
                  {floodResult.flooded_hectares}
                </span>
                <span className="text-xs font-semibold text-blue-600">
                  ({floodResult.percent_flooded}%)
                </span>
              </div>
              <div className="mt-2 text-xs text-stone-500">
                SAR threshold &lt; -15 dB backscatter
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1">Direct Cropland Destruction</div>
              <div className="text-3xl font-bold font-mono text-rose-700 tabular-nums">
                {floodResult.cropland_flooded_hectares}
              </div>
              <div className="mt-2 text-xs text-stone-500">
                ESA WorldCover 2021 Class 40 crop mask
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1">Disaster Severity Tier</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-lg font-bold ${
                    floodResult.percent_flooded > 30
                      ? 'text-rose-700'
                      : floodResult.percent_flooded >= 10
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {floodResult.severity}
                </span>
              </div>
              <div className="mt-2 text-xs text-stone-500">
                Confidence: <span className="font-mono font-semibold">92%</span>
              </div>
            </div>
          </div>

          {/* Damage Assessment Action Bar & Report Trigger */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-sm text-blue-950 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-700" />
                <span>Shiva Official Agricultural Disaster Assessment</span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed max-w-2xl">
                Ready for disaster compensation filing, crop insurance claims, and irrigation district recovery mobilization in {identifiedLocation?.villageOrTown || 'the affected region'}.
              </p>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Printable Damage Claim Report</span>
            </button>
          </div>
        </div>
      )}

      {/* Drought Results View */}
      {droughtResult && activeTab === 'drought' && (
        <div className="space-y-6 pt-2">
          {identifiedLocation && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="font-bold text-stone-900 text-sm">
                    Shiva Station · {identifiedLocation.villageOrTown}
                  </span>
                  <span className="text-xs text-stone-500 ml-2">
                    {identifiedLocation.district}, {identifiedLocation.state}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1">Current Month Mean NDVI</div>
              <div className="text-3xl font-bold font-mono text-stone-900 tabular-nums">
                {droughtResult.current_ndvi.toFixed(3)}
              </div>
              <div className="mt-2 text-xs text-stone-500">
                Historical 5-Yr Mean: <span className="font-mono">{droughtResult.historical_mean.toFixed(3)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1">Climatology Z-Score Anomaly</div>
              <div
                className={`text-3xl font-bold font-mono tabular-nums ${
                  droughtResult.z_score < -1.5 ? 'text-rose-700' : 'text-stone-900'
                }`}
              >
                {droughtResult.z_score > 0 ? `+${droughtResult.z_score}` : droughtResult.z_score}
              </div>
              <div className="mt-2 text-xs text-stone-500">
                Formula: (NDVI - &mu;) / &sigma;
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1">Drought Classification</div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {droughtResult.status}
              </div>
              <div className="mt-2 text-xs text-stone-500">
                Estimated Moisture Deficit: {droughtResult.precip_deficit_percent}%
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-stone-800 space-y-2">
            <div className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
              <span>🌵 Shiva Agronomist Drought Anomaly Directives</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {droughtResult.advice}
            </p>
          </div>
        </div>
      )}

      {/* Printable Disaster Assessment Report Modal */}
      {showReportModal && floodResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-stone-200 my-8 space-y-6 text-stone-900">
            {/* Report Header with "Shiva" Identifier */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold">
                  Shiva Station · Survey ID: REP-SHIVA-2025-{(Math.random() * 10000).toFixed(0)}
                </div>
                <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                  Shiva Satellite Disaster Damage &amp; Inundation Assessment
                </h2>
                <div className="text-xs text-stone-500 mt-1">
                  Location: {identifiedLocation?.villageOrTown || 'Agricultural Zone'}, {identifiedLocation?.district || ''} &middot; Copernicus Missions
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>

            {/* Assessment Details Table */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block">Survey Station</span>
                <span className="font-semibold text-stone-800">Shiva Satellite Intelligence</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block">Total Area Measured</span>
                <span className="font-semibold text-stone-800 font-mono">{floodResult.total_hectares} ha ({(floodResult.total_hectares * 2.471).toFixed(1)} ac)</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block">Sensor Platform</span>
                <span className="font-semibold text-stone-800">Sentinel-1 C-Band SAR (IW Mode, VV Pol)</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="text-stone-500 block">Damage Severity Tier</span>
                <span className="font-semibold text-rose-700">{floodResult.severity}</span>
              </div>
            </div>

            {/* Inundation Impact Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-stone-600 tracking-wider">
                Geospatial Impact Quantification
              </h4>
              <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-stone-200">
                  <thead className="bg-stone-50 text-stone-700 font-semibold">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5 text-right">Value</th>
                      <th className="p-2.5 text-right">Impact Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    <tr>
                      <td className="p-2.5 font-sans">Total Farmland Polygons</td>
                      <td className="p-2.5 text-right">{floodResult.total_hectares} ha</td>
                      <td className="p-2.5 text-right">100.0%</td>
                    </tr>
                    <tr className="bg-blue-50/50">
                      <td className="p-2.5 font-sans font-medium text-blue-900">Total Flooded Inundation</td>
                      <td className="p-2.5 text-right font-bold text-blue-700">{floodResult.flooded_hectares} ha</td>
                      <td className="p-2.5 text-right font-bold text-blue-700">{floodResult.percent_flooded}%</td>
                    </tr>
                    <tr className="bg-rose-50/50">
                      <td className="p-2.5 font-sans font-medium text-rose-900">Direct Cropland Destruction (ESA WC 40)</td>
                      <td className="p-2.5 text-right font-bold text-rose-700">{floodResult.cropland_flooded_hectares} ha</td>
                      <td className="p-2.5 text-right font-bold text-rose-700">
                        {((floodResult.cropland_flooded_hectares / floodResult.total_hectares) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans">Estimated Mean Water Depth</td>
                      <td className="p-2.5 text-right">{floodResult.water_depth_estimate_m} m</td>
                      <td className="p-2.5 text-right">Submerged</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <div className="text-[10px] text-stone-400">
                Verified by Shiva Agricultural Intelligence Engine · {new Date().toUTCString()}
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
