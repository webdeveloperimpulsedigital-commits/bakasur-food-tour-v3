/**
 * Location resolution for restaurant search.
 * ------------------------------------------------------------------
 * Lets users search restaurants in ANY city/area, independent of where they are:
 *   "Prashant Corner Thane", "Mamledar Misal in Thane", "Vaishali, FC Road Pune"
 *
 * 1. parseLocationFromQuery() splits a query into { nameQuery, locationText }
 *    using explicit separators (in / at / near / comma) or a trailing known
 *    city / suburb name.
 * 2. resolveLocation() turns the location text into coordinates using the
 *    built-in gazetteer first, then OpenStreetMap Nominatim (geocoding only -
 *    restaurants themselves are always verified on Swiggy).
 *
 * The user's own location is only used as a geocoding bias and for distances.
 */

export interface ResolvedLocation {
  lat: number;
  lng: number;
  label: string;
  /** 'city' locations cover a larger radius than a specific area/locality */
  kind: 'city' | 'area';
  source: 'gazetteer' | 'nominatim';
}

// ---------------------------------------------------------------------------
// Gazetteer: major cities and frequently searched suburbs (city centres)
// ---------------------------------------------------------------------------
const CITY_GAZETTEER: Record<string, { lat: number; lng: number; label: string }> = {
  // Maharashtra
  mumbai: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
  bombay: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
  thane: { lat: 19.2183, lng: 72.9781, label: 'Thane' },
  'navi mumbai': { lat: 19.033, lng: 73.0297, label: 'Navi Mumbai' },
  vashi: { lat: 19.0771, lng: 72.9986, label: 'Vashi, Navi Mumbai' },
  panvel: { lat: 18.9894, lng: 73.1175, label: 'Panvel' },
  kalyan: { lat: 19.2437, lng: 73.1355, label: 'Kalyan' },
  dombivli: { lat: 19.2094, lng: 73.0939, label: 'Dombivli' },
  'mira road': { lat: 19.2813, lng: 72.8561, label: 'Mira Road' },
  'vasai virar': { lat: 19.391, lng: 72.8397, label: 'Vasai-Virar' },
  virar: { lat: 19.4559, lng: 72.8114, label: 'Virar' },
  vasai: { lat: 19.3919, lng: 72.8397, label: 'Vasai' },
  bhiwandi: { lat: 19.2813, lng: 73.0483, label: 'Bhiwandi' },
  ulhasnagar: { lat: 19.2215, lng: 73.1645, label: 'Ulhasnagar' },
  lonavala: { lat: 18.7546, lng: 73.4062, label: 'Lonavala' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune' },
  pimpri: { lat: 18.6298, lng: 73.7997, label: 'Pimpri, Pune' },
  chinchwad: { lat: 18.6446, lng: 73.7835, label: 'Chinchwad, Pune' },
  'pimpri chinchwad': { lat: 18.6298, lng: 73.7997, label: 'Pimpri-Chinchwad' },
  hinjewadi: { lat: 18.5913, lng: 73.7389, label: 'Hinjewadi, Pune' },
  wakad: { lat: 18.5987, lng: 73.7651, label: 'Wakad, Pune' },
  'fc road': { lat: 18.5204, lng: 73.8407, label: 'FC Road, Pune' },
  'fergusson college road': { lat: 18.5204, lng: 73.8407, label: 'FC Road, Pune' },
  deccan: { lat: 18.5167, lng: 73.8415, label: 'Deccan Gymkhana, Pune' },
  kothrud: { lat: 18.5074, lng: 73.8077, label: 'Kothrud, Pune' },
  'sadashiv peth': { lat: 18.5140, lng: 73.8540, label: 'Sadashiv Peth, Pune' },
  camp: { lat: 18.5140, lng: 73.8760, label: 'Camp, Pune' },
  'koregaon park': { lat: 18.5362, lng: 73.8940, label: 'Koregaon Park, Pune' },
  'viman nagar': { lat: 18.5679, lng: 73.9143, label: 'Viman Nagar, Pune' },
  baner: { lat: 18.5590, lng: 73.7868, label: 'Baner, Pune' },
  aundh: { lat: 18.5580, lng: 73.8050, label: 'Aundh, Pune' },
  naupada: { lat: 19.1860, lng: 72.9750, label: 'Naupada, Thane' },
  'panch pakhadi': { lat: 19.1920, lng: 72.9680, label: 'Panch Pakhadi, Thane' },
  colaba: { lat: 18.9222, lng: 72.8317, label: 'Colaba, Mumbai' },
  bandra: { lat: 19.0596, lng: 72.8295, label: 'Bandra, Mumbai' },
  dadar: { lat: 19.0178, lng: 72.8478, label: 'Dadar, Mumbai' },
  andheri: { lat: 19.1136, lng: 72.8697, label: 'Andheri, Mumbai' },
  nashik: { lat: 19.9975, lng: 73.7898, label: 'Nashik' },
  nasik: { lat: 19.9975, lng: 73.7898, label: 'Nashik' },
  nagpur: { lat: 21.1458, lng: 79.0882, label: 'Nagpur' },
  aurangabad: { lat: 19.8762, lng: 75.3433, label: 'Aurangabad' },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433, label: 'Chhatrapati Sambhajinagar' },
  kolhapur: { lat: 16.705, lng: 74.2433, label: 'Kolhapur' },
  solapur: { lat: 17.6599, lng: 75.9064, label: 'Solapur' },
  satara: { lat: 17.6805, lng: 74.0183, label: 'Satara' },
  sangli: { lat: 16.8524, lng: 74.5815, label: 'Sangli' },
  ahmednagar: { lat: 19.0952, lng: 74.7496, label: 'Ahmednagar' },
  amravati: { lat: 20.9374, lng: 77.7796, label: 'Amravati' },
  // Goa
  goa: { lat: 15.4909, lng: 73.8278, label: 'Goa' },
  panaji: { lat: 15.4909, lng: 73.8278, label: 'Panaji' },
  margao: { lat: 15.2832, lng: 73.9862, label: 'Margao' },
  // Karnataka
  bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' },
  mysore: { lat: 12.2958, lng: 76.6394, label: 'Mysuru' },
  mysuru: { lat: 12.2958, lng: 76.6394, label: 'Mysuru' },
  mangalore: { lat: 12.9141, lng: 74.856, label: 'Mangaluru' },
  mangaluru: { lat: 12.9141, lng: 74.856, label: 'Mangaluru' },
  hubli: { lat: 15.3647, lng: 75.124, label: 'Hubballi' },
  belgaum: { lat: 15.8497, lng: 74.4977, label: 'Belagavi' },
  belagavi: { lat: 15.8497, lng: 74.4977, label: 'Belagavi' },
  // Telangana / AP
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad' },
  secunderabad: { lat: 17.4399, lng: 78.4983, label: 'Secunderabad' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, label: 'Visakhapatnam' },
  vizag: { lat: 17.6868, lng: 83.2185, label: 'Visakhapatnam' },
  vijayawada: { lat: 16.5062, lng: 80.648, label: 'Vijayawada' },
  // Tamil Nadu / Kerala
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai' },
  madras: { lat: 13.0827, lng: 80.2707, label: 'Chennai' },
  coimbatore: { lat: 11.0168, lng: 76.9558, label: 'Coimbatore' },
  madurai: { lat: 9.9252, lng: 78.1198, label: 'Madurai' },
  kochi: { lat: 9.9312, lng: 76.2673, label: 'Kochi' },
  cochin: { lat: 9.9312, lng: 76.2673, label: 'Kochi' },
  trivandrum: { lat: 8.5241, lng: 76.9366, label: 'Thiruvananthapuram' },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, label: 'Thiruvananthapuram' },
  kozhikode: { lat: 11.2588, lng: 75.7804, label: 'Kozhikode' },
  calicut: { lat: 11.2588, lng: 75.7804, label: 'Kozhikode' },
  // NCR & North
  delhi: { lat: 28.6139, lng: 77.209, label: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.209, label: 'New Delhi' },
  gurgaon: { lat: 28.4595, lng: 77.0266, label: 'Gurugram' },
  gurugram: { lat: 28.4595, lng: 77.0266, label: 'Gurugram' },
  noida: { lat: 28.5355, lng: 77.391, label: 'Noida' },
  'greater noida': { lat: 28.4744, lng: 77.504, label: 'Greater Noida' },
  ghaziabad: { lat: 28.6692, lng: 77.4538, label: 'Ghaziabad' },
  faridabad: { lat: 28.4089, lng: 77.3178, label: 'Faridabad' },
  chandigarh: { lat: 30.7333, lng: 76.7794, label: 'Chandigarh' },
  mohali: { lat: 30.7046, lng: 76.7179, label: 'Mohali' },
  ludhiana: { lat: 30.901, lng: 75.8573, label: 'Ludhiana' },
  amritsar: { lat: 31.634, lng: 74.8723, label: 'Amritsar' },
  jalandhar: { lat: 31.326, lng: 75.5762, label: 'Jalandhar' },
  dehradun: { lat: 30.3165, lng: 78.0322, label: 'Dehradun' },
  jaipur: { lat: 26.9124, lng: 75.7873, label: 'Jaipur' },
  udaipur: { lat: 24.5854, lng: 73.7125, label: 'Udaipur' },
  jodhpur: { lat: 26.2389, lng: 73.0243, label: 'Jodhpur' },
  lucknow: { lat: 26.8467, lng: 80.9462, label: 'Lucknow' },
  kanpur: { lat: 26.4499, lng: 80.3319, label: 'Kanpur' },
  agra: { lat: 27.1767, lng: 78.0081, label: 'Agra' },
  varanasi: { lat: 25.3176, lng: 82.9739, label: 'Varanasi' },
  prayagraj: { lat: 25.4358, lng: 81.8463, label: 'Prayagraj' },
  allahabad: { lat: 25.4358, lng: 81.8463, label: 'Prayagraj' },
  // Gujarat / MP / Central
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad' },
  gandhinagar: { lat: 23.2156, lng: 72.6369, label: 'Gandhinagar' },
  surat: { lat: 21.1702, lng: 72.8311, label: 'Surat' },
  vadodara: { lat: 22.3072, lng: 73.1812, label: 'Vadodara' },
  baroda: { lat: 22.3072, lng: 73.1812, label: 'Vadodara' },
  rajkot: { lat: 22.3039, lng: 70.8022, label: 'Rajkot' },
  indore: { lat: 22.7196, lng: 75.8577, label: 'Indore' },
  bhopal: { lat: 23.2599, lng: 77.4126, label: 'Bhopal' },
  raipur: { lat: 21.2514, lng: 81.6296, label: 'Raipur' },
  // East
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata' },
  calcutta: { lat: 22.5726, lng: 88.3639, label: 'Kolkata' },
  howrah: { lat: 22.5958, lng: 88.2636, label: 'Howrah' },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, label: 'Bhubaneswar' },
  patna: { lat: 25.5941, lng: 85.1376, label: 'Patna' },
  ranchi: { lat: 23.3441, lng: 85.3096, label: 'Ranchi' },
  guwahati: { lat: 26.1445, lng: 91.7362, label: 'Guwahati' }
};

/** Cities searched when a restaurant name isn't found near the user and no location was typed. */
export const MAJOR_SEARCH_HUBS: string[] = [
  'mumbai', 'thane', 'navi mumbai', 'pune', 'bengaluru', 'delhi', 'gurugram', 'noida',
  'hyderabad', 'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'nashik', 'nagpur', 'goa',
  'chandigarh', 'lucknow', 'indore', 'surat', 'kochi'
];

const DIRECTION_SUFFIX = /\s+(west|east|north|south|w|e)$/i;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lookupGazetteer(text: string): { lat: number; lng: number; label: string } | null {
  const key = normalize(text);
  if (!key) return null;
  if (CITY_GAZETTEER[key]) return CITY_GAZETTEER[key];
  const noDir = key.replace(DIRECTION_SUFFIX, '');
  if (noDir !== key && CITY_GAZETTEER[noDir]) {
    const base = CITY_GAZETTEER[noDir];
    return { ...base, label: `${base.label} ${key.slice(noDir.length).trim().replace(/^w$/, 'west').replace(/^e$/, 'east')}` };
  }
  return null;
}

export function getHubCoordinates(hub: string): { lat: number; lng: number; label: string } | null {
  return CITY_GAZETTEER[hub] || null;
}

// ---------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------

/** Words that, alone, mean "any restaurant" (e.g. "restaurants in Thane"). */
const GENERIC_SEARCH_WORDS = new Set([
  'restaurant', 'restaurants', 'hotel', 'hotels', 'food', 'foods', 'eat', 'eatery', 'eateries',
  'place', 'places', 'spot', 'spots', 'best', 'top', 'good', 'famous', 'popular', 'nearby',
  'near', 'me', 'the', 'a', 'some', 'any', 'all', 'cafe', 'cafes', 'dhaba', 'dhabas', 'joint', 'joints'
]);

export function isGenericSearch(nameQuery: string): boolean {
  const tokens = normalize(nameQuery).split(' ').filter(Boolean);
  return tokens.length === 0 || tokens.every(t => GENERIC_SEARCH_WORDS.has(t));
}

export interface ParsedLocationQuery {
  nameQuery: string;
  locationText: string | null;
  /** 'explicit' = typed with in/at/near/comma; 'trailing' = recognised city name at the end */
  via: 'explicit' | 'trailing' | null;
}

export function parseLocationFromQuery(raw: string): ParsedLocationQuery {
  const query = (raw || '').trim().replace(/\s+/g, ' ');
  if (!query) return { nameQuery: '', locationText: null, via: null };

  // 1. Explicit separators: "X in Y", "X at Y", "X near Y", "X @ Y"
  const sep = query.match(/^(.*?)\s+(?:in|at|near|around|@)\s+(.+)$/i);
  if (sep && sep[2].trim().length >= 3) {
    return { nameQuery: sep[1].trim(), locationText: sep[2].trim(), via: 'explicit' };
  }

  // 2. Comma form: "Name, Area" or "Name, Area, City"
  const commaIdx = query.indexOf(',');
  if (commaIdx > 0) {
    const name = query.slice(0, commaIdx).trim();
    const loc = query.slice(commaIdx + 1).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    if (name && loc.length >= 3) return { nameQuery: name, locationText: loc, via: 'explicit' };
  }

  // 3. Trailing known city / suburb: "Prashant Corner Thane", "Mamledar Misal Thane West"
  const tokens = query.split(' ');
  for (let take = Math.min(4, tokens.length); take >= 1; take--) {
    const tail = tokens.slice(tokens.length - take).join(' ');
    if (lookupGazetteer(tail)) {
      const name = tokens.slice(0, tokens.length - take).join(' ').trim();
      return { nameQuery: name, locationText: tail, via: 'trailing' };
    }
  }

  return { nameQuery: query, locationText: null, via: null };
}

// ---------------------------------------------------------------------------
// Geocoding (gazetteer -> Nominatim), cached
// ---------------------------------------------------------------------------
type GeoCacheEntry = { at: number; value: ResolvedLocation | null };
const geoStore = globalThis as unknown as { __locationGeoCache?: Map<string, GeoCacheEntry> };
const geoCache: Map<string, GeoCacheEntry> = (geoStore.__locationGeoCache ??= new Map());
const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const GEO_NEGATIVE_TTL_MS = 30 * 60 * 1000;
const GEO_TIMEOUT_MS = 4500;

// Nominatim usage policy: max ~1 request/second per application
let lastNominatimCall = 0;
async function nominatimThrottle() {
  const wait = lastNominatimCall + 1100 - Date.now();
  lastNominatimCall = Math.max(Date.now(), lastNominatimCall + 1100);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
}

const AREA_TYPES = new Set([
  'suburb', 'neighbourhood', 'quarter', 'residential', 'road', 'street', 'locality',
  'hamlet', 'village', 'city_district', 'borough', 'commercial', 'retail', 'amenity'
]);

// Only genuine places may become a search location. Businesses/POIs (category 'amenity',
// 'shop', 'tourism', ...) are rejected so a dish word like "misal" never turns into a location.
const PLACE_CATEGORIES = new Set(['place', 'boundary', 'highway', 'railway', 'landuse']);

async function geocodeWithNominatim(
  text: string,
  bias?: { lat: number; lng: number } | null
): Promise<ResolvedLocation | null> {
  await nominatimThrottle();
  let url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&addressdetails=0` +
    `&q=${encodeURIComponent(text)}`;
  if (bias) {
    // Prefer matches near the user (e.g. "Shaniwar Peth" -> Pune) without excluding other cities
    url += `&viewbox=${bias.lng - 1},${bias.lat + 1},${bias.lng + 1},${bias.lat - 1}&bounded=0`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'BhookasurFoodTour/1.0 (restaurant search location lookup)',
        'Accept-Language': 'en'
      },
      signal: controller.signal,
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const hits = await res.json();
    const hit = Array.isArray(hits) ? hits[0] : null;
    if (!hit || !PLACE_CATEGORIES.has(String(hit.category || ''))) return null;
    const lat = parseFloat(hit?.lat);
    const lng = parseFloat(hit?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const type = String(hit?.addresstype || hit?.type || '');
    return {
      lat,
      lng,
      label: String(hit?.name || text),
      kind: AREA_TYPES.has(type) ? 'area' : 'city',
      source: 'nominatim'
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve a typed place ("Thane", "Naupada Thane", "FC Road Pune") to coordinates. */
export async function resolveLocation(
  text: string,
  bias?: { lat: number; lng: number } | null
): Promise<ResolvedLocation | null> {
  const key = normalize(text);
  if (key.length < 3) return null;

  const gaz = lookupGazetteer(key);
  if (gaz) return { ...gaz, kind: 'city', source: 'gazetteer' };

  // "Naupada Thane" / "FC Road Pune": anchor the area lookup to the typed city
  const tokens = key.split(' ');
  let anchorCity: { lat: number; lng: number; label: string } | null = null;
  for (let take = Math.min(3, tokens.length - 1); take >= 1 && !anchorCity; take--) {
    anchorCity = lookupGazetteer(tokens.slice(tokens.length - take).join(' '));
  }
  const effectiveBias = anchorCity || bias || null;

  const biasKey = effectiveBias ? `${effectiveBias.lat.toFixed(1)},${effectiveBias.lng.toFixed(1)}` : 'none';
  const cacheKey = `${key}|${biasKey}`;
  const hit = geoCache.get(cacheKey);
  if (hit && Date.now() - hit.at < (hit.value ? GEO_TTL_MS : GEO_NEGATIVE_TTL_MS)) return hit.value;

  let value = await geocodeWithNominatim(text, effectiveBias);
  if (anchorCity) {
    const farFromCity = value && distanceKm(value.lat, value.lng, anchorCity.lat, anchorCity.lng) > 40;
    if (!value || farFromCity) {
      value = { lat: anchorCity.lat, lng: anchorCity.lng, label: anchorCity.label, kind: 'city', source: 'gazetteer' };
    }
  }
  // Network failures are retried after a short negative TTL
  geoCache.set(cacheKey, { at: Date.now(), value });
  return value;
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
