import { LocationDetails } from './services/geocoding';

export type PolygonCoords = [number, number][]; // [lng, lat] pairs

export interface VegetationDensityDetails {
  category: 'Very Dense Canopy' | 'Dense Canopy' | 'Moderate Density' | 'Sparse Vegetation' | 'Barren Soil / Water';
  ndviValue: number;
  fvcPercent: number; // Fractional Vegetation Cover 0-100%
  lai: number; // Leaf Area Index m²/m²
  chlorophyllLevel: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Negligible';
  color: string;
  description: string;
}

export interface PointSpectralInspection {
  lat: number;
  lng: number;
  ndvi: number;
  ndwi: number;
  vegetationDensity: VegetationDensityDetails;
  location: LocationDetails;
  bands: {
    b2Blue: number;
    b3Green: number;
    b4Red: number;
    b8Nir: number;
  };
  soilMoisture: 'Saturated' | 'Optimal Moisture' | 'Moderate Deficit' | 'Critical Drought';
}

export interface NDVIResult {
  tile_url?: string;
  mean_ndvi: number;
  min_ndvi: number;
  max_ndvi: number;
  std_dev: number;
  cloud_cover_percent: number;
  acquisition_date: string;
  vegetationDensity: VegetationDensityDetails;
  location?: LocationDetails;
}

export interface TimeSeriesPoint {
  date: string;
  ndvi: number;
  baseline_mean?: number;
  rainfall_mm?: number;
  temp_c?: number;
}

export interface DroughtResult {
  current_ndvi: number;
  historical_mean: number;
  z_score: number;
  status: 'Normal' | 'Moderate drought stress' | 'Severe drought stress';
  percentile: number;
  precip_deficit_percent: number;
  advice: string;
  location?: LocationDetails;
}

export interface FloodResult {
  tile_url?: string;
  flooded_hectares: number;
  cropland_flooded_hectares: number;
  total_hectares: number;
  percent_flooded: number;
  severity: 'Low (<10%)' | 'Moderate (10-30%)' | 'Severe (>30%)';
  backscatter_drop_db: number;
  confidence: number;
  water_depth_estimate_m?: number;
  location?: LocationDetails;
}

export interface HealthClassification {
  label: 'Healthy' | 'Stressed' | 'Severely stressed';
  confidence: number;
  advice: string;
  urgency: 'Low' | 'Medium' | 'High';
  features: {
    ndvi: number;
    ndwi: number;
    rain: number;
    temp: number;
  };
  recommendations: string[];
}

export interface SavedField {
  id: string;
  name: string;
  cropType: string;
  areaHectares: number;
  coords: PolygonCoords;
  sowingDate: string;
  lastAnalyzed?: string;
  lastNdvi?: number;
  healthStatus?: 'Healthy' | 'Stressed' | 'Severely stressed';
  locationName: string;
  locationDetails?: LocationDetails;
  notes?: string;
}

export interface AnalysisRecord {
  id: string;
  uid: string;
  type: 'crop' | 'flood' | 'drought';
  title: string;
  fieldName?: string;
  createdAt: string;
  coords: PolygonCoords;
  summary: string;
  locationName?: string;
  details: {
    ndvi?: number;
    health?: string;
    floodedHa?: number;
    percentFlooded?: number;
    droughtStatus?: string;
    zScore?: number;
    tileUrl?: string;
    vegetationDensity?: string;
  };
}

export interface PresetRegion {
  id: string;
  name: string;
  location: string;
  crop: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  coords: PolygonCoords;
  description: string;
  historicalEvent?: {
    type: 'flood' | 'drought' | 'healthy_season';
    dates: {
      beforeStart?: string;
      beforeEnd?: string;
      afterStart?: string;
      afterEnd?: string;
      cropStart?: string;
      cropEnd?: string;
    };
    expectedOutcome: string;
  };
}
