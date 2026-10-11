import React, { useState, useEffect } from 'react';
import {
  PolygonCoords,
  NDVIResult,
  TimeSeriesPoint,
  DroughtResult,
  HealthClassification,
  SavedField,
} from '../types';
import {
  fetchNDVI,
  fetchTimeSeries,
  fetchDroughtAnomaly,
  classifyCropHealth,
  calculatePolygonAreaHectares,
  calculatePolygonPerimeterKm,
  computeVegetationDensity,
  getPolygonCenter,
} from '../services/satelliteEngine';
import { LocationDetails } from '../services/geocoding';
import { fetchLiveEnvironmentalRisks, WeatherRiskAssessment } from '../services/weatherService';
import { recordAnalysis } from '../services/storage';
import { PRESET_REGIONS } from '../data/presets';
import { LeafletMap } from './LeafletMap';
import { EnvironmentalAlerts } from './EnvironmentalAlerts';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Activity,
  Calendar,
  AlertCircle,
  BookmarkPlus,
  Sliders,
  Sparkles,
  MapPin,
  Trees,
  Bell,
  Thermometer,
} from 'lucide-react';

interface CropMonitoringProps {
  fields: SavedField[];
  onSaveNewField: (field: Omit<SavedField, 'id'>) => void;
  selectedField?: SavedField | null;
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

export const CropMonitoring: React.FC<CropMonitoringProps> = ({
  fields,
  onSaveNewField,
  selectedField,
  presetId,
  onOpenAlerts,
  flyTarget,
}) => {
  const initialPreset = PRESET_REGIONS.find((p) => p.id === presetId) || PRESET_REGIONS[1];
  const [coords, setCoords] = useState<PolygonCoords | null>(
    selectedField?.coords || initialPreset.coords
  );

  useEffect(() => {
    if (flyTarget?.coords) {
      setCoords(flyTarget.coords);
      setNewFieldName(`Shiva · ${flyTarget.name}`);
    }
  }, [flyTarget]);

  const [dateRange, setDateRange] = useState({
    start: '2025-01-01',
    end: '2025-03-31',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis outputs
  const [ndviResult, setNdviResult] = useState<NDVIResult | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [health, setHealth] = useState<HealthClassification | null>(null);
  const [drought, setDrought] = useState<DroughtResult | null>(null);
  const [identifiedLocation, setIdentifiedLocation] = useState<LocationDetails | null>(null);
  const [weatherAssessment, setWeatherAssessment] = useState<WeatherRiskAssessment | null>(null);

  // Interactive ML Feature Simulation Sliders
  const [customParams, setCustomParams] = useState({
    ndwi: 0.12,
    rain: 65,
    temp: 24,
  });
  const [showMlSliders, setShowMlSliders] = useState(false);

  // Save Field Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('Shiva Farm Parcel A');
  const [newCropType, setNewCropType] = useState('Winter Wheat');
  const [newLocationName, setNewLocationName] = useState('Ludhiana, Punjab');

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

  // Trigger analysis
  const runCropAnalysis = async () => {
    if (!coords || coords.length < 3) {
      setError('Please draw a field polygon on the map or select a preset parcel.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const ndviData = await fetchNDVI(coords, dateRange.start, dateRange.end);
      setNdviResult(ndviData);
      if (ndviData.location) {
        setIdentifiedLocation(ndviData.location);
        setNewLocationName(`${ndviData.location.villageOrTown}, ${ndviData.location.district}`);
      }

      const tsData = await fetchTimeSeries(coords, dateRange.start, dateRange.end);
      setTimeSeries(tsData);

      const mlClassification = await classifyCropHealth(
        ndviData.mean_ndvi,
        customParams.ndwi,
        customParams.rain,
        customParams.temp
      );
      setHealth(mlClassification);

      const droughtData = await fetchDroughtAnomaly(
        coords,
        new Date(dateRange.end).getFullYear(),
        new Date(dateRange.end).getMonth() + 1
      );
      setDrought(droughtData);

      const locationLabel = ndviData.location
        ? `${ndviData.location.villageOrTown}, ${ndviData.location.district}`
        : 'Shiva Farmland Holding';

      recordAnalysis({
        uid: 'usr-agritech-demo-01',
        type: 'crop',
        title: `Shiva · Crop Health & Density: ${locationLabel}`,
        fieldName: newFieldName,
        coords,
        summary: `Exact NDVI ${ndviData.mean_ndvi.toFixed(3)} (${ndviData.vegetationDensity.category}) · Classified as ${mlClassification.label} (${mlClassification.confidence}% confidence).`,
        locationName: `Shiva · ${locationLabel}`,
        details: {
          ndvi: ndviData.mean_ndvi,
          health: mlClassification.label,
          zScore: droughtData.z_score,
          tileUrl: ndviData.tile_url,
          vegetationDensity: ndviData.vegetationDensity.category,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to process satellite analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (pId: string) => {
    const p = PRESET_REGIONS.find((r) => r.id === pId);
    if (p) {
      setCoords(p.coords);
      setNewFieldName(`Shiva · ${p.name}`);
      setNewCropType(p.crop);
      setNewLocationName(p.location);
      setNdviResult(null);
      setHealth(null);
      setDrought(null);
    }
  };

  const handleSavedFieldSelect = (fId: string) => {
    const f = fields.find((item) => item.id === fId);
    if (f) {
      setCoords(f.coords);
      setNewFieldName(f.name);
      setNewCropType(f.cropType);
      setNewLocationName(f.locationName);
      setNdviResult(null);
      setHealth(null);
      setDrought(null);
    }
  };

  const handleSaveFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return;
    const areaHa = calculatePolygonAreaHectares(coords);
    onSaveNewField({
      name: newFieldName.includes('Shiva') ? newFieldName : `Shiva · ${newFieldName}`,
      cropType: newCropType,
      areaHectares: areaHa,
      coords,
      sowingDate: dateRange.start,
      lastAnalyzed: new Date().toISOString().split('T')[0],
      lastNdvi: ndviResult?.mean_ndvi ?? 0.65,
      healthStatus: health?.label ?? 'Healthy',
      locationName: identifiedLocation
        ? `${identifiedLocation.villageOrTown}, ${identifiedLocation.district}`
        : newLocationName,
      locationDetails: identifiedLocation || undefined,
    });
    setIsSaveModalOpen(false);
  };

  const currentAreaHa = coords ? calculatePolygonAreaHectares(coords) : 0;
  const currentPerimeterKm = coords ? calculatePolygonPerimeterKm(coords) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls Strip with Shiva Identifier */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
              Shiva Station
            </span>
            <span className="text-xs text-stone-500">Sentinel-2 MSI Multi-Spectral Feed</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Shiva · Crop Health &amp; Vegetation Density Monitoring
          </h1>
          <p className="text-xs text-stone-500">
            Field boundary measurements, village/town identification, exact NDVI, and heat/flood risk indicators.
          </p>
        </div>

        {/* Preset & Saved Field Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            onChange={(e) => handlePresetSelect(e.target.value)}
            defaultValue={presetId || 'punjab-ludhiana-wheat'}
            className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-700 font-medium focus:ring-1 focus:ring-emerald-500 outline-none shadow-xs"
          >
            <option disabled value="">— Select Region —</option>
            {PRESET_REGIONS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                📍 {preset.name} ({preset.crop})
              </option>
            ))}
          </select>

          {fields.length > 0 && (
            <select
              onChange={(e) => handleSavedFieldSelect(e.target.value)}
              defaultValue=""
              className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-700 font-medium focus:ring-1 focus:ring-emerald-500 outline-none shadow-xs"
            >
              <option value="" disabled>— My Saved Fields —</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  🌾 {f.name} ({f.areaHectares} ha)
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Map with "Shiva" Badge and Color-Coded Layers */}
      <div className="space-y-3">
        <LeafletMap
          coords={coords}
          onPolygonChange={setCoords}
          ndviTileUrl={ndviResult?.tile_url}
          meanNdvi={ndviResult?.mean_ndvi}
          height="540px"
          onOpenAlerts={onOpenAlerts}
          externalFlyTarget={flyTarget}
          onLocationIdentified={(loc) => {
            setIdentifiedLocation(loc);
            setNewLocationName(`${loc.villageOrTown}, ${loc.district}`);
          }}
        />

        {/* Action Bar Below Map */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          {/* Date Picker Controls */}
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Acquisition Window:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="text-xs bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 text-stone-700 outline-none font-mono"
              />
              <span className="text-stone-400 text-xs">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="text-xs bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 text-stone-700 outline-none font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowMlSliders(!showMlSliders)}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 ml-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>ML Input Tuning</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {coords && (
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-stone-500" />
                <span>Save As Field</span>
              </button>
            )}

            <button
              type="button"
              onClick={runCropAnalysis}
              disabled={isLoading || !coords}
              className={`px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-2 whitespace-nowrap shadow-xs ${
                isLoading || !coords
                  ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Processing Sentinel-2 MSI...' : 'Analyze Crop Health & Density'}</span>
            </button>
          </div>
        </div>

        {/* ML Parameter Tuning Drawer */}
        {showMlSliders && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                Random Forest Input Features (Sensitivity Stress-Testing)
              </span>
              <span className="text-[11px] text-stone-500">
                Trained features: NDVI, NDWI, Precipitation, Temperature
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-stone-600 mb-1">
                  <span>NDWI (Normalized Moisture Index):</span>
                  <span className="font-mono font-bold">{customParams.ndwi.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.4"
                  step="0.02"
                  value={customParams.ndwi}
                  onChange={(e) => setCustomParams({ ...customParams, ndwi: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-stone-600 mb-1">
                  <span>30-Day Rainfall:</span>
                  <span className="font-mono font-bold">{customParams.rain} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={customParams.rain}
                  onChange={(e) => setCustomParams({ ...customParams, rain: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-stone-600 mb-1">
                  <span>Canopy Surface Temp:</span>
                  <span className="font-mono font-bold">{customParams.temp} °C</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="44"
                  step="1"
                  value={customParams.temp}
                  onChange={(e) => setCustomParams({ ...customParams, temp: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Automated Environmental & Weather Hazard Alerts Center */}
      <EnvironmentalAlerts weather={weatherAssessment} />

      {/* Analysis Results Display: Location Details, Area, Exact NDVI & Vegetation Density */}
      {ndviResult && health && (
        <div className="space-y-6 pt-2">
          {/* Prominent Location & Identification Banner with "Shiva" Station */}
          {identifiedLocation && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                    Shiva Station Holding
                  </span>
                  <span className="text-xs text-stone-400">·</span>
                  <span className="text-xs text-stone-500 font-mono">
                    Lat {identifiedLocation.coordinates.lat.toFixed(4)}°, Lng {identifiedLocation.coordinates.lng.toFixed(4)}°
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{identifiedLocation.villageOrTown}</span>
                  {identifiedLocation.suburbOrLocality && (
                    <span className="text-sm font-medium text-stone-500">
                      ({identifiedLocation.suburbOrLocality})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-stone-600">
                  {identifiedLocation.district}, {identifiedLocation.state}, {identifiedLocation.country}
                </p>
              </div>

              {/* Exact Vegetation Density Rating Pill */}
              <div className="flex flex-col sm:items-end gap-1">
                <div className="text-xs text-stone-500">Vegetation Density Status</div>
                <div
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs flex items-center gap-1.5"
                  style={{ backgroundColor: ndviResult.vegetationDensity.color }}
                >
                  <Trees className="w-4 h-4" />
                  <span>{ndviResult.vegetationDensity.category}</span>
                </div>
                <div className="text-[11px] text-stone-400 font-mono">
                  {ndviResult.vegetationDensity.fvcPercent}% Ground Cover · LAI {ndviResult.vegetationDensity.lai} m²/m²
                </div>
              </div>
            </div>
          )}

          {/* 4 Primary Metric Cards (Exact NDVI, Measured Area, Health, Drought) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Exact NDVI Value */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1 flex items-center justify-between">
                <span>Exact NDVI Value</span>
                <span className="font-mono text-[11px] text-emerald-700">Sentinel-2</span>
              </div>
              <div
                className="text-3xl font-bold font-mono tabular-nums"
                style={{ color: ndviResult.vegetationDensity.color }}
              >
                {ndviResult.mean_ndvi.toFixed(3)}
              </div>
              <div className="mt-2 text-xs text-stone-500 flex items-center justify-between">
                <span>Range: {ndviResult.min_ndvi} – {ndviResult.max_ndvi}</span>
                <span className="font-mono">σ={ndviResult.std_dev}</span>
              </div>
            </div>

            {/* 2. Measured Agricultural Area & Perimeter */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1 flex items-center justify-between">
                <span>Measured Field Size</span>
                <span className="font-mono text-[11px] text-stone-400">Shiva Surveyor</span>
              </div>
              <div className="text-3xl font-bold font-mono text-stone-900 tabular-nums">
                {currentAreaHa} <span className="text-sm font-sans text-stone-500">ha</span>
              </div>
              <div className="mt-2 text-xs text-stone-500 flex items-center justify-between">
                <span>{(currentAreaHa * 2.471).toFixed(1)} acres</span>
                <span className="font-mono">Perimeter: {currentPerimeterKm} km</span>
              </div>
            </div>

            {/* 3. Vegetation Density & Health Classification */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1 flex items-center justify-between">
                <span>Vegetation Classification</span>
                <span className="font-mono text-[11px] text-stone-400">{health.confidence}% conf</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  health.label === 'Healthy'
                    ? 'text-emerald-700'
                    : health.label === 'Stressed'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {health.label}
              </div>
              <div className="mt-2 text-xs text-stone-500 truncate">
                {ndviResult.vegetationDensity.chlorophyllLevel} Chlorophyll Activity
              </div>
            </div>

            {/* 4. Climatological Drought Anomaly */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs text-stone-500 mb-1 flex items-center justify-between">
                <span>5-Yr Drought Anomaly</span>
                <span className="font-mono text-[11px] text-stone-400">Z-Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    drought && drought.z_score < -1.5 ? 'text-rose-700' : 'text-stone-900'
                  }`}
                >
                  Z = {drought?.z_score.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-xs text-stone-500 truncate">
                Status: <span className="font-semibold text-stone-700">{drought?.status}</span>
              </div>
            </div>
          </div>

          {/* AI Agronomist Actionable Advice Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 text-stone-800 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-emerald-950">
                Shiva Agronomic Directives for {identifiedLocation?.villageOrTown || 'Identified Parcel'}
              </h3>
            </div>
            <p className="text-xs md:text-sm text-stone-700 leading-relaxed">
              {health.advice}
            </p>

            <div className="pt-2 border-t border-emerald-200/80">
              <div className="text-xs font-semibold text-emerald-900 mb-1.5">
                Recommended Actions:
              </div>
              <ul className="text-xs text-stone-700 space-y-1">
                {health.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold shrink-0">&bull;</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Phenology Time-Series Chart */}
          {timeSeries.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Shiva · Monthly Crop Phenology &amp; NDVI Trajectory
                  </h3>
                  <p className="text-xs text-stone-500">
                    Vegetative vigor progression vs. 5-year seasonal baseline for {identifiedLocation?.villageOrTown || 'monitored farm'}
                  </p>
                </div>
                <div className="text-xs text-stone-400 font-mono">
                  Monthly Composites (SCL Cloud-Filtered)
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return d.toLocaleString('default', { month: 'short' });
                      }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => val.toFixed(1)}
                    />
                    <Tooltip
                      formatter={(value: any) => [Number(value).toFixed(3), '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="ndvi"
                      name="Current Season NDVI"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#059669' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="baseline_mean"
                      name="5-Yr Climatological Baseline"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Field Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">Save Farm Parcel</h3>
            <p className="text-xs text-stone-500 mb-4">
              Register this field boundary polygon under Shiva Station for automated periodic monitoring.
            </p>

            <form onSubmit={handleSaveFieldSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Field / Parcel Name</label>
                <input
                  type="text"
                  required
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Crop Type</label>
                <select
                  value={newCropType}
                  onChange={(e) => setNewCropType(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Winter Wheat">Winter Wheat</option>
                  <option value="Wetland Rice (Paddy)">Wetland Rice (Paddy)</option>
                  <option value="Maize / Corn">Maize / Corn</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Almonds / Orchard">Almonds / Orchard</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Location / Village Details</label>
                <input
                  type="text"
                  required
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>Measured Area:</span>
                  <span className="font-mono font-bold text-stone-900">{currentAreaHa} ha</span>
                </div>
                <div className="flex justify-between">
                  <span>Current NDVI:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {ndviResult?.mean_ndvi.toFixed(3) || '0.650'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vegetation Density:</span>
                  <span className="font-semibold text-stone-800">
                    {ndviResult?.vegetationDensity.category || 'Dense Canopy'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  Save to My Fields
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
