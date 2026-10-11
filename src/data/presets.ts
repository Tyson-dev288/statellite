import { PresetRegion } from '../types';

export const PRESET_REGIONS: PresetRegion[] = [
  {
    id: 'kerala-kuttanad-2018',
    name: 'Kuttanad Rice Polder (Kerala 2018 Flood)',
    location: 'Alappuzha, Kerala, India',
    crop: 'Paddy / Wetland Rice',
    center: [9.498, 76.432],
    zoom: 13,
    description: 'Below sea-level polder farming system inundated during the catastrophic August 2018 Kerala floods.',
    coords: [
      [76.415, 9.510],
      [76.448, 9.512],
      [76.452, 9.485],
      [76.420, 9.482],
      [76.415, 9.510]
    ],
    historicalEvent: {
      type: 'flood',
      dates: {
        beforeStart: '2018-07-01',
        beforeEnd: '2018-07-20',
        afterStart: '2018-08-15',
        afterEnd: '2018-08-25',
      },
      expectedOutcome: 'Catastrophic inundation (~65% cropland flooded) verified against Copernicus EMS EMSR301.'
    }
  },
  {
    id: 'punjab-ludhiana-wheat',
    name: 'Ludhiana Precision Wheat Belt',
    location: 'Punjab, India',
    crop: 'Winter Wheat (Rabi Season)',
    center: [30.901, 75.857],
    zoom: 14,
    description: 'High-yield intensively irrigated agricultural fields during peak vegetative canopy stage.',
    coords: [
      [75.845, 30.912],
      [75.875, 30.914],
      [75.878, 30.890],
      [75.842, 30.888],
      [75.845, 30.912]
    ],
    historicalEvent: {
      type: 'healthy_season',
      dates: {
        cropStart: '2025-01-01',
        cropEnd: '2025-03-15',
      },
      expectedOutcome: 'Peak vegetative vigor with mean NDVI > 0.72 and optimal canopy biomass.'
    }
  },
  {
    id: 'chennai-cooum-2023',
    name: 'Chennai Agri-Basin (Cyclone Michaung 2023)',
    location: 'Thiruvallur / Chennai, India',
    crop: 'Horticulture & Paddy',
    center: [13.082, 80.124],
    zoom: 13,
    description: 'Severe agricultural and peri-urban waterlogging following intense rainfall from Cyclone Michaung.',
    coords: [
      [80.105, 13.095],
      [80.145, 13.098],
      [80.148, 13.068],
      [80.102, 13.065],
      [80.105, 13.095]
    ],
    historicalEvent: {
      type: 'flood',
      dates: {
        beforeStart: '2023-11-15',
        beforeEnd: '2023-11-28',
        afterStart: '2023-12-04',
        afterEnd: '2023-12-14',
      },
      expectedOutcome: 'Heavy water ponding with ~42% cropland inundated across low-lying floodplains.'
    }
  },
  {
    id: 'california-central-valley-drought',
    name: 'San Joaquin Valley Orchard (Drought Anomaly)',
    location: 'Fresno County, California, USA',
    crop: 'Almonds & Stone Fruit',
    center: [36.746, -119.772],
    zoom: 14,
    description: 'Persistent severe drought anomaly with critical groundwater drawdown and heat stress.',
    coords: [
      [-119.785, 36.758],
      [-119.755, 36.760],
      [-119.752, 36.732],
      [-119.788, 36.730],
      [-119.785, 36.758]
    ],
    historicalEvent: {
      type: 'drought',
      dates: {
        cropStart: '2024-06-01',
        cropEnd: '2024-08-31',
      },
      expectedOutcome: 'High negative z-score (-2.2) indicating severe moisture and evapotranspiration deficit.'
    }
  },
  {
    id: 'cauvery-delta-thanjavur',
    name: 'Cauvery River Delta Paddy',
    location: 'Thanjavur, Tamil Nadu, India',
    crop: 'Samba Paddy',
    center: [10.787, 79.137],
    zoom: 14,
    description: 'Traditional granary of South India with canal-fed paddy cultivation and seasonal water fluctuations.',
    coords: [
      [79.120, 10.798],
      [79.155, 10.801],
      [79.158, 10.772],
      [79.118, 10.770],
      [79.120, 10.798]
    ],
    historicalEvent: {
      type: 'healthy_season',
      dates: {
        cropStart: '2024-10-01',
        cropEnd: '2024-12-31',
      },
      expectedOutcome: 'Strong NDVI response in irrigated paddy with high NDWI surface moisture.'
    }
  }
];
