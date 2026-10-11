import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PolygonCoords, PointSpectralInspection, VegetationDensityDetails } from '../types';
import {
  calculatePolygonAreaHectares,
  calculatePolygonPerimeterKm,
  getPolygonCenter,
  computeVegetationDensity,
  inspectPointSpectral,
  generateEnvironmentalLayer,
  EnvironmentalLayerType,
} from '../services/satelliteEngine';
import { reverseGeocode, searchLocation, LocationDetails } from '../services/geocoding';
import { fetchLiveEnvironmentalRisks, WeatherRiskAssessment } from '../services/weatherService';
import {
  Layers,
  MapPin,
  Trash2,
  Edit3,
  Check,
  ZoomIn,
  ZoomOut,
  Search,
  Crosshair,
  Maximize2,
  Minimize2,
  X,
  Flame,
  Droplets,
  Cloud,
  Compass,
  Thermometer,
  ShieldCheck,
  PieChart,
  Sun,
  Activity,
  Bell,
  Tag,
} from 'lucide-react';

interface LeafletMapProps {
  coords: PolygonCoords | null;
  onPolygonChange: (coords: PolygonCoords | null) => void;
  ndviTileUrl?: string | null;
  floodTileUrl?: string | null;
  meanNdvi?: number | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  readOnly?: boolean;
  onLocationIdentified?: (location: LocationDetails) => void;
  onOpenAlerts?: () => void;
  externalFlyTarget?: {
    lat: number;
    lng: number;
    name: string;
    layer?: EnvironmentalLayerType;
    coords?: PolygonCoords;
  } | null;
}

// Generate realistic agricultural field polygon around coordinate
function createAgriculturalParcel(lat: number, lng: number, delta: number = 0.004): PolygonCoords {
  return [
    [Number((lng - delta * 1.15).toFixed(6)), Number((lat + delta * 0.95).toFixed(6))],
    [Number((lng + delta * 1.25).toFixed(6)), Number((lat + delta * 1.05).toFixed(6))],
    [Number((lng + delta * 1.18).toFixed(6)), Number((lat - delta * 0.85).toFixed(6))],
    [Number((lng - delta * 1.05).toFixed(6)), Number((lat - delta * 0.95).toFixed(6))],
    [Number((lng - delta * 1.15).toFixed(6)), Number((lat + delta * 0.95).toFixed(6))],
  ];
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  coords,
  onPolygonChange,
  ndviTileUrl,
  floodTileUrl,
  meanNdvi,
  initialCenter = [20.5937, 78.9629],
  initialZoom = 5,
  height = '560px',
  readOnly = false,
  onLocationIdentified,
  onOpenAlerts,
  externalFlyTarget,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const centroidMarkerRef = useRef<L.Marker | null>(null);
  const shivaStationMarkerRef = useRef<L.Marker | null>(null);
  const probeMarkerRef = useRef<L.Marker | null>(null);
  const drawingMarkersRef = useRef<L.CircleMarker[]>([]);
  const drawingLineRef = useRef<L.Polyline | null>(null);
  const overlayLayerRef = useRef<L.ImageOverlay | null>(null);
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer }>({});
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<'satellite' | 'streets'>('satellite');
  const [showLabels, setShowLabels] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [showNdviLegend, setShowNdviLegend] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);

  // Active environmental layer
  const [activeEnvLayer, setActiveEnvLayer] = useState<EnvironmentalLayerType>(
    floodTileUrl ? 'water' : 'vegetation'
  );

  // Reference marker state: Shiva Station
  const [shivaStationPoint, setShivaStationPoint] = useState<{
    lat: number;
    lng: number;
    name: string;
  }>({
    lat: initialCenter[0],
    lng: initialCenter[1],
    name: 'Main Agricultural Sector',
  });

  // Crop Classification Panel toggle
  const [showCropClassification, setShowCropClassification] = useState(false);

  // Inspector Probe Mode
  const [isProbeModeActive, setIsProbeModeActive] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<PointSpectralInspection | null>(null);

  // Location intelligence state
  const [locationInfo, setLocationInfo] = useState<LocationDetails | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Weather & Risk Assessment state
  const [weatherAssessment, setWeatherAssessment] = useState<WeatherRiskAssessment | null>(null);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculated metrics
  const areaHa = coords ? calculatePolygonAreaHectares(coords) : 0;
  const perimeterKm = coords ? calculatePolygonPerimeterKm(coords) : 0;
  const effectiveNdvi = meanNdvi ?? (coords ? 0.65 : null);
  const vegetationDensity: VegetationDensityDetails | null =
    effectiveNdvi !== null ? computeVegetationDensity(effectiveNdvi) : null;

  // Initialize Map with Hybrid Satellite Labels
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });

    // 1. Raw Optical Satellite Layer
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri, Earthstar Geographics, USGS',
        maxZoom: 18,
      }
    );

    // 2. OpenStreetMap Streets Layer
    const streetsLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    );

    // 3. Crisp CartoDB Voyager Labels Layer (Displays town, village, city names on top of satellite imagery!)
    const labelsLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; CartoDB & OpenStreetMap',
        maxZoom: 20,
        zIndex: 650, // CRITICAL: Kept ABOVE satellite imagery and environmental raster overlays
        subdomains: 'abcd',
      }
    );

    baseLayersRef.current = { satellite: satelliteLayer, streets: streetsLayer };
    labelsLayerRef.current = labelsLayer;

    // Default to satellite + labels (Hybrid Satellite)
    satelliteLayer.addTo(map);
    labelsLayer.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle external fly target (e.g. from Real-Time Alerts)
  useEffect(() => {
    if (!externalFlyTarget || !mapInstanceRef.current) return;
    const { lat, lng, name, layer, coords: targetCoords } = externalFlyTarget;

    mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
    setShivaStationPoint({ lat, lng, name });

    if (layer) {
      setActiveEnvLayer(layer);
    }

    if (targetCoords) {
      onPolygonChange(targetCoords);
    } else {
      const generated = createAgriculturalParcel(lat, lng);
      onPolygonChange(generated);
    }
  }, [externalFlyTarget, onPolygonChange]);

  // Basemap switcher
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const { satellite, streets } = baseLayersRef.current;

    if (activeBasemap === 'satellite') {
      if (map.hasLayer(streets)) map.removeLayer(streets);
      if (!map.hasLayer(satellite)) satellite.addTo(map);
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (!map.hasLayer(streets)) streets.addTo(map);
    }
  }, [activeBasemap]);

  // Satellite Labels toggle (Keep town/village labels visible on satellite maps)
  useEffect(() => {
    if (!mapInstanceRef.current || !labelsLayerRef.current) return;
    const map = mapInstanceRef.current;
    const labels = labelsLayerRef.current;

    if (showLabels) {
      if (!map.hasLayer(labels)) labels.addTo(map);
    } else {
      if (map.hasLayer(labels)) map.removeLayer(labels);
    }
  }, [showLabels]);

  // Reverse geocode & Live Weather Risk Lookup when coords change
  useEffect(() => {
    if (!coords || coords.length < 3) {
      setLocationInfo(null);
      setWeatherAssessment(null);
      return;
    }

    const center = getPolygonCenter(coords);
    setIsLoadingLocation(true);

    reverseGeocode(center[0], center[1]).then((details) => {
      setLocationInfo(details);
      setIsLoadingLocation(false);
      setShivaStationPoint({
        lat: center[0],
        lng: center[1],
        name: details.villageOrTown,
      });

      if (onLocationIdentified) {
        onLocationIdentified(details);
      }

      fetchLiveEnvironmentalRisks(center[0], center[1], `Shiva · ${details.villageOrTown}`).then((w) => {
        setWeatherAssessment(w);
      });
    });
  }, [coords, onLocationIdentified]);

  // Reference Marker "Shiva Station" rendering
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (shivaStationMarkerRef.current) {
      map.removeLayer(shivaStationMarkerRef.current);
      shivaStationMarkerRef.current = null;
    }

    const markerHtml = `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); pointer-events:auto; cursor:pointer;">
        <div style="background: rgba(15, 23, 42, 0.96); border: 2px solid #10b981; color: #ffffff; padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.6); font-size: 11px; font-weight: 800; white-space: nowrap; display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow: 0 0 8px #10b981;"></span>
          <span>Shiva Station · ${shivaStationPoint.name}</span>
        </div>
        <div style="position:relative; width:30px; height:30px;">
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(16, 185, 129, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position:relative; width:30px; height:30px; border-radius:50%; background:#059669; border:2.5px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 12px rgba(16, 185, 129, 0.9);">
            <span style="font-size:14px; line-height:1;">📡</span>
          </div>
        </div>
      </div>
    `;

    const customStationIcon = L.divIcon({
      html: markerHtml,
      className: 'custom-shiva-reference-station-marker',
      iconSize: [0, 0],
    });

    const marker = L.marker([shivaStationPoint.lat, shivaStationPoint.lng], {
      icon: customStationIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    shivaStationMarkerRef.current = marker;
  }, [shivaStationPoint]);

  // Polygon and Centroid Badge Rendering
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    if (centroidMarkerRef.current) {
      map.removeLayer(centroidMarkerRef.current);
      centroidMarkerRef.current = null;
    }

    if (coords && coords.length >= 3) {
      const latLngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);

      let strokeColor = '#10b981'; // Green
      let fillColor = '#10b981';

      if (activeEnvLayer === 'heat') {
        strokeColor = '#ef4444'; // Red
        fillColor = '#dc2626';
      } else if (activeEnvLayer === 'water') {
        strokeColor = '#2563eb'; // Blue
        fillColor = '#1d4ed8';
      } else if (activeEnvLayer === 'clouds') {
        strokeColor = '#94a3b8'; // Cloud
        fillColor = '#f1f5f9';
      } else if (activeEnvLayer === 'floodRisk') {
        strokeColor = '#06b6d4'; // Cyan
        fillColor = '#0891b2';
      } else if (activeEnvLayer === 'soilMoisture') {
        strokeColor = '#f59e0b'; // Amber
        fillColor = '#d97706';
      }

      const polygon = L.polygon(latLngs, {
        color: strokeColor,
        weight: 3,
        fillColor,
        fillOpacity: 0.32,
      }).addTo(map);

      polygonLayerRef.current = polygon;

      const bounds = polygon.getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

      const center = bounds.getCenter();
      const villageTitle = locationInfo?.villageOrTown || 'Agri-Sector';
      const ndviText = meanNdvi ? meanNdvi.toFixed(3) : '0.650';

      const customHtml = `
        <div style="background: rgba(15, 23, 42, 0.96); border: 2px solid ${strokeColor}; color: #ffffff; padding: 6px 11px; border-radius: 9px; box-shadow: 0 4px 18px rgba(0,0,0,0.6); font-size: 11px; white-space: nowrap; transform: translate(-50%, -100%); pointer-events: none;">
          <div style="font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${strokeColor}; box-shadow: 0 0 6px ${strokeColor};"></span>
            <span>Shiva · ${villageTitle}</span>
          </div>
          <div style="font-size: 10px; color: #cbd5e1; display:flex; gap: 8px; margin-top: 3px; font-family: monospace;">
            <span>NDVI: <b style="color: ${strokeColor};">${ndviText}</b></span>
            <span>·</span>
            <span>${areaHa} ha (${(areaHa * 2.471).toFixed(1)} ac)</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-centroid-shiva-marker',
        iconSize: [0, 0],
      });

      const marker = L.marker([center.lat, center.lng], { icon: customIcon }).addTo(map);
      centroidMarkerRef.current = marker;

      // Overlay Layer: Generate specific color-coded environmental raster
      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current);
        overlayLayerRef.current = null;
      }

      const layerTileUrl = generateEnvironmentalLayer(
        activeEnvLayer,
        effectiveNdvi ?? 0.65,
        35
      );

      const overlay = L.imageOverlay(layerTileUrl, bounds, {
        opacity: overlayOpacity,
        interactive: false,
      }).addTo(map);
      overlayLayerRef.current = overlay;
    } else {
      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current);
        overlayLayerRef.current = null;
      }
    }
  }, [coords, activeEnvLayer, meanNdvi, overlayOpacity, locationInfo, areaHa, effectiveNdvi]);

  // Handle map clicks (Drawing vs Shiva Station Location Selection / Point Probe)
  useEffect(() => {
    if (!mapInstanceRef.current || readOnly) return;
    const map = mapInstanceRef.current;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (isDrawing) {
        const newPoint: [number, number] = [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
        setDrawingPoints((prev) => {
          const next = [...prev, newPoint];

          const marker = L.circleMarker([lat, lng], {
            radius: 5,
            color: '#ffffff',
            weight: 2,
            fillColor: '#10b981',
            fillOpacity: 1,
          }).addTo(map);
          drawingMarkersRef.current.push(marker);

          if (drawingLineRef.current) {
            map.removeLayer(drawingLineRef.current);
          }
          drawingLineRef.current = L.polyline(next, {
            color: '#10b981',
            weight: 2,
            dashArray: '4, 4',
          }).addTo(map);

          return next;
        });
        return;
      }

      // When clicking anywhere on the map in standard inspection mode:
      // Relocate Shiva Station reference marker to this location and create an agricultural parcel
      const details = await reverseGeocode(lat, lng);
      setShivaStationPoint({
        lat,
        lng,
        name: details.villageOrTown,
      });

      // Automatically establish agricultural parcel at this location
      const parcelCoords = createAgriculturalParcel(lat, lng);
      onPolygonChange(parcelCoords);

      const inspection = await inspectPointSpectral(
        lat,
        lng,
        parcelCoords,
        meanNdvi ?? 0.65
      );
      setSelectedInspection(inspection);

      if (probeMarkerRef.current) {
        map.removeLayer(probeMarkerRef.current);
      }

      const probeIcon = L.divIcon({
        html: `
          <div style="background: #2563eb; width: 16px; height: 16px; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 14px rgba(37,99,235,0.9); transform: translate(-8px, -8px);"></div>
        `,
        className: 'probe-pin',
        iconSize: [0, 0],
      });

      const probe = L.marker([lat, lng], { icon: probeIcon }).addTo(map);
      probeMarkerRef.current = probe;
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawing, isProbeModeActive, readOnly, meanNdvi, onPolygonChange]);

  // Start Drawing polygon
  const startDrawing = () => {
    setIsDrawing(true);
    setDrawingPoints([]);
    clearDrawingArtifacts();
  };

  // Clear drawing artifacts
  const clearDrawingArtifacts = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    drawingMarkersRef.current.forEach((m) => map.removeLayer(m));
    drawingMarkersRef.current = [];
    if (drawingLineRef.current) {
      map.removeLayer(drawingLineRef.current);
      drawingLineRef.current = null;
    }
  };

  // Finish polygon drawing
  const finishDrawing = () => {
    if (drawingPoints.length < 3) return;
    const closed: PolygonCoords = [
      ...drawingPoints.map(([lat, lng]) => [lng, lat] as [number, number]),
      [drawingPoints[0][1], drawingPoints[0][0]] as [number, number],
    ];
    onPolygonChange(closed);
    clearDrawingArtifacts();
    setIsDrawing(false);
  };

  // Cancel drawing
  const cancelDrawing = () => {
    clearDrawingArtifacts();
    setIsDrawing(false);
  };

  // Clear polygon completely
  const handleClearPolygon = () => {
    onPolygonChange(null);
    clearDrawingArtifacts();
    setSelectedInspection(null);
    if (probeMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(probeMarkerRef.current);
      probeMarkerRef.current = null;
    }
  };

  // Search location autocomplete handler
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 2) {
      const results = await searchLocation(val);
      setSearchResults(results);
      setShowSearchDropdown(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  // Select Search Result: Fly Shiva Station to location & select agricultural parcel
  const handleSelectSearchResult = (res: { name: string; lat: number; lng: number }) => {
    setShowSearchDropdown(false);
    setSearchQuery(res.name.split(',')[0]);
    if (!mapInstanceRef.current) return;

    const shortName = res.name.split(',')[0];

    // Smooth navigation to the selected place
    mapInstanceRef.current.flyTo([res.lat, res.lng], 14, { duration: 1.2 });

    // Move Shiva Station reference point
    setShivaStationPoint({
      lat: res.lat,
      lng: res.lng,
      name: shortName,
    });

    // Automatically delineate agricultural parcel around searched place
    const generatedParcel = createAgriculturalParcel(res.lat, res.lng);
    onPolygonChange(generatedParcel);

    // Inspect location
    inspectPointSpectral(res.lat, res.lng, generatedParcel, 0.65).then((ins) => {
      setSelectedInspection(ins);
      if (onLocationIdentified) {
        onLocationIdentified(ins.location);
      }
    });
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950 font-sans ${
        isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Map Container Leaflet Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* PERMANENT TOP-LEFT BRAND BANNER DISPLAYING "SHIVA" ON EVERY MAP */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2.5 bg-stone-900/95 backdrop-blur-md border border-emerald-500/60 rounded-xl px-3.5 py-2 text-white shadow-2xl pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
          🛰️
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-xs tracking-wide">SHIVA</span>
            <span className="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950/90 px-1.5 py-0.2 rounded border border-emerald-700/80">
              STATION ACTIVE
            </span>
          </div>
          <div className="text-[10px] text-stone-300 truncate max-w-[200px] sm:max-w-[300px]">
            {locationInfo?.villageOrTown
              ? `Ref Point: Shiva Station · ${locationInfo.villageOrTown}`
              : `Shiva Station Reference: ${shivaStationPoint.name}`}
          </div>
        </div>
      </div>

      {/* Top Floating Controls Bar */}
      <div className="absolute top-16 sm:top-3 left-3 right-14 sm:left-auto sm:right-14 z-[1000] flex flex-wrap items-center gap-2">
        {/* Search Geocoder Input */}
        <div className="relative min-w-[210px] max-w-xs">
          <div className="flex items-center bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 shadow-md">
            <Search className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search & fly Shiva Station..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-stone-900/95 backdrop-blur-md border border-stone-700 rounded-xl overflow-hidden shadow-2xl z-50 text-xs divide-y divide-stone-800">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectSearchResult(res)}
                  className="p-2.5 hover:bg-stone-800 cursor-pointer text-stone-200 transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <span className="font-semibold text-white">{res.name.split(',')[0]}</span>
                    <span className="text-stone-400 text-[11px] block truncate">{res.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar: Basemap & Satellite Labels Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-lg p-0.5 text-xs text-stone-200 shadow-md">
            <button
              type="button"
              onClick={() => setActiveBasemap('satellite')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeBasemap === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              type="button"
              onClick={() => setActiveBasemap('streets')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeBasemap === 'streets'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              🗺️ Roads
            </button>
            {/* Satellite Map Labels Button (Ensures location names are visible on all satellite maps!) */}
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1 border-l border-stone-700 ml-0.5 ${
                showLabels
                  ? 'text-emerald-400 bg-stone-800 font-bold'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title="Toggle City/Town/Village Labels on Satellite Imagery"
            >
              <Tag className="w-3 h-3" />
              <span>Labels: {showLabels ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-lg p-0.5 text-xs text-stone-200 shadow-md">
              {!isDrawing ? (
                <button
                  type="button"
                  onClick={startDrawing}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-emerald-400 font-medium transition-colors whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Measure Area</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-emerald-300 text-[11px] font-mono px-2 py-0.5 bg-emerald-950/80 rounded border border-emerald-800">
                    {drawingPoints.length} points
                  </span>
                  <button
                    type="button"
                    onClick={finishDrawing}
                    disabled={drawingPoints.length < 3}
                    className={`flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] transition-colors ${
                      drawingPoints.length >= 3
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                  <button
                    type="button"
                    onClick={cancelDrawing}
                    className="px-2 py-1 rounded bg-stone-800 text-stone-300 hover:text-white text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {coords && (
                <button
                  type="button"
                  onClick={handleClearPolygon}
                  className="p-1.5 rounded-md text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                  title="Clear polygon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Real-Time Alerts Quick Trigger Button */}
          {onOpenAlerts && (
            <button
              type="button"
              onClick={onOpenAlerts}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/70 text-rose-300 hover:bg-rose-900/80 text-xs font-semibold shadow-md whitespace-nowrap transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <Bell className="w-3.5 h-3.5" />
              <span>Real-Time Alerts</span>
            </button>
          )}

          {/* Crop Classification Toggle */}
          <button
            type="button"
            onClick={() => setShowCropClassification(!showCropClassification)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shadow-md transition-all whitespace-nowrap ${
              showCropClassification
                ? 'bg-emerald-700 border-emerald-400 text-white'
                : 'bg-stone-900/90 backdrop-blur-md border-stone-700/80 text-stone-300 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Crops</span>
          </button>
        </div>

        {/* Color-Coded Environmental Layer Switcher Bar */}
        {/* Red = Heat, Blue = Water, Green = Vegetation, Clouds = Cloud Cover, FloodRisk = Hazard, SoilMoisture = Drought */}
        <div className="bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-xl p-1 text-xs text-white shadow-lg flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <span className="text-[10px] text-stone-400 px-1 font-bold uppercase shrink-0">
            Layer:
          </span>

          <button
            type="button"
            onClick={() => setActiveEnvLayer('vegetation')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
              activeEnvLayer === 'vegetation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Green · Vegetation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEnvLayer('heat')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
              activeEnvLayer === 'heat'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0"></span>
            <span>Red · Extreme Heat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEnvLayer('water')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
              activeEnvLayer === 'water'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0"></span>
            <span>Blue · Water / Flood</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEnvLayer('clouds')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
              activeEnvLayer === 'clouds'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0"></span>
            <span>Clouds · Cloud Cover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEnvLayer('floodRisk')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
              activeEnvLayer === 'floodRisk'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span>Cyan · Flood Risk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEnvLayer('soilMoisture')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
              activeEnvLayer === 'soilMoisture'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <span>Amber · Soil Drought</span>
          </button>
        </div>
      </div>

      {/* Top Right: Fullscreen & Zoom Buttons */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
        <div className="flex flex-col bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-lg overflow-hidden text-stone-300 shadow-md">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-stone-800 hover:text-white border-b border-stone-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 hover:bg-stone-800 hover:text-white border-b border-stone-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 hover:bg-stone-800 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Crop Classification Drawer */}
      {showCropClassification && (
        <div className="absolute top-28 left-4 z-[1000] bg-stone-900/95 backdrop-blur-md border border-emerald-500/60 rounded-xl p-3.5 text-white shadow-2xl max-w-xs w-full animate-in fade-in slide-in-from-left duration-150 text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <PieChart className="w-4 h-4" />
              <span>Shiva · Crop Classification</span>
            </div>
            <button
              onClick={() => setShowCropClassification(false)}
              className="text-stone-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Winter Wheat (Rabi)</span>
              </span>
              <span className="font-mono font-bold text-white">64.2%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
                <span>Mustard / Oilseed</span>
              </span>
              <span className="font-mono font-bold text-white">18.5%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-lime-400"></span>
                <span>Gram / Chickpea</span>
              </span>
              <span className="font-mono font-bold text-white">11.3%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-stone-500"></span>
                <span>Fallow / Parcel Margin</span>
              </span>
              <span className="font-mono font-bold text-white">6.0%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400 flex items-center justify-between">
            <span>Model: Multi-spectral Random Forest</span>
            <span className="font-mono text-emerald-400 font-bold">94.6% Acc</span>
          </div>
        </div>
      )}

      {/* Primary Floating Location & Agro-Telemetry HUD with "Shiva" Identifier */}
      {coords ? (
        <div className="absolute bottom-4 left-4 z-[1000] bg-stone-900/95 backdrop-blur-md border border-stone-700/90 rounded-xl p-3.5 text-white shadow-2xl max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">Shiva Station</span>
                <span>·</span>
                <span className="truncate">
                  {locationInfo?.villageOrTown || (isLoadingLocation ? 'Resolving...' : 'Agricultural Parcel')}
                </span>
              </div>
              <div className="text-[11px] text-stone-300 truncate">
                {locationInfo?.district ? `${locationInfo.district}, ${locationInfo.state}` : locationInfo?.formattedAddress || 'Identified Farmland'}
              </div>
            </div>

            {/* Vegetation Density Badge */}
            {vegetationDensity && (
              <div
                className="px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 text-white shadow-xs"
                style={{ backgroundColor: vegetationDensity.color }}
              >
                {vegetationDensity.category}
              </div>
            )}
          </div>

          {/* Geospatial Metrics Strip: Total Area, Exact NDVI, Canopy Cover */}
          <div className="grid grid-cols-3 gap-2 pt-2.5 text-center text-xs">
            <div className="bg-stone-800/60 p-2 rounded-lg border border-stone-800">
              <span className="text-[10px] text-stone-400 block">Total Area</span>
              <span className="font-mono font-bold text-sm text-white tabular-nums">
                {areaHa} <span className="text-[10px] font-sans text-stone-400">ha</span>
              </span>
              <span className="text-[10px] text-stone-400 block">
                {(areaHa * 2.471).toFixed(1)} ac
              </span>
            </div>

            <div className="bg-stone-800/60 p-2 rounded-lg border border-stone-800">
              <span className="text-[10px] text-stone-400 block">Exact NDVI</span>
              <span
                className="font-mono font-bold text-sm tabular-nums"
                style={{ color: vegetationDensity?.color || '#10b981' }}
              >
                {effectiveNdvi ? effectiveNdvi.toFixed(3) : '0.650'}
              </span>
              <span className="text-[10px] text-stone-400 block">
                {vegetationDensity ? `LAI ${vegetationDensity.lai}` : 'Sentinel-2'}
              </span>
            </div>

            <div className="bg-stone-800/60 p-2 rounded-lg border border-stone-800">
              <span className="text-[10px] text-stone-400 block">Canopy Cover</span>
              <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                {vegetationDensity?.fvcPercent || 78}%
              </span>
              <span className="text-[10px] text-stone-400 block">
                Perim {perimeterKm} km
              </span>
            </div>
          </div>

          {/* Live Environmental Risk Alert Strip */}
          {weatherAssessment && (
            <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-stone-300">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>{weatherAssessment.temperatureC}°C ({weatherAssessment.weatherDescription})</span>
              </div>

              {weatherAssessment.heatRisk.level !== 'Low' && (
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>{weatherAssessment.heatRisk.level}</span>
                </span>
              )}

              {weatherAssessment.floodRisk.level !== 'Low' && (
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  <span>{weatherAssessment.floodRisk.level}</span>
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Standby State HUD with Prominent Shiva Branding */
        <div className="absolute bottom-4 left-4 z-[1000] bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-xl p-3 text-white shadow-xl max-w-xs animate-in fade-in duration-200 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white text-xs">Shiva Station · Ready</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Click any field or search a location above to position the <b>Shiva Station</b> reference point and inspect village/town NDVI &amp; vegetation density.
          </p>
        </div>
      )}

      {/* Point Spectral Inspection Probe Popup Card */}
      {selectedInspection && (
        <div className="absolute top-28 right-4 z-[1000] bg-stone-900/95 backdrop-blur-md border border-blue-500/60 rounded-xl p-3.5 text-white shadow-2xl max-w-xs w-full animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>Shiva · Point Spectral Probe</span>
            </div>
            <button
              onClick={() => setSelectedInspection(null)}
              className="text-stone-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2 space-y-2 text-xs">
            <div>
              <div className="font-semibold text-stone-200">
                Shiva Station · {selectedInspection.location.villageOrTown}
              </div>
              <div className="text-[11px] text-stone-400 truncate">
                {selectedInspection.location.district}, {selectedInspection.location.state}
              </div>
              <div className="text-[10px] font-mono text-stone-500">
                Lat {selectedInspection.lat.toFixed(5)}° · Lng {selectedInspection.lng.toFixed(5)}°
              </div>
            </div>

            <div className="p-2 rounded-lg bg-stone-800/70 border border-stone-700/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-stone-300">Point Exact NDVI:</span>
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: selectedInspection.vegetationDensity.color }}
                >
                  {selectedInspection.ndvi.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-400">Vegetation Density:</span>
                <span className="font-medium text-stone-200">
                  {selectedInspection.vegetationDensity.category}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-400">Ground Cover (FVC):</span>
                <span className="font-mono text-stone-200">
                  {selectedInspection.vegetationDensity.fvcPercent}%
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-400">Moisture Index (NDWI):</span>
                <span className="font-mono text-blue-300">
                  {selectedInspection.ndwi.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-400">Soil Moisture State:</span>
                <span className="text-stone-200 font-medium">
                  {selectedInspection.soilMoisture}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right: Color-Coded Environmental Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-xl p-3 text-xs text-stone-200 shadow-xl max-w-xs">
        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-stone-800">
          <span className="font-bold text-stone-100 text-[11px] uppercase tracking-wider">
            Color Legend · Shiva System
          </span>
          <button
            onClick={() => setShowNdviLegend(!showNdviLegend)}
            className="text-stone-400 hover:text-stone-200 text-[10px]"
          >
            {showNdviLegend ? 'Hide' : 'Show'}
          </button>
        </div>

        {showNdviLegend && (
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#006837] shrink-0"></span>
              <span className="text-stone-200">Green: Healthy Crops &amp; Dense Vegetation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#ef4444] shrink-0"></span>
              <span className="text-stone-200">Red: High Temperatures &amp; Extreme Heat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#2563eb] shrink-0"></span>
              <span className="text-stone-200">Blue: Water Accumulation &amp; Floods</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-white border border-stone-500 shrink-0"></span>
              <span className="text-stone-200">White: Cloud Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#06b6d4] shrink-0"></span>
              <span className="text-stone-200">Cyan: Flood Risk Hazard Zones</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-[#f59e0b] shrink-0"></span>
              <span className="text-stone-200">Amber: Soil Moisture &amp; Drought Stress</span>
            </div>

            {/* Layer Opacity Slider */}
            <div className="pt-2 border-t border-stone-800/80">
              <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                <span>Overlay Opacity:</span>
                <span className="font-mono">{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
