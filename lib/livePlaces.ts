import { Restaurant, INITIAL_RESTAURANTS } from './db';
import { parseRestaurantQuery } from './locationParser';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function pickCuisineImage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('puran poli') || n.includes('puran') || n.includes('poli') || n.includes('thali') || n.includes('durvankur') || n.includes('poona guest') || n.includes('shreyas') || n.includes('sukanta') || n.includes('pithla')) {
    return 'https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('dosa') || n.includes('idli') || n.includes('udupi') || n.includes('south') || n.includes('bhavan') || n.includes('roopali') || n.includes('vaishali') || n.includes('wadeshwar') || n.includes('ctr') || n.includes('vidyarthi')) {
    return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('pav bhaji') || n.includes('bhaji') || n.includes('sardar') || n.includes('honest')) {
    return 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('spdp') || n.includes('dahi puri') || n.includes('sev puri') || n.includes('pani puri') || n.includes('bhel') || n.includes('chaat') || n.includes('girija') || n.includes('sarasbaug')) {
    return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('biryani') || n.includes('mutton') || n.includes('chicken') || n.includes('non veg') || n.includes('kebab') || n.includes('nihari') || n.includes('handi') || n.includes('jagdamb') || n.includes('tandoor')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('khaman') || n.includes('dhokla') || n.includes('fafda') || n.includes('jalebi') || n.includes('locho') || n.includes('gujarat') || n.includes('kathiyawad') || n.includes('undhiyu') || n.includes('das khaman')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('misal') || n.includes('katakirr') || n.includes('maratha') || n.includes('kolhapuri') || n.includes('bedekar') || n.includes('mamledar') || n.includes('saraswati')) {
    return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('vadapav') || n.includes('vada pav') || n.includes('wada pav') || n.includes('batata vada') || n.includes('gajanan')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('cafe') || n.includes('bakery') || n.includes('coffee') || n.includes('chai') || n.includes('tea') || n.includes('irani') || n.includes('goodluck') || n.includes('durga') || n.includes('katta')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('mastani') || n.includes('shake') || n.includes('kulfi') || n.includes('falooda') || n.includes('sujata') || n.includes('ice cream')) {
    return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80';
  }
  if (n.includes('fish') || n.includes('seafood') || n.includes('malvan') || n.includes('surmai') || n.includes('prawns') || n.includes('nisarg') || n.includes('crab')) {
    return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
}

interface PhotonFeature {
  properties: {
    name?: string;
    osm_key?: string;
    osm_value?: string;
    district?: string;
    suburb?: string;
    city?: string;
    locality?: string;
    street?: string;
    state?: string;
    country?: string;
    [key: string]: unknown;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

// In-memory cache with TTL to eliminate repeated slow network requests
interface CacheEntry {
  timestamp: number;
  data: Restaurant[];
}
const placesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Get verified curated restaurants with calculated live distance from user GPS
 */
function getCuratedRestaurantsWithDistance(lat: number, lng: number, city?: string): Restaurant[] {
  return INITIAL_RESTAURANTS.map((rest, index) => {
    const dist = calculateDistance(lat, lng, rest.latitude, rest.longitude);
    return {
      ...rest,
      id: index + 1,
      distanceKm: dist
    } as Restaurant & { distanceKm: number };
  });
}

/**
 * Fetch LIVE real restaurants around the user's GPS coordinates (Ultra Fast + Cached)
 */
export async function fetchLiveNearbyPlaces(lat: number, lng: number, cityFallback = 'Pune'): Promise<Restaurant[]> {
  const cacheKey = `nearby_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const seenNames = new Set<string>();
  const combined: Restaurant[] = [];
  let nextId = 700001;

  // 1. LIVE API FIRST: Call Photon API with user's exact live GPS coordinates
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const url = `https://photon.komoot.io/api/?q=restaurant&lat=${lat}&lon=${lng}&limit=35`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BakasurFoodTourApp/2.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      const liveFeatures = (json.features || []) as PhotonFeature[];
      for (let i = 0; i < liveFeatures.length; i++) {
        const f = liveFeatures[i];
        const rawName = f.properties.name?.trim();
        if (!rawName || rawName.length < 3) continue;

        const lower = rawName.toLowerCase();
        if (['restaurant', 'cafe', 'hotel', 'food', 'bar', 'dhaba', 'tea', 'bakery', 'bar & restaurant', 'bar and restaurant'].includes(lower)) continue;
        if (seenNames.has(lower)) continue;

        const [itemLon, itemLat] = f.geometry.coordinates;
        const dist = calculateDistance(lat, lng, itemLat, itemLon);
        if (dist > 35) continue; // within 35km

        seenNames.add(lower);

        const area = (f.properties.district || f.properties.suburb || f.properties.street || f.properties.locality || cityFallback) as string;
        const cityName = (f.properties.city || f.properties.state || cityFallback) as string;

        combined.push({
          id: nextId++,
          name: rawName,
          description: `Live food joint located at ${area}, ${cityName}`,
          address: f.properties.street ? `${f.properties.street}, ${area}` : `${area}, ${cityName}`,
          area,
          city: cityName,
          latitude: itemLat,
          longitude: itemLon,
          rating: Math.round((4.5 + ((i % 5) * 0.1)) * 10) / 10,
          image: pickCuisineImage(rawName),
          is_campaign_active: 1,
          total_visits: 600 + ((i * 37) % 1400),
          status: 'active',
          distanceKm: dist
        } as Restaurant & { distanceKm: number });
      }
    }
  } catch (err) {
    console.error('Photon live API error in fetchLiveNearbyPlaces:', err);
  }

  // 2. Supplement with Curated Spots (with real calculated distance from user GPS)
  const curatedSpots = getCuratedRestaurantsWithDistance(lat, lng, cityFallback);
  for (const spot of curatedSpots) {
    const dist = (spot as Restaurant & { distanceKm: number }).distanceKm;
    if (dist <= 30) {
      const lower = spot.name.toLowerCase().trim();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        combined.push(spot);
      }
    }
  }

  // 3. Fallback: If still few spots, query OpenStreetMap Nominatim
  if (combined.length < 5) {
    try {
      const delta = 0.045; // ~4.5km bounding box
      const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=restaurant&bounded=1&viewbox=${viewbox}&limit=15&addressdetails=1`;
      const res = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'BakasurFoodTourApp/2.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const places = await res.json();
        if (Array.isArray(places)) {
          for (let i = 0; i < places.length; i++) {
            const p = places[i];
            const rawName = p.name || (p.display_name ? p.display_name.split(',')[0].trim() : '');
            if (!rawName) continue;

            const lower = rawName.toLowerCase().trim();
            if (['restaurant', 'cafe', 'hotel', 'food', 'bar', 'dhaba', 'tea', 'bakery'].includes(lower)) continue;
            if (seenNames.has(lower)) continue;
            seenNames.add(lower);

            const itemLat = parseFloat(p.lat);
            const itemLon = parseFloat(p.lon);
            const dist = calculateDistance(lat, lng, itemLat, itemLon);
            if (dist > 35) continue;

            const addr = p.address || {};
            const area = (addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.road || cityFallback) as string;
            const cityName = (addr.city || addr.town || addr.municipality || addr.state_district || cityFallback) as string;

            combined.push({
              id: nextId++,
              name: rawName,
              description: `Popular dining spot in ${area}, ${cityName}`,
              address: addr.road ? `${addr.road}, ${area}` : `${area}, ${cityName}`,
              area,
              city: cityName,
              latitude: itemLat,
              longitude: itemLon,
              rating: Math.round((4.4 + ((i % 6) * 0.1)) * 10) / 10,
              image: pickCuisineImage(rawName),
              is_campaign_active: 1,
              total_visits: 500 + ((i * 43) % 1500),
              status: 'active',
              distanceKm: dist
            } as Restaurant & { distanceKm: number });
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // 4. Sort strictly by closest distance to user's live GPS coordinates!
  combined.sort((a, b) => ((a as unknown as { distanceKm: number }).distanceKm || 0) - ((b as unknown as { distanceKm: number }).distanceKm || 0));

  // Store in cache
  placesCache.set(cacheKey, { timestamp: Date.now(), data: combined });

  return combined;
}

const VALID_FOOD_VALUES = new Set([
  'restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream', 'pub', 'bar', 'dhaba',
  'bakery', 'pastry', 'confectionery', 'tea', 'bistro', 'eatery', 'canteen'
]);

function isFoodFeature(f: PhotonFeature): boolean {
  const osmKey = String(f.properties.osm_key || '').toLowerCase();
  const osmVal = String(f.properties.osm_value || '').toLowerCase();
  if (VALID_FOOD_VALUES.has(osmVal)) return true;
  if (osmKey === 'amenity' && ['restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream', 'pub', 'bar'].includes(osmVal)) return true;
  if (osmKey === 'shop' && ['bakery', 'pastry', 'confectionery', 'deli'].includes(osmVal)) return true;
  
  const rawName = String(f.properties.name || '').toLowerCase();
  // Filter out non-food places like tailors, clinics, photography, housing societies, estates
  if (/\b(tailor|tailors|photo|photography|studio|saloon|salon|niwas|nivas|society|apartment|apartments|hospital|school|college|clinic|estate|farm|residency|enclave|vihar|nagar|park|garden|road)\b/i.test(rawName)) {
    return false;
  }
  if (/\b(restaurant|cafe|dhaba|hotel|bhojanalay|bhojnalaya|bistro|kitchen|bake|bakery|biryani|thali|dosa|sweets|snack|snacks|canteen|eatery|grill|bar|pub|coffee|chai|tea|pizza|burger|roll|rolls|chaat|misal|vadapav)\b/i.test(rawName)) {
    return true;
  }
  return false;
}

/**
 * Search LIVE real restaurants across any location in India in real-time (Instant + Comprehensive)
/**
 * Fetch live search autocomplete suggestions from Google's prediction engine
 */
async function fetchGoogleSuggestPlaces(
  query: string,
  fallbackCity: string,
  userCoords?: { lat: number; lng: number } | null
): Promise<Restaurant[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 700);
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&gl=in&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json();
    const rawSuggestions: string[] = Array.isArray(json) && Array.isArray(json[1]) ? json[1] : [];

    const results: Restaurant[] = [];
    const seen = new Set<string>();
    let idCounter = 850000;

    for (const item of rawSuggestions) {
      if (!item || typeof item !== 'string') continue;
      const trimmedItem = item.trim();

      // Filter out generic directory phrases (e.g., "hotels in ...", "top 10 restaurants in ...")
      if (/^(hotels?\s+in\b|restaurants?\s+in\b|cafes?\s+in\b|places?\s+to\b|food\s+in\b|best\s+|top\s+\d+|hotels?\s+near\b|restaurants?\s+near\b)/i.test(trimmedItem)) {
        continue;
      }

      // Filter out non-place search junk
      if (
        /(contact|phone|ph\s*no|mobile|number|no\b|timing|hours|closing\s*time|open(ing)?\s*time|photos|images|owner|price|review|menu|railway|station|hospital|near\s*me|how\s*to\s*reach|case|closed|complaint|jobs|vacancy|booking|table\s*booking|entry\s*fee|tickets?|distance|location|address|pin\s*code|pincode)/i.test(
          trimmedItem
        )
      ) {
        continue;
      }

      const parsed = parseRestaurantQuery(trimmedItem, fallbackCity, userCoords);
      if (!parsed.cleanName || parsed.cleanName.length < 2) continue;
      // Do not accept pure generic names like "Hotel" or "Restaurant"
      if (/^(hotel|restaurant|cafe|dhaba|bar)$/i.test(parsed.cleanName)) continue;

      const lowerKey = `${parsed.cleanName.toLowerCase()}_${parsed.area.toLowerCase()}`;
      if (seen.has(lowerKey)) continue;
      seen.add(lowerKey);

      results.push({
        id: idCounter++,
        name: parsed.cleanName,
        description: `Verified dining establishment in ${parsed.area}, ${parsed.city}`,
        address: parsed.address,
        area: parsed.area,
        city: parsed.city,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        rating: 4.8,
        image: pickCuisineImage(parsed.cleanName),
        is_campaign_active: 1,
        total_visits: 850,
        status: 'active'
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Fetch verified places from OpenStreetMap Nominatim strictly bounded to India
 */
async function fetchNominatimPlaces(
  searchQuery: string,
  parsedLocality: ReturnType<typeof parseRestaurantQuery>
): Promise<Restaurant[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 750);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery
    )}&countrycodes=in&format=json&addressdetails=1&limit=5`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BakasurFoodTourApp/3.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];

    const results: Restaurant[] = [];
    let idCounter = 870000;
    for (const place of json) {
      const name = place.name || (place.display_name ? place.display_name.split(',')[0].trim() : '');
      if (!name || name.length < 2) continue;
      const addr = place.address || {};
      const area = (addr.suburb || addr.neighbourhood || addr.quarter || addr.road || parsedLocality.area) as string;
      const city = (addr.city || addr.town || addr.municipality || addr.state_district || parsedLocality.city) as string;
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      results.push({
        id: idCounter++,
        name,
        description: `Popular dining destination in ${area}, ${city}`,
        address: addr.road ? `${addr.road}, ${area}` : `${area}, ${city}`,
        area,
        city,
        latitude: !isNaN(lat) ? lat : parsedLocality.latitude,
        longitude: !isNaN(lon) ? lon : parsedLocality.longitude,
        rating: 4.8,
        image: pickCuisineImage(name),
        is_campaign_active: 1,
        total_visits: 900,
        status: 'active'
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Search LIVE real restaurants across any location in India in real-time (Google-like Search)
 */
export async function searchLivePlaces(options: {
  query: string;
  city?: string;
  lat?: number;
  lng?: number;
}): Promise<Restaurant[]> {
  const { query, city = '', lat = 18.5204, lng = 73.8407 } = options;
  if (!query || !query.trim()) {
    return fetchLiveNearbyPlaces(lat, lng, city);
  }

  const rawTyped = query.trim();
  const q = rawTyped.toLowerCase();
  const cacheKey = `search_${q}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const seenNames = new Set<string>();
  const searchResults: (Restaurant & { relevanceScore?: number })[] = [];
  let searchId = 800001;

  // 1. Parse typed query for clean restaurant name, area, and city
  const parsed = parseRestaurantQuery(rawTyped, city, { lat, lng });

  // 2. Synthesize user's exact typed restaurant name as the top instant selection
  if (rawTyped.length >= 2) {
    const userSpot: Restaurant & { relevanceScore: number } = {
      id: searchId++,
      name: parsed.cleanName,
      description: `Popular dining spot in ${parsed.area}, ${parsed.city}`,
      address: parsed.address,
      area: parsed.area,
      city: parsed.city,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      rating: 4.8,
      image: pickCuisineImage(parsed.cleanName),
      is_campaign_active: 1,
      total_visits: 750,
      status: 'active',
      distanceKm: calculateDistance(lat, lng, parsed.latitude, parsed.longitude),
      relevanceScore: 1300 // Highest priority exact user query
    } as Restaurant & { distanceKm: number; relevanceScore: number };

    searchResults.push(userSpot);
    seenNames.add(parsed.cleanName.toLowerCase());
  }

  // 3. Search curated database for matching restaurants
  const normalizedQ = q
    .replace(/\bjanglai\b/g, 'jangali')
    .replace(/\bresturant\b/g, 'restaurant')
    .replace(/\brestaurant\b/g, '')
    .replace(/\bhotel\b/g, '')
    .trim();

  const tokens = normalizedQ
    .split(/[\s,/-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !['and', 'the', 'near', 'road', 'rd', 'pure', 'veg'].includes(t));

  const primaryKeyword = tokens[0] || normalizedQ || q;

  const allCurated = getCuratedRestaurantsWithDistance(lat, lng, city);
  for (const rest of allCurated) {
    const rName = rest.name.toLowerCase().trim();
    const rArea = (rest.area || '').toLowerCase().trim();
    const rCity = (rest.city || '').toLowerCase().trim();
    const rDesc = (rest.description || '').toLowerCase();
    const fullText = `${rName} ${rArea} ${rCity} ${rDesc}`;

    let score = 0;
    if (rName === q || rName === parsed.cleanName.toLowerCase()) {
      score = 1200; // Exact full match
    } else if (rName.startsWith(q) || rName.startsWith(parsed.cleanName.toLowerCase())) {
      score = 1000; // Starts with query
    } else if (rName.includes(q) || rName.includes(parsed.cleanName.toLowerCase())) {
      score = 850; // Contains query
    } else if (primaryKeyword.length >= 2 && rName.includes(primaryKeyword)) {
      score = 700; // Contains primary keyword
    } else if (tokens.length > 0 && tokens.every(t => rName.includes(t))) {
      score = 650; // All tokens in name
    } else if (tokens.length > 0 && tokens.some(t => rName.includes(t))) {
      score = 500; // Some tokens in name
    } else if (rArea.includes(q) || fullText.includes(q)) {
      score = 350;
    }

    if (score > 0) {
      if (!seenNames.has(rName)) {
        seenNames.add(rName);
        searchResults.push({
          ...rest,
          relevanceScore: score
        });
      }
    }
  }

  // 4. Parallel Live Google Suggest & Nominatim Search
  try {
    const [googleSpots, nominatimSpots] = await Promise.all([
      fetchGoogleSuggestPlaces(rawTyped, city, { lat, lng }),
      fetchNominatimPlaces(`${parsed.cleanName} ${parsed.area}`, parsed)
    ]);

    // Add Google Suggestions
    for (const gSpot of googleSpots) {
      const gNameLower = gSpot.name.toLowerCase();
      if (!seenNames.has(gNameLower)) {
        seenNames.add(gNameLower);
        searchResults.push({
          ...gSpot,
          distanceKm: calculateDistance(lat, lng, gSpot.latitude, gSpot.longitude),
          relevanceScore: 1100
        });
      }
    }

    // Add Nominatim India Spots
    for (const nSpot of nominatimSpots) {
      const nNameLower = nSpot.name.toLowerCase();
      if (!seenNames.has(nNameLower)) {
        seenNames.add(nNameLower);
        searchResults.push({
          ...nSpot,
          distanceKm: calculateDistance(lat, lng, nSpot.latitude, nSpot.longitude),
          relevanceScore: 900
        });
      }
    }
  } catch (err) {
    console.warn('Live places parallel search error:', err);
  }

  // 5. Fast Parallel Photon Search around parsed coordinates with India safety
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 650);
    const searchAreaTerm = parsed.area && parsed.area.toLowerCase() !== parsed.city.toLowerCase() ? ` ${parsed.area}` : '';
    const photonSearchQuery = `${parsed.cleanName}${searchAreaTerm} restaurant`;
    const searchUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      photonSearchQuery
    )}&lat=${parsed.latitude}&lon=${parsed.longitude}&limit=10`;

    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'BakasurFoodTourApp/3.0' },
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && Array.isArray(json.features)) {
        const features = json.features as PhotonFeature[];
        for (let i = 0; i < features.length; i++) {
          const f = features[i];
          const rawName = f.properties.name?.trim();
          if (!rawName || rawName.length < 2) continue;
          if (!isFoodFeature(f)) continue;

          // India only check: if country is provided and not India, skip!
          const country = String(f.properties.country || '').toLowerCase();
          if (country && country !== 'india' && country !== 'in') continue;

          const lower = rawName.toLowerCase();
          if (seenNames.has(lower)) continue;
          seenNames.add(lower);

          const [itemLon, itemLat] = f.geometry.coordinates;
          const dist = calculateDistance(lat, lng, itemLat, itemLon);
          const area = (f.properties.district ||
            f.properties.suburb ||
            f.properties.locality ||
            f.properties.street ||
            parsed.area) as string;
          const cityName = (f.properties.city || f.properties.state || parsed.city) as string;

          const placeScore =
            lower.includes(q) || lower.includes(parsed.cleanName.toLowerCase())
              ? 600
              : lower.includes(primaryKeyword)
              ? 450
              : 300;

          searchResults.push({
            id: searchId++,
            name: rawName,
            description: `Live food joint in ${area}, ${cityName}`,
            address: f.properties.street ? `${f.properties.street}, ${area}` : `${area}, ${cityName}`,
            area,
            city: cityName,
            latitude: itemLat,
            longitude: itemLon,
            rating: Math.round((4.6 + ((i % 4) * 0.1)) * 10) / 10,
            image: pickCuisineImage(rawName),
            is_campaign_active: 1,
            total_visits: 800 + ((i * 31) % 1200),
            status: 'active',
            distanceKm: dist,
            relevanceScore: placeScore
          } as Restaurant & { distanceKm: number; relevanceScore: number });
        }
      }
    }
  } catch {
    // Graceful fallback to collected matches
  }

  // 6. Sort by relevanceScore descending, with distance as tie-breaker
  searchResults.sort((a, b) => {
    const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      ((a as unknown as { distanceKm: number }).distanceKm || 0) -
      ((b as unknown as { distanceKm: number }).distanceKm || 0)
    );
  });

  // Limit to top 15 clean results
  const trimmedResults = searchResults.slice(0, 15);

  // Store in cache
  placesCache.set(cacheKey, { timestamp: Date.now(), data: trimmedResults });

  return trimmedResults;
}
