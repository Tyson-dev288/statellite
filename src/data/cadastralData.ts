// Cadastral Plot Information and Seasonal Intelligence Data
// Matches the SPARC Land & Crop Intelligence GIS specifications from the reference images

export interface CadastralPlot {
  slNo: number;
  plotNo: string;
  cropName: string;
  cropColor: string;
  dataStatus: 'Complete' | 'Verified' | 'Pending';
  arablePlots: number;
  nonArablePlots: number;
  arableAreaAcres: number;
  nonArableAreaAcres: number;
  sownPlots: number;
  sownAcres: number;
  seasonRabiAcres: number;
  seasonKharifAcres: number;
  ndvi: number;
  soilMoisture: string;
  farmerName: string;
}

export interface VillageIntelligence {
  districtName: string;
  tehsilName: string;
  villageName: string;
  totalPlots: number;
  totalAreaAcres: number;
  totalAreaHectares: number;
  arablePlots: number;
  arableAcres: number;
  nonArablePlots: number;
  nonArableAcres: number;
  rabiSownPlots: number;
  rabiSownAcres: number;
  kharifSownPlots: number;
  kharifSownAcres: number;
  cropDistribution: Array<{
    crop: string;
    percentage: number;
    plots: number;
    acres: number;
    color: string;
  }>;
  plots: CadastralPlot[];
}

export const CROP_PALETTE: { [key: string]: string } = {
  Rice: '#3b82f6', // Blue
  Maize: '#eab308', // Yellow
  Soybean: '#84cc16', // Light Green
  Wheat: '#d97706', // Amber / Golden
  Cashew: '#f97316', // Orange
  Millets: '#a855f7', // Purple
  Eucalyptus: '#10b981', // Emerald
  Mango: '#fbbf24', // Yellow-amber
  Sugarcane: '#06b6d4', // Cyan
  Vegetables: '#22c55e', // Green
  Fallow: '#94a3b8', // Gray
};

export const VILLAGE_REGIONS_DATA: { [key: string]: VillageIntelligence } = {
  'kundra-pujariput': {
    districtName: 'Koraput',
    tehsilName: 'Kundra',
    villageName: 'Pujariput',
    totalPlots: 93,
    totalAreaAcres: 26.15,
    totalAreaHectares: 10.58,
    arablePlots: 85,
    arableAcres: 25.64,
    nonArablePlots: 8,
    nonArableAcres: 0.53,
    rabiSownPlots: 85,
    rabiSownAcres: 63.31,
    kharifSownPlots: 85,
    kharifSownAcres: 63.31,
    cropDistribution: [
      { crop: 'Rice', percentage: 42, plots: 39, acres: 10.98, color: '#3b82f6' },
      { crop: 'Maize', percentage: 28, plots: 26, acres: 7.32, color: '#eab308' },
      { crop: 'Cashew', percentage: 14, plots: 13, acres: 3.66, color: '#f97316' },
      { crop: 'Millets', percentage: 10, plots: 9, acres: 2.62, color: '#a855f7' },
      { crop: 'Eucalyptus', percentage: 6, plots: 6, acres: 1.57, color: '#10b981' },
    ],
    plots: [
      {
        slNo: 1,
        plotNo: '0813073-2115',
        cropName: 'Maize',
        cropColor: '#eab308',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 0.85,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 0.85,
        seasonRabiAcres: 0.85,
        seasonKharifAcres: 0.85,
        ndvi: 0.72,
        soilMoisture: 'Optimal (26%)',
        farmerName: 'Shiva Agro Holdings (Sector 1)',
      },
      {
        slNo: 2,
        plotNo: '0813073-2116',
        cropName: 'Rice',
        cropColor: '#3b82f6',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 0.61,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 0.61,
        seasonRabiAcres: 0.0,
        seasonKharifAcres: 0.61,
        ndvi: 0.68,
        soilMoisture: 'Saturated (34%)',
        farmerName: 'Shiva Agro Holdings (Sector 2)',
      },
      {
        slNo: 3,
        plotNo: '0813073-2335',
        cropName: 'Rice',
        cropColor: '#3b82f6',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 0.41,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 0.41,
        seasonRabiAcres: 0.41,
        seasonKharifAcres: 0.41,
        ndvi: 0.74,
        soilMoisture: 'Optimal (28%)',
        farmerName: 'Shiva Agro Holdings (Sector 3)',
      },
      {
        slNo: 4,
        plotNo: '0813073-2336',
        cropName: 'Rice',
        cropColor: '#3b82f6',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 0.29,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 0.29,
        seasonRabiAcres: 0.0,
        seasonKharifAcres: 0.29,
        ndvi: 0.65,
        soilMoisture: 'Optimal (25%)',
        farmerName: 'Shiva Agro Holdings (Sector 4)',
      },
      {
        slNo: 5,
        plotNo: '0813073-2227',
        cropName: 'Maize',
        cropColor: '#eab308',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 0.39,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 0.39,
        seasonRabiAcres: 0.39,
        seasonKharifAcres: 0.39,
        ndvi: 0.71,
        soilMoisture: 'Optimal (27%)',
        farmerName: 'Shiva Agro Holdings (Sector 5)',
      },
      {
        slNo: 6,
        plotNo: '0813073-2410',
        cropName: 'Cashew',
        cropColor: '#f97316',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 1.15,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 1.15,
        seasonRabiAcres: 1.15,
        seasonKharifAcres: 1.15,
        ndvi: 0.63,
        soilMoisture: 'Moderate Deficit (18%)',
        farmerName: 'Shiva Agro Holdings (Sector 6)',
      },
      {
        slNo: 7,
        plotNo: '0813073-2415',
        cropName: 'Eucalyptus',
        cropColor: '#10b981',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 0.92,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 0.92,
        seasonRabiAcres: 0.92,
        seasonKharifAcres: 0.92,
        ndvi: 0.79,
        soilMoisture: 'Optimal (24%)',
        farmerName: 'Shiva Agro Holdings (Sector 7)',
      },
      {
        slNo: 8,
        plotNo: '0813073-2501',
        cropName: 'Millets',
        cropColor: '#a855f7',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 0.54,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 0.54,
        seasonRabiAcres: 0.54,
        seasonKharifAcres: 0.54,
        ndvi: 0.58,
        soilMoisture: 'Dry (16%)',
        farmerName: 'Shiva Agro Holdings (Sector 8)',
      },
    ],
  },
  'ludhiana-wheat': {
    districtName: 'Ludhiana',
    tehsilName: 'Jagraon',
    villageName: 'PAU Agricultural Sector',
    totalPlots: 124,
    totalAreaAcres: 188.78,
    totalAreaHectares: 76.4,
    arablePlots: 120,
    arableAcres: 184.2,
    nonArablePlots: 4,
    nonArableAcres: 4.58,
    rabiSownPlots: 120,
    rabiSownAcres: 184.2,
    kharifSownPlots: 118,
    kharifSownAcres: 180.5,
    cropDistribution: [
      { crop: 'Wheat', percentage: 48, plots: 59, acres: 90.6, color: '#d97706' },
      { crop: 'Maize', percentage: 24, plots: 30, acres: 45.3, color: '#eab308' },
      { crop: 'Soybean', percentage: 16, plots: 20, acres: 30.2, color: '#84cc16' },
      { crop: 'Vegetables', percentage: 12, plots: 15, acres: 22.68, color: '#22c55e' },
    ],
    plots: [
      {
        slNo: 1,
        plotNo: '0310024-1101',
        cropName: 'Wheat',
        cropColor: '#d97706',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 2.4,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 2.4,
        seasonRabiAcres: 2.4,
        seasonKharifAcres: 2.4,
        ndvi: 0.76,
        soilMoisture: 'Optimal (29%)',
        farmerName: 'Shiva Wheat Farm Sector 1',
      },
      {
        slNo: 2,
        plotNo: '0310024-1102',
        cropName: 'Wheat',
        cropColor: '#d97706',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 3.1,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 3.1,
        seasonRabiAcres: 3.1,
        seasonKharifAcres: 3.1,
        ndvi: 0.74,
        soilMoisture: 'Optimal (28%)',
        farmerName: 'Shiva Wheat Farm Sector 2',
      },
      {
        slNo: 3,
        plotNo: '0310024-1103',
        cropName: 'Maize',
        cropColor: '#eab308',
        dataStatus: 'Complete',
        arablePlots: 1,
        nonArablePlots: 0,
        arableAreaAcres: 1.8,
        nonArableAreaAcres: 0.0,
        sownPlots: 1,
        sownAcres: 1.8,
        seasonRabiAcres: 1.8,
        seasonKharifAcres: 1.8,
        ndvi: 0.71,
        soilMoisture: 'Optimal (26%)',
        farmerName: 'Shiva Maize Farm Sector 3',
      },
    ],
  },
};

export const EXECUTIVE_SEASONAL_METRICS = {
  districtsCount: 1,
  tehsilsCount: 1,
  villagesCount: 84,
  totalPlotsCount: 63980,
  totalPlotsAreaAcres: 69526.07,
  totalArableAreaAcres: 54683.47,
  totalArablePlotsCount: 51013,
  totalNonArableAreaAcres: 14842.61,
  totalNonArablePlotsCount: 12967,
  kharif: {
    sownLandPlots: 49254,
    sownLandAcres: 54180.74,
    fallowLandPlots: 1759,
    fallowLandAcres: 502.74,
    monoCropPlots: 8904,
    monoCropAcres: 7049.34,
    mixCropPlots: 40350,
    mixCropAcres: 47131.4,
  },
  rabi: {
    sownLandPlots: 46120,
    sownLandAcres: 50420.3,
    fallowLandPlots: 4893,
    fallowLandAcres: 4263.17,
    monoCropPlots: 11240,
    monoCropAcres: 9420.1,
    mixCropPlots: 34880,
    mixCropAcres: 41000.2,
  },
};
