// Location Intelligence and Reverse Geocoding Service
// Resolves coordinates to accurate administrative boundaries (village, town, district, state, country)

export interface LocationDetails {
  villageOrTown: string;
  suburbOrLocality?: string;
  district: string;
  state: string;
  country: string;
  formattedAddress: string;
  agroZone?: string;
  elevationMeters?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const geocodeCache = new Map<string, LocationDetails>();

// Curated accurate real-world locations for preset regions
const PRESET_GEO_CATALOG: Array<{
  bounds: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  details: Omit<LocationDetails, 'coordinates'>;
}> = [
  {
    bounds: [30.7, 75.6, 31.1, 76.1],
    details: {
      villageOrTown: 'Ludhiana',
      suburbOrLocality: 'PAU Agricultural Zone',
      district: 'Ludhiana District',
      state: 'Punjab',
      country: 'India',
      formattedAddress: 'Ludhiana Agricultural Belt, Punjab, India',
    },
  },
  {
    bounds: [9.3, 76.2, 9.7, 76.6],
    details: {
      villageOrTown: 'Kuttanad',
      suburbOrLocality: 'Champakulam Polder Basin',
      district: 'Alappuzha District',
      state: 'Kerala',
      country: 'India',
      formattedAddress: 'Kuttanad Agricultural Polder, Alappuzha, Kerala, India',
    },
  },
  {
    bounds: [12.9, 79.9, 13.3, 80.3],
    details: {
      villageOrTown: 'Thiruvallur',
      suburbOrLocality: 'Cooum Agricultural Basin',
      district: 'Thiruvallur District',
      state: 'Tamil Nadu',
      country: 'India',
      formattedAddress: 'Thiruvallur Agricultural District, Tamil Nadu, India',
    },
  },
  {
    bounds: [10.6, 78.9, 10.9, 79.3],
    details: {
      villageOrTown: 'Thanjavur',
      suburbOrLocality: 'Cauvery Delta Canal Basin',
      district: 'Thanjavur District',
      state: 'Tamil Nadu',
      country: 'India',
      formattedAddress: 'Thanjavur Delta Farmland, Tamil Nadu, India',
    },
  },
  {
    bounds: [36.5, -120.0, 37.0, -119.5],
    details: {
      villageOrTown: 'Fresno',
      suburbOrLocality: 'San Joaquin Valley Orchard Sector',
      district: 'Fresno County',
      state: 'California',
      country: 'United States',
      formattedAddress: 'San Joaquin Valley Farmland, Fresno, CA, USA',
    },
  },
];

/**
 * Reverse geocodes [lat, lng] to village/town, district, state, country
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationDetails> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Check verified catalog for instant accurate match
  for (const reg of PRESET_GEO_CATALOG) {
    const [minLat, minLng, maxLat, maxLng] = reg.bounds;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      const result: LocationDetails = {
        ...reg.details,
        coordinates: { lat, lng },
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
  }

  // 2. Query OpenStreetMap Nominatim for accurate real-world reverse geocoding
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const villageOrTown =
        addr.village ||
        addr.town ||
        addr.city ||
        addr.municipality ||
        addr.hamlet ||
        addr.suburb ||
        addr.county ||
        'Agricultural Area';

      const suburbOrLocality =
        addr.neighbourhood ||
        addr.suburb ||
        addr.farm ||
        addr.road ||
        'Farmland';

      const district =
        addr.state_district ||
        addr.county ||
        addr.district ||
        addr.state ||
        '';

      const state = addr.state || addr.region || '';
      const country = addr.country || '';

      const details: LocationDetails = {
        villageOrTown,
        suburbOrLocality,
        district,
        state,
        country,
        formattedAddress: [villageOrTown, district, state, country].filter(Boolean).join(', '),
        coordinates: { lat, lng },
      };

      geocodeCache.set(cacheKey, details);
      return details;
    }
  } catch (e) {
    // Graceful fallback
  }

  // Clean coordinate-based fallback without synthetic text
  const latFormatted = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngFormatted = `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

  const fallback: LocationDetails = {
    villageOrTown: `Coordinates ${latFormatted}, ${lngFormatted}`,
    suburbOrLocality: 'Agricultural Parcel',
    district: `${latFormatted}`,
    state: `${lngFormatted}`,
    country: '',
    formattedAddress: `Location at ${latFormatted}, ${lngFormatted}`,
    coordinates: { lat, lng },
  };

  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Forward geocoding search for jumping to any village, town, or city
 */
export async function searchLocation(query: string): Promise<Array<{
  name: string;
  lat: number;
  lng: number;
}>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const items = await res.json();
      return items.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    }
  } catch (e) {
    console.warn('Geocoding search failed:', e);
  }
  return [];
}
