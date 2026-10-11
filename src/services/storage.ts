import { SavedField, AnalysisRecord, PolygonCoords } from '../types';
import { PRESET_REGIONS } from '../data/presets';

const STORAGE_KEY_FIELDS = 'cropsense_fields_v3';
const STORAGE_KEY_ANALYSES = 'cropsense_analyses_v3';
const STORAGE_KEY_USER = 'cropsense_user_v3';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  organization: string;
  role: string;
}

const DEFAULT_USER: UserProfile = {
  uid: 'usr-shiva-agritech-01',
  displayName: 'Shiva',
  email: 'ps0242237@gmail.com',
  organization: 'Shiva Agricultural Intelligence Station',
  role: 'Satellite Monitoring Lead'
};

const INITIAL_FIELDS: SavedField[] = [
  {
    id: 'field-punjab-01',
    name: 'Shiva Ludhiana Sector 4B',
    cropType: 'Winter Wheat',
    areaHectares: 76.4,
    coords: PRESET_REGIONS[1].coords,
    sowingDate: '2024-11-15',
    lastAnalyzed: '2025-02-18',
    lastNdvi: 0.742,
    healthStatus: 'Healthy',
    locationName: 'Ludhiana, Punjab',
    locationDetails: {
      villageOrTown: 'Ludhiana',
      suburbOrLocality: 'PAU Agricultural Zone',
      district: 'Ludhiana District',
      state: 'Punjab',
      country: 'India',
      formattedAddress: 'Ludhiana Agricultural Belt, Punjab, India',
      agroZone: 'Trans-Gangetic Plains Agro-Climatic Zone (VI)',
      elevationMeters: 244,
      coordinates: { lat: 30.901, lng: 75.857 },
    },
    notes: 'Well-drained alluvial soil with precision drip fertigation. Monitored under Shiva Station.'
  },
  {
    id: 'field-kerala-02',
    name: 'Shiva Kuttanad Polder',
    cropType: 'Wetland Rice (Paddy)',
    areaHectares: 114.2,
    coords: PRESET_REGIONS[0].coords,
    sowingDate: '2024-06-10',
    lastAnalyzed: '2024-08-20',
    lastNdvi: 0.28,
    healthStatus: 'Severely stressed',
    locationName: 'Alappuzha, Kerala',
    locationDetails: {
      villageOrTown: 'Kuttanad',
      suburbOrLocality: 'Champakulam Polder Basin',
      district: 'Alappuzha District',
      state: 'Kerala',
      country: 'India',
      formattedAddress: 'Kuttanad Wetland Polder, Alappuzha, Kerala, India',
      agroZone: 'West Coast Plains & Below Sea-Level Agricultural System',
      elevationMeters: -1.5,
      coordinates: { lat: 9.498, lng: 76.432 },
    },
    notes: 'Submerged polder basin; subject to monsoon flood surges.'
  },
  {
    id: 'field-cauvery-03',
    name: 'Shiva Thanjavur Canal Plot',
    cropType: 'Samba Paddy',
    areaHectares: 48.9,
    coords: PRESET_REGIONS[4].coords,
    sowingDate: '2024-09-20',
    lastAnalyzed: '2024-12-05',
    lastNdvi: 0.62,
    healthStatus: 'Healthy',
    locationName: 'Thanjavur, Tamil Nadu',
    locationDetails: {
      villageOrTown: 'Thanjavur',
      suburbOrLocality: 'Cauvery River Delta Canal Basin',
      district: 'Thanjavur District',
      state: 'Tamil Nadu',
      country: 'India',
      formattedAddress: 'Cauvery Delta Rice Bowl, Thanjavur, Tamil Nadu, India',
      agroZone: 'Southern Plateau & Hills Region - Deltaic Alluvium',
      elevationMeters: 57,
      coordinates: { lat: 10.787, lng: 79.137 },
    },
    notes: 'Canal-irrigated plot, optimal water table.'
  }
];

const INITIAL_ANALYSES: AnalysisRecord[] = [
  {
    id: 'an-001',
    uid: 'usr-shiva-agritech-01',
    type: 'crop',
    title: 'Shiva · Peak Vegetative Vigor & Density Assessment',
    fieldName: 'Shiva Ludhiana Sector 4B',
    locationName: 'Shiva · Ludhiana, Punjab',
    createdAt: '2025-02-18T10:30:00Z',
    coords: PRESET_REGIONS[1].coords,
    summary: 'Exact NDVI 0.742 (Very Dense Canopy) indicates excellent canopy density and optimal nitrogen levels across 76.4 ha.',
    details: {
      ndvi: 0.742,
      health: 'Healthy',
      zScore: 0.62,
      vegetationDensity: 'Very Dense Canopy',
    }
  },
  {
    id: 'an-002',
    uid: 'usr-shiva-agritech-01',
    type: 'flood',
    title: 'Shiva · Monsoon Flood Damage Inundation Report',
    fieldName: 'Shiva Kuttanad Polder',
    locationName: 'Shiva · Kuttanad, Alappuzha',
    createdAt: '2024-08-20T14:15:00Z',
    coords: PRESET_REGIONS[0].coords,
    summary: 'Sentinel-1 SAR analysis detected 73.3 ha (64.2%) inundated farmland across 114.2 ha.',
    details: {
      floodedHa: 73.3,
      percentFlooded: 64.2
    }
  },
  {
    id: 'an-003',
    uid: 'usr-shiva-agritech-01',
    type: 'drought',
    title: 'Shiva · Orchard Moisture Anomaly Check',
    fieldName: 'Shiva San Joaquin Valley Orchard',
    locationName: 'Shiva · Fresno, California',
    createdAt: '2024-07-28T09:40:00Z',
    coords: PRESET_REGIONS[3].coords,
    summary: 'Severe drought stress anomaly detected (Z-score -2.35) with exact NDVI 0.320 (Sparse Vegetation).',
    details: {
      droughtStatus: 'Severe drought stress',
      zScore: -2.35,
      ndvi: 0.32,
      vegetationDensity: 'Sparse Vegetation',
    }
  }
];

export function getUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_USER;
}

export function setUser(user: UserProfile) {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export function getSavedFields(): SavedField[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIELDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(INITIAL_FIELDS));
  return INITIAL_FIELDS;
}

export function saveField(field: Omit<SavedField, 'id'>): SavedField {
  const fields = getSavedFields();
  const newField: SavedField = {
    ...field,
    id: `field-${Date.now()}`
  };
  const updated = [newField, ...fields];
  localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(updated));
  return newField;
}

export function updateField(id: string, updates: Partial<SavedField>): SavedField[] {
  const fields = getSavedFields();
  const updated = fields.map((f) => (f.id === id ? { ...f, ...updates } : f));
  localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(updated));
  return updated;
}

export function deleteField(id: string): SavedField[] {
  const fields = getSavedFields();
  const updated = fields.filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(updated));
  return updated;
}

export function getAnalyses(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANALYSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(INITIAL_ANALYSES));
  return INITIAL_ANALYSES;
}

export function recordAnalysis(analysis: Omit<AnalysisRecord, 'id' | 'createdAt'>): AnalysisRecord {
  const records = getAnalyses();
  const newRecord: AnalysisRecord = {
    ...analysis,
    id: `an-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  const updated = [newRecord, ...records];
  localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(updated));
  return newRecord;
}

export function deleteAnalysis(id: string): AnalysisRecord[] {
  const records = getAnalyses();
  const updated = records.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(updated));
  return updated;
}
