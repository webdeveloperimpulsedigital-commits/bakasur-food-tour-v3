/**
 * Apify Swiggy Scraper Integration Engine
 * Supports Actors:
 *  - Primary Menu & Dish Extractor: memo23/swiggy-scraper (Fetches real dishes, prices & photos via /mapi/menu/pl)
 *  - High-Volume Listing Scraper: thirdwatch/swiggy-scraper ("Swiggy Scraper - India Restaurant & Food Delivery Data")
 * 
 * Features:
 * - Live restaurant menu extraction from Swiggy across 30+ Indian cities
 * - Real-world dish pricing, descriptions, veg/non-veg flags, and authentic Swiggy CDN photography
 * - High-speed in-memory caching (2-hour TTL) to conserve Apify usage credits
 * - Multiple schema parsers (flat dishes, category groups, raw Swiggy card structures)
 * - Pure Food PNG AI integration forwarding high-res Swiggy CDN images as cutout source
 * - Resilient timeout and graceful fallback to local curated catalogs when API key is missing
 */

import type { Dish } from './db';
import { formatCleanDishName, isDishVeg } from './dishAssets';

export function getApifyToken(): string {
  return (
    process.env.APIFY_TOKEN ||
    process.env.APIFY_API_KEY ||
    process.env.NEXT_PUBLIC_APIFY_TOKEN ||
    ''
  ).trim();
}

export function isApifyConfigured(): boolean {
  const token = getApifyToken();
  return Boolean(token && token.length > 10 && !token.includes('YourApifyTokenHere'));
}

export function getApifyActor(): string {
  const raw = (process.env.APIFY_SWIGGY_ACTOR || 'memo23/swiggy-scraper').trim();
  // Apify REST API requires username~actor-name instead of username/actor-name
  return raw.replace('/', '~');
}

// In-memory cache for live scraped Swiggy menus
interface CacheEntry {
  timestamp: number;
  dishes: Dish[];
}
const swiggyMenuCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function clearApifySwiggyCache(): void {
  swiggyMenuCache.clear();
}

/**
 * Normalizes restaurant name for optimal search matching on Swiggy
 */
function cleanRestaurantQuery(name: string): string {
  return name
    .replace(/\b(restaurant|hotel|the|famous|pure veg|family|bar|dining|canteen)\b/gi, '')
    .trim() || name;
}

/**
 * Builds full high-resolution Swiggy CDN photo URL from imageId or raw URL
 */
export function resolveSwiggyDishPhoto(item: any): string | null {
  if (!item || typeof item !== 'object') return null;

  // Check direct URL strings
  const directUrls = [
    item.imageUrl,
    item.image_url,
    item.image,
    item.dish_image,
    item.photo,
    item.picture,
    item.thumbnail
  ];

  for (const u of directUrls) {
    if (typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))) {
      return u;
    }
  }

  // Check Swiggy Cloudinary image IDs
  const rawId = item.imageId || item.cloudinaryImageId || item.dish_image_id || item.creativeId;
  if (rawId && typeof rawId === 'string' && rawId.trim().length > 3) {
    const cleanId = rawId.trim();
    // Swiggy Cloudinary CDN endpoint
    return `https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500,h_500,c_fit/${cleanId}`;
  }

  return null;
}

/**
 * Parses numeric price from various Swiggy pricing formats (paise or rupee strings)
 */
export function parseSwiggyPrice(rawPrice: any): number {
  if (typeof rawPrice === 'number') {
    // If price is in paise (e.g., 18000 for ₹180)
    if (rawPrice > 1000) return Math.round(rawPrice / 100);
    return Math.round(rawPrice);
  }
  if (typeof rawPrice === 'string') {
    const cleaned = rawPrice.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      if (num > 1000) return Math.round(num / 100);
      return Math.round(num);
    }
  }
  return 140; // Sensible default
}

/**
 * Flattens all dishes from various Apify Actor dataset output schemas
 */
function collectRawDishesFromApifyOutput(items: any[]): any[] {
  const dishBucket: any[] = [];

  for (const record of items) {
    if (!record || typeof record !== 'object') continue;

    // Case 1: Record has a menu array (e.g. from memo23/swiggy-scraper)
    if (Array.isArray(record.menu)) {
      for (const m of record.menu) {
        if (Array.isArray(m.items)) dishBucket.push(...m.items);
        else if (Array.isArray(m.dishes)) dishBucket.push(...m.dishes);
        else dishBucket.push(m);
      }
    }

    // Case 2: Record has categories array containing items
    if (Array.isArray(record.categories)) {
      for (const cat of record.categories) {
        if (Array.isArray(cat.items)) dishBucket.push(...cat.items);
        else if (Array.isArray(cat.dishes)) dishBucket.push(...cat.dishes);
      }
    }

    // Case 3: Record has items or dishes array directly
    if (Array.isArray(record.items)) dishBucket.push(...record.items);
    if (Array.isArray(record.dishes)) dishBucket.push(...record.dishes);
    if (Array.isArray(record.menu_items)) dishBucket.push(...record.menu_items);

    // Case 4: Record is itself a dish (e.g. from searchType: "dish")
    const isDirectDish = Boolean(
      (record.dish_name || record.name || record.title) &&
      (record.price || record.finalPrice || record.imageId || record.description || record.dish_id) &&
      !record.menu && !record.categories
    );
    if (isDirectDish) {
      dishBucket.push(record);
    }
  }

  return dishBucket;
}

/**
 * Run a specific Apify actor with normalized payload
 */
async function callApifyActorSync(
  actorSlug: string,
  token: string,
  query: string,
  city: string,
  timeoutSec = 25
): Promise<any[]> {
  const actorId = actorSlug.replace('/', '~');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (timeoutSec + 3) * 1000);

  const isMemo = actorId.includes('memo23');
  const payload = isMemo
    ? {
        cities: [(city || 'pune').toLowerCase()],
        queries: [query],
        includeMenu: true,
        maxItems: 2,
        maxMenuItems: 15
      }
    : {
        queries: [query],
        city: (city || 'pune').toLowerCase(),
        searchType: 'restaurant',
        maxResults: 2
      };

  try {
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSec}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BakasurFoodTour/3.0'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`Apify actor ${actorId} returned status ${res.status}`);
      return [];
    }

    const items = await res.json();
    return Array.isArray(items) ? items : [];
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`Apify actor ${actorId} call notice:`, err.message || err);
    return [];
  }
}

/**
 * Live scrape restaurant menu items and images from Swiggy using Apify
 */
export async function fetchSwiggyDishesViaApify(
  restaurantName: string,
  city = 'Pune'
): Promise<Dish[]> {
  if (!isApifyConfigured()) {
    return [];
  }

  const query = cleanRestaurantQuery(restaurantName);
  const cacheKey = `${query.toLowerCase()}_${(city || 'pune').toLowerCase()}`;
  const cached = swiggyMenuCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.dishes;
  }

  const token = getApifyToken();
  const primaryActor = getApifyActor();

  // 1. Try primary actor (defaults to memo23/swiggy-scraper which extracts live menu items & photos)
  let items = await callApifyActorSync(primaryActor, token, query, city, 25);
  let rawDishes = collectRawDishesFromApifyOutput(items);

  // 2. If primary was thirdwatch or returned no menu items, try memo23 as fallback for dishes
  if (rawDishes.length === 0 && !primaryActor.includes('memo23')) {
    items = await callApifyActorSync('memo23/swiggy-scraper', token, query, city, 25);
    rawDishes = collectRawDishesFromApifyOutput(items);
  }

  if (rawDishes.length === 0) {
    return [];
  }

  const extractedDishes: Dish[] = [];
  const seenNames = new Set<string>();

  for (const item of rawDishes) {
    const rawName = item.name || item.dish_name || item.title || item.itemName || '';
    if (!rawName || typeof rawName !== 'string' || rawName.trim().length < 2) continue;

    const cleanName = formatCleanDishName(rawName.trim(), restaurantName);
    const lower = cleanName.toLowerCase();
    if (seenNames.has(lower)) continue;
    seenNames.add(lower);

    const price = parseSwiggyPrice(
      item.price ?? item.defaultPrice ?? item.finalPrice ?? item.original_price ?? item.originalPrice
    );
    const description = (
      item.description ||
      item.desc ||
      `Authentic specialty freshly prepared at ${restaurantName} on Swiggy`
    ).trim();

    const swiggyPhoto = resolveSwiggyDishPhoto(item);

    // Build AI-cutout dish image URL with original Swiggy photo as high-res source
    const finalDishImageUrl = swiggyPhoto
      ? `/api/ai/dish-image?dish=${encodeURIComponent(cleanName)}&restaurant=${encodeURIComponent(restaurantName)}&imgUrl=${encodeURIComponent(swiggyPhoto)}`
      : `/api/ai/dish-image?dish=${encodeURIComponent(cleanName)}&restaurant=${encodeURIComponent(restaurantName)}`;

    const rawRating = item.rating?.rating || item.dish_rating || item.rating;
    const parsedRating = typeof rawRating === 'number' && rawRating > 0 && rawRating <= 5 ? rawRating : 4.8;

    extractedDishes.push({
      id: 900000 + extractedDishes.length + 1,
      restaurant_id: 1,
      name: cleanName,
      description,
      price,
      image: finalDishImageUrl,
      rating: parsedRating,
      popularity: item.isBestseller ? 100 : 98,
      is_recommended: extractedDishes.length < 3 ? 1 : 0,
      status: 'active'
    });

    if (extractedDishes.length >= 15) break;
  }

  if (extractedDishes.length > 0) {
    swiggyMenuCache.set(cacheKey, { timestamp: Date.now(), dishes: extractedDishes });
  }

  return extractedDishes;
}

/**
 * Diagnostic tool to test the Apify connection and view scraped dishes
 */
export async function testApifySwiggyConnection(
  restaurantName = 'Vaishali',
  city = 'Pune'
) {
  const configured = isApifyConfigured();
  const token = getApifyToken();
  const actor = getApifyActor();

  if (!configured) {
    return {
      success: false,
      configured: false,
      actor,
      error: 'APIFY_TOKEN is not set in environment or .env.local',
      instructions: 'Add APIFY_TOKEN=your_token_here to .env.local and restart Next.js server.'
    };
  }

  const startTime = Date.now();
  try {
    const dishes = await fetchSwiggyDishesViaApify(restaurantName, city);
    const durationMs = Date.now() - startTime;

    return {
      success: true,
      configured: true,
      actor,
      restaurant: restaurantName,
      city,
      durationMs,
      dishCount: dishes.length,
      sampleDishes: dishes.slice(0, 5).map(d => ({
        name: d.name,
        price: d.price,
        rating: d.rating,
        image: d.image,
        description: d.description
      }))
    };
  } catch (err: any) {
    return {
      success: false,
      configured: true,
      actor,
      restaurant: restaurantName,
      city,
      durationMs: Date.now() - startTime,
      error: err.message || String(err)
    };
  }
}
