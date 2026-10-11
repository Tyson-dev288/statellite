import { PolygonCoords } from '../types';

export interface RealTimeHazardAlert {
  id: string;
  type: 'heat' | 'flood' | 'weather' | 'drought';
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  title: string;
  locationName: string;
  villageOrTown: string;
  district: string;
  state: string;
  coordinates: [number, number]; // [lat, lng]
  timestamp: string;
  metrics: {
    temp?: number;
    rainfall?: number;
    ndvi?: number;
    windSpeed?: number;
    hazardIndex?: string;
  };
  recommendedLayer: 'heat' | 'water' | 'vegetation' | 'floodRisk' | 'soilMoisture';
  description: string;
  actionRequired: string;
  suggestedPolygon?: PolygonCoords;
}

// Preset verified real-time hazard stream
export const INITIAL_REALTIME_ALERTS: RealTimeHazardAlert[] = [
  {
    id: 'alert-heat-ludhiana',
    type: 'heat',
    severity: 'CRITICAL',
    title: 'Extreme Heatwave Anomaly (>39°C) · Canopy Desiccation Risk',
    locationName: 'Shiva Station · Ludhiana PAU Wheat Sector',
    villageOrTown: 'Ludhiana',
    district: 'Ludhiana District',
    state: 'Punjab',
    coordinates: [30.901, 75.857],
    timestamp: 'Live · 2m ago',
    metrics: {
      temp: 39.4,
      ndvi: 0.74,
      hazardIndex: 'Thermal Stress Index: 8.8/10',
    },
    recommendedLayer: 'heat',
    description: 'High surface temperature thermal infrared anomaly detected by satellite telemetry. Severe risk of accelerated canopy evapotranspiration and leaf scorch.',
    actionRequired: 'Initiate supplemental pre-dawn sprinkler cooling irrigation and apply foliar potassium anti-transpirant.',
    suggestedPolygon: [
      [75.845, 30.912],
      [75.875, 30.914],
      [75.878, 30.890],
      [75.842, 30.888],
      [75.845, 30.912],
    ],
  },
  {
    id: 'alert-flood-kuttanad',
    type: 'flood',
    severity: 'CRITICAL',
    title: 'Severe Hydrological Inundation · Radar Backscatter Drop',
    locationName: 'Shiva Station · Kuttanad Polder Delta',
    villageOrTown: 'Kuttanad',
    district: 'Alappuzha District',
    state: 'Kerala',
    coordinates: [9.498, 76.432],
    timestamp: 'Live · 5m ago',
    metrics: {
      rainfall: 82.5,
      hazardIndex: 'SAR Inundation: 64.2% Area Flooded',
    },
    recommendedLayer: 'water',
    description: 'Sentinel-1 SAR C-Band backscatter dropped below -15 dB across lowland paddies. High water accumulation and waterlogging threatening standing crops.',
    actionRequired: 'Activate polder drainage pumping stations and erect earthen flood containment bunds immediately.',
    suggestedPolygon: [
      [76.415, 9.510],
      [76.448, 9.512],
      [76.452, 9.485],
      [76.420, 9.482],
      [76.415, 9.510],
    ],
  },
  {
    id: 'alert-storm-chennai',
    type: 'weather',
    severity: 'WARNING',
    title: 'Intense Cyclonic Precipitation & Water Ponding Alert',
    locationName: 'Shiva Station · Thiruvallur Agri-Basin',
    villageOrTown: 'Thiruvallur',
    district: 'Thiruvallur District',
    state: 'Tamil Nadu',
    coordinates: [13.082, 80.124],
    timestamp: 'Live · 12m ago',
    metrics: {
      rainfall: 48.0,
      windSpeed: 44.0,
      hazardIndex: 'Soil Waterlogging Threat: Moderate',
    },
    recommendedLayer: 'floodRisk',
    description: 'Intense localized thunderstorm cell causing rapid surface water runoff and low-lying field accumulation.',
    actionRequired: 'Clear field boundary drainage furrows to prevent root zone suffocation in horticultural tracts.',
    suggestedPolygon: [
      [80.105, 13.095],
      [80.145, 13.098],
      [80.148, 13.068],
      [80.102, 13.065],
      [80.105, 13.095],
    ],
  },
  {
    id: 'alert-drought-fresno',
    type: 'drought',
    severity: 'WARNING',
    title: 'Severe Climatological Soil Moisture Anomaly (Z = -2.35)',
    locationName: 'Shiva Station · San Joaquin Orchard Holding',
    villageOrTown: 'Fresno',
    district: 'Fresno County',
    state: 'California',
    coordinates: [36.746, -119.772],
    timestamp: 'Live · 24m ago',
    metrics: {
      ndvi: 0.32,
      hazardIndex: 'Root Zone Moisture Deficit: 54%',
    },
    recommendedLayer: 'soilMoisture',
    description: 'Multispectral moisture index (NDWI < -0.28) and 5-year climatological baseline comparison confirms severe vegetative drought.',
    actionRequired: 'Shift to regulated deficit drip irrigation scheduling and inspect deep soil moisture sensors.',
    suggestedPolygon: [
      [-119.785, 36.758],
      [-119.755, 36.760],
      [-119.752, 36.732],
      [-119.788, 36.730],
      [-119.785, 36.758],
    ],
  },
];
