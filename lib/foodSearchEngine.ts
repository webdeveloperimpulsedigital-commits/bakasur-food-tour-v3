/**
 * Swiggy & Zomato-Style Intelligent Food, Restaurant, Menu & Image Search Engine
 * Handles:
 *  - Lexical, Phonetic & Typo-Tolerant Query Matching
 *  - Dual-Entity Intent Recognition (Food/Dish vs Restaurant vs Cuisine vs Locality)
 *  - Cross-Entity Relational Matching (e.g. searching "Biryani" returns top restaurants serving Biryani)
 *  - Smart Relevance Ranking with Distance & Popularity Boost
 *  - Verified High-Res Food Plate & Animated Eating Cutout Asset Mapping
 *  - 100% Reliable Fallback Pipeline (Zero broken images)
 */

import { Restaurant, Dish } from './db';
import { getDishVisualAssets, formatCleanDishName } from './dishAssets';
import { generateLiveMenuForRestaurant, CUISINE_MENUS, ICONIC_RESTAURANT_DISHES } from './liveMenu';
import { parseRestaurantQuery } from './locationParser';
import { getDeterministicPlaceId } from './livePlaces';

// ============================================================================
// 1. DICTIONARIES, SYNONYMS, TYPO MAPPINGS & CUISINE TAXONOMY
// ============================================================================

export interface FoodCategory {
  id: number;
  slug: string;
  name: string;
  hindiName: string;
  icon: string;
  keywords: string[];
  signatureImage: string;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    id: 1,
    slug: 'biryani-rice',
    name: 'Biryani & Rice',
    hindiName: 'बिरयानी और चावल',
    icon: '🍚',
    keywords: ['biryani', 'biriyani', 'briyani', 'pulao', 'pulav', 'fried rice', 'schezwan rice', 'tahari', 'khichdi', 'curd rice'],
    signatureImage: '/images/eating/biryani_dish.jpg'
  },
  {
    id: 2,
    slug: 'north-indian-curries',
    name: 'North Indian & Mughlai',
    hindiName: 'उत्तर भारतीय और मुगलई',
    icon: '🥘',
    keywords: ['butter chicken', 'paneer butter masala', 'paneer', 'dal makhani', 'korma', 'rogan josh', 'kadai', 'handi', 'tikka masala', 'naan', 'roti', 'paratha'],
    signatureImage: '/images/eating/butter_chicken_dish.jpg'
  },
  {
    id: 3,
    slug: 'maharashtrian-local',
    name: 'Maharashtrian Special',
    hindiName: 'महाराष्ट्रीयन स्पेशल',
    icon: '🍲',
    keywords: ['misal', 'misal pav', 'katakirr', 'tarri', 'rassa', 'tambda pandhra rassa', 'pithla bhakri', 'bhakri', 'puran poli', 'thalipeeth', 'modak', 'kothimbir vadi'],
    signatureImage: '/images/eating/misal_dish.jpg'
  },
  {
    id: 4,
    slug: 'street-food-chaat',
    name: 'Street Food & Chaat',
    hindiName: 'स्ट्रीट फूड और चाट',
    icon: '🥪',
    keywords: ['vada pav', 'vadapav', 'wada pav', 'batata vada', 'pav bhaji', 'pavbhaji', 'samosa', 'pani puri', 'golgappe', 'puchka', 'spdp', 'bhel', 'sev puri', 'dahi samosa'],
    signatureImage: '/images/eating/vada_pav_dish.jpg'
  },
  {
    id: 5,
    slug: 'south-indian-tiffin',
    name: 'South Indian & Tiffin',
    hindiName: 'साउथ इंडियन और नाश्ता',
    icon: '🥞',
    keywords: ['dosa', 'masala dosa', 'benne dosa', 'idli', 'thatte idli', 'medu vada', 'uttapam', 'appam', 'podi', 'sambar', 'filter coffee', 'upma', 'sheera'],
    signatureImage: '/images/eating/dosa_dish.jpg'
  },
  {
    id: 6,
    slug: 'kebabs-tandoori',
    name: 'Kebabs & Tandoor',
    hindiName: 'कबाब और तंदूरी',
    icon: '🍢',
    keywords: ['tandoori', 'tikka', 'kebab', 'kabab', 'seekh', 'galouti', 'lollipop', 'chicken lollipop', 'baida roti', 'shawarma', 'rolls', 'kathi roll'],
    signatureImage: '/images/eating/tandoori_chicken_tikka.jpg'
  },
  {
    id: 7,
    slug: 'chinese-asian',
    name: 'Chinese & Momos',
    hindiName: 'चाइनीज और मोमोज',
    icon: '🥟',
    keywords: ['momos', 'momo', 'dimsum', 'dumpling', 'triple schezwan', 'manchurian', 'noodles', 'chowmein', 'chilli chicken', 'spring roll'],
    signatureImage: '/images/eating/momos_dish.jpg'
  },
  {
    id: 8,
    slug: 'burgers-pizzas',
    name: 'Pizzas & Burgers',
    hindiName: 'पिज़्ज़ा और बर्गर',
    icon: '🍕',
    keywords: ['pizza', 'burger', 'pasta', 'fries', 'french fries', 'sandwich', 'garlic bread', 'cheese burst', 'wrap'],
    signatureImage: '/images/eating/pizza_dish.jpg'
  },
  {
    id: 9,
    slug: 'chai-cafe-beverages',
    name: 'Chai, Coffee & Cafe',
    hindiName: 'चाय, कॉफी और कैफे',
    icon: '☕',
    keywords: ['bun maska', 'irani chai', 'chai', 'tea', 'cold coffee', 'coffee', 'frappe', 'latte', 'cappuccino', 'lassi', 'milkshake', 'shake'],
    signatureImage: '/images/eating/bun_maska_dish.jpg'
  },
  {
    id: 10,
    slug: 'desserts-sweets',
    name: 'Desserts & Sweets',
    hindiName: 'मिठाई और आइसक्रीम',
    icon: '🍨',
    keywords: ['mastani', 'falooda', 'faluda', 'kulfi', 'ice cream', 'gulab jamun', 'rasgulla', 'jalebi', 'kheer', 'rabdi', 'halwa', 'pastry', 'waffle'],
    signatureImage: '/images/eating/falooda_kulfi_dish.jpg'
  },
  {
    id: 11,
    slug: 'coastal-seafood',
    name: 'Coastal & Seafood',
    hindiName: 'सीफूड और फिश',
    icon: '🐟',
    keywords: ['fish', 'fish fry', 'surmai', 'pomfret', 'prawns', 'crab', 'malvani', 'solkadhi', 'seafood thali'],
    signatureImage: '/images/eating/seafood_dish.jpg'
  },
  {
    id: 12,
    slug: 'traditional-thali',
    name: 'Grand Indian Thalis',
    hindiName: 'शाही थाली',
    icon: '🍽️',
    keywords: ['thali', 'maharashtrian thali', 'mutton thali', 'gavran thali', 'punjabi thali', 'rajasthani thali', 'gujarati thali', 'shahi thali'],
    signatureImage: '/images/eating/thali_dish.jpg'
  }
];

// Common Indian culinary spelling variations and typos mapping
export const SPELLING_TYPOS_MAP: Record<string, string> = {
  // Biryani
  'briyani': 'biryani',
  'biriyani': 'biryani',
  'biryany': 'biryani',
  'baryani': 'biryani',
  'biriani': 'biryani',
  'byriani': 'biryani',
  'pulav': 'pulao',
  'pulavv': 'pulao',

  // Chicken & Non-Veg
  'chiken': 'chicken',
  'chikn': 'chicken',
  'chikin': 'chicken',
  'chk': 'chicken',
  'murg': 'murgh',
  'kukkad': 'chicken',
  'mutton': 'mutton',
  'muton': 'mutton',
  'gosht': 'mutton',
  'kheema': 'keema',
  'qeema': 'keema',

  // Paneer
  'paner': 'paneer',
  'panner': 'paneer',
  'paneer': 'paneer',

  // Vada Pav & Street Snacks
  'vadapav': 'vada pav',
  'wada pav': 'vada pav',
  'wadapav': 'vada pav',
  'vada pao': 'vada pav',
  'wada pao': 'vada pav',
  'pavbhaji': 'pav bhaji',
  'pao bhaji': 'pav bhaji',
  'paobhaji': 'pav bhaji',
  'pao baji': 'pav bhaji',
  'bhaji pav': 'pav bhaji',
  'misal': 'misal',
  'missal': 'misal',
  'misalpav': 'misal pav',
  'missal pav': 'misal pav',
  'katakir': 'katakirr',
  'katkrr': 'katakirr',
  'samosas': 'samosa',
  'smosa': 'samosa',
  'somosa': 'samosa',
  'panipuri': 'pani puri',
  'golgappa': 'pani puri',
  'golgappe': 'pani puri',
  'puchka': 'pani puri',
  'poochka': 'pani puri',
  'bhel puri': 'bhel',
  'bhelpuri': 'bhel',

  // South Indian
  'dhosa': 'dosa',
  'dosai': 'dosa',
  'dhose': 'dosa',
  'idly': 'idli',
  'idle': 'idli',
  'meduvada': 'medu vada',
  'utpam': 'uttapam',
  'uttapam': 'uttapam',
  'uthappam': 'uttapam',

  // Chole Bhature
  'choley': 'chole',
  'bhatura': 'bhature',
  'bature': 'bhature',
  'bhaturey': 'bhature',
  'chola bhatura': 'chole bhature',
  'chole bature': 'chole bhature',

  // Chinese & Momos
  'momo': 'momos',
  'momoes': 'momos',
  'dimsums': 'dimsum',
  'schezwan': 'schezwan',
  'shezwan': 'schezwan',
  'sehzwan': 'schezwan',
  'sezwan': 'schezwan',
  'schzwan': 'schezwan',
  'manchurian': 'manchurian',
  'manchorian': 'manchurian',
  'noodles': 'noodles',
  'nudles': 'noodles',
  'nuduls': 'noodles',
  'chowmin': 'chowmein',
  'chaumin': 'chowmein',

  // Kebabs & Tandoor
  'kabab': 'kebab',
  'kababs': 'kebab',
  'kebabs': 'kebab',
  'shwarma': 'shawarma',
  'shawrma': 'shawarma',
  'shavarma': 'shawarma',
  'lolipop': 'lollipop',
  'chiken lollipop': 'chicken lollipop',

  // Cafe & Desserts
  'cofy': 'coffee',
  'coffe': 'coffee',
  'cofee': 'coffee',
  'kafee': 'coffee',
  'chay': 'chai',
  'chaai': 'chai',
  'faluda': 'falooda',
  'faludha': 'falooda',
  'kulfy': 'kulfi',
  'mastany': 'mastani',
  'icecream': 'ice cream',
  'gulabjamun': 'gulab jamun',
  'rasgula': 'rasgulla',
  'jalebi': 'jalebi',
  'jalabi': 'jalebi',

  // Fast food
  'piza': 'pizza',
  'pizzas': 'pizza',
  'pzza': 'pizza',
  'burgar': 'burger',
  'burgur': 'burger',
  'sandwhich': 'sandwich',
  'sandwitch': 'sandwich'
};

// ============================================================================
// 2. QUERY NORMALIZER & INTENT DETECTOR
// ============================================================================

export interface QueryIntent {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  isDishSearch: boolean;
  matchedCategory: FoodCategory | null;
  canonicalDishName: string | null;
  targetLocality: string | null;
  targetCity: string | null;
}

/**
 * Normalizes query string with typo correction and intent extraction
 */
export function analyzeFoodQuery(query: string, fallbackCity = 'Pune'): QueryIntent {
  const raw = (query || '').trim();
  const lower = raw.toLowerCase();

  // 1. Tokenize and normalize typos
  const rawTokens = lower
    .replace(/[^\w\s,/-]/g, ' ')
    .split(/[\s,/-]+/)
    .filter(Boolean);

  const correctedTokens: string[] = [];
  for (const t of rawTokens) {
    if (SPELLING_TYPOS_MAP[t]) {
      correctedTokens.push(...SPELLING_TYPOS_MAP[t].split(' '));
    } else {
      correctedTokens.push(t);
    }
  }

  const normalizedQuery = correctedTokens.join(' ');

  // 2. Check category matching
  let matchedCategory: FoodCategory | null = null;
  let canonicalDishName: string | null = null;

  for (const cat of FOOD_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (normalizedQuery.includes(kw) || correctedTokens.includes(kw)) {
        matchedCategory = cat;
        canonicalDishName = kw;
        break;
      }
    }
    if (matchedCategory) break;
  }

  // 3. Location detection
  const parsedLoc = parseRestaurantQuery(raw, fallbackCity, null);
  const targetLocality = parsedLoc.area !== parsedLoc.city ? parsedLoc.area : null;
  const targetCity = parsedLoc.city;

  // 4. Intent detection: Dish search vs pure restaurant search
  const isDishSearch = Boolean(matchedCategory || canonicalDishName);

  return {
    rawQuery: raw,
    normalizedQuery,
    tokens: correctedTokens,
    isDishSearch,
    matchedCategory,
    canonicalDishName,
    targetLocality,
    targetCity
  };
}

// ============================================================================
// 3. SWIGGY / ZOMATO RESTAURANT & DISH SEARCH ENGINE
// ============================================================================

export interface SearchMatchResult {
  restaurant: Restaurant;
  relevanceScore: number;
  matchType: 'exact_restaurant' | 'dish_match' | 'cuisine_match' | 'locality_match' | 'fuzzy_match';
  matchedDish?: Dish;
  highlightedDishes?: Dish[];
}

/**
 * Calculate Levenshtein Distance for fuzzy tolerance
 */
export function calculateLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Perform Swiggy/Zomato style restaurant search
 * - If user types "Biryani": returns restaurants renowned for Biryani, highlighting their Biryani dishes
 * - If user types "Vaishali": returns Vaishali Restaurant with top rating
 * - If user types "Kothrud Misal": returns Misal spots in Kothrud
 */
export function searchRestaurantsSwiggyZomato(
  restaurants: Restaurant[],
  query: string,
  userCoords?: { lat: number; lng: number } | null,
  city = 'Pune'
): Restaurant[] {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return restaurants;
  }

  const intent = analyzeFoodQuery(trimmed, city);
  const qLower = intent.normalizedQuery;
  const tokens = intent.tokens.filter(t => !['and', 'the', 'near', 'hotel', 'restaurant', 'pure', 'veg'].includes(t));

  const results: SearchMatchResult[] = [];

  for (const rest of restaurants) {
    const rName = (rest.name || '').toLowerCase().trim();
    const rArea = (rest.area || '').toLowerCase().trim();
    const rCity = (rest.city || '').toLowerCase().trim();
    const rDesc = (rest.description || '').toLowerCase();
    const fullText = `${rName} ${rArea} ${rCity} ${rDesc}`;

    let score = 0;
    let matchType: SearchMatchResult['matchType'] = 'fuzzy_match';
    let matchedDish: Dish | undefined = undefined;

    // 1. Direct Restaurant Name Matches (Highest Priority)
    if (rName === qLower) {
      score += 2500;
      matchType = 'exact_restaurant';
    } else if (rName.startsWith(qLower)) {
      score += 2000;
      matchType = 'exact_restaurant';
    } else if (rName.includes(qLower)) {
      score += 1600;
      matchType = 'exact_restaurant';
    }

    // 2. Dish / Menu Matching (Swiggy/Zomato Dish-Level Discovery)
    // Inspect restaurant's live menu to see if it specializes in the searched food
    const liveMenu = generateLiveMenuForRestaurant(rest);
    const matchingDishesInMenu = liveMenu.filter(d => {
      const dName = d.name.toLowerCase();
      const dDesc = (d.description || '').toLowerCase();
      const dishText = `${dName} ${dDesc}`;

      if (intent.canonicalDishName && dishText.includes(intent.canonicalDishName)) {
        return true;
      }
      return tokens.some(t => t.length >= 3 && dishText.includes(t));
    });

    if (matchingDishesInMenu.length > 0) {
      matchedDish = matchingDishesInMenu[0];
      const isTopDish = matchingDishesInMenu.some(d => d.popularity >= 98);
      const dishScore = isTopDish ? 1800 : 1400;

      if (dishScore > score) {
        score = dishScore;
        matchType = 'dish_match';
      }
    }

    // 3. Category & Cuisine Relevance
    if (intent.matchedCategory) {
      for (const kw of intent.matchedCategory.keywords) {
        if (fullText.includes(kw)) {
          score += 250;
          if (matchType === 'fuzzy_match') matchType = 'cuisine_match';
        }
      }
    }

    // 4. Locality Matching
    if (intent.targetLocality && (rArea.includes(intent.targetLocality.toLowerCase()) || fullText.includes(intent.targetLocality.toLowerCase()))) {
      score += 400;
      if (matchType === 'fuzzy_match') matchType = 'locality_match';
    }

    // 5. Token Substring Matches
    for (const t of tokens) {
      if (t.length >= 2) {
        if (rName.includes(t)) score += 300;
        else if (rArea.includes(t)) score += 150;
        else if (rDesc.includes(t)) score += 80;
      }
    }

    // 6. Fuzzy Levenshtein for Typos (if no strong score yet)
    if (score < 400) {
      const words = rName.split(/[\s,/-]+/);
      for (const w of words) {
        if (Math.abs(w.length - qLower.length) <= 2) {
          const dist = calculateLevenshtein(w, qLower);
          if (dist <= 2) {
            score += Math.max(0, 500 - dist * 150);
            matchType = 'fuzzy_match';
            break;
          }
        }
      }
    }

    // 7. Distance & Rating Adjustments
    if (score > 0) {
      // Proximity boost (closer gets up to +200)
      if (typeof rest.distanceKm === 'number' && rest.distanceKm >= 0) {
        const distanceBoost = Math.max(0, 200 - Math.min(200, rest.distanceKm * 20));
        score += distanceBoost;
      }

      // Rating boost (high rated restaurants get up to +150)
      if (rest.rating) {
        score += Math.round(rest.rating * 30);
      }

      // Popularity/visits boost
      if (rest.total_visits) {
        score += Math.min(100, Math.round(rest.total_visits / 30));
      }

      // Visual Image enrichment: Ensure restaurant has verified cuisine image
      const verifiedImage = rest.image && !rest.image.includes('placeholder')
        ? rest.image
        : (intent.matchedCategory?.signatureImage || '/images/eating/thali_dish.jpg');

      results.push({
        restaurant: {
          ...rest,
          image: verifiedImage
        },
        relevanceScore: score,
        matchType,
        matchedDish,
        highlightedDishes: matchingDishesInMenu.slice(0, 3)
      });
    }
  }

  // Sort strictly by Swiggy/Zomato relevance score descending
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return the ranked restaurants
  return results.map(r => r.restaurant);
}

// ============================================================================
// 4. SWIGGY / ZOMATO DISH & MENU SEARCH ENGINE
// ============================================================================

export interface DishSearchResult {
  dish: Dish;
  score: number;
}

/**
 * Perform Swiggy/Zomato style dish search within a restaurant's menu
 * and across the culinary knowledge base
 */
export function searchDishesSwiggyZomato(
  restaurant: Restaurant,
  query: string,
  existingDishes?: Dish[]
): Dish[] {
  const trimmed = (query || '').trim();
  const baseMenu = existingDishes && existingDishes.length > 0
    ? existingDishes
    : generateLiveMenuForRestaurant(restaurant);

  if (!trimmed) {
    // Return top 15 menu dishes sorted by rating & popularity
    return [...baseMenu].sort((a, b) => {
      const rDiff = (b.rating || 0) - (a.rating || 0);
      if (Math.abs(rDiff) > 0.01) return rDiff;
      return (b.popularity || 0) - (a.popularity || 0);
    });
  }

  const intent = analyzeFoodQuery(trimmed, restaurant.city || 'Pune');
  const qLower = intent.normalizedQuery;
  const tokens = intent.tokens;

  const scored: DishSearchResult[] = [];
  const seenDishNames = new Set<string>();

  // 1. Search Within Restaurant's Current Active Menu
  for (const dish of baseMenu) {
    const dName = dish.name.toLowerCase().trim();
    const dDesc = (dish.description || '').toLowerCase();
    const fullText = `${dName} ${dDesc}`;

    let score = 0;

    // Exact name match
    if (dName === qLower || dName === intent.rawQuery.toLowerCase()) {
      score += 2500;
    } else if (dName.startsWith(qLower)) {
      score += 2000;
    } else if (dName.includes(qLower)) {
      score += 1500;
    }

    // Canonical dish match
    if (intent.canonicalDishName && fullText.includes(intent.canonicalDishName)) {
      score += 1200;
    }

    // Category match
    if (intent.matchedCategory) {
      for (const kw of intent.matchedCategory.keywords) {
        if (fullText.includes(kw)) score += 200;
      }
    }

    // Token matching
    for (const t of tokens) {
      if (t.length >= 2) {
        if (dName.includes(t)) score += 350;
        else if (dDesc.includes(t)) score += 100;
      }
    }

    // Fuzzy Levenshtein for typos
    if (score < 400) {
      const words = dName.split(/[\s,/-]+/);
      for (const w of words) {
        if (Math.abs(w.length - qLower.length) <= 2) {
          const dist = calculateLevenshtein(w, qLower);
          if (dist <= 2) {
            score += Math.max(0, 450 - dist * 150);
            break;
          }
        }
      }
    }

    if (score > 0) {
      // Popularity and rating weighting
      score += (dish.popularity || 90) * 2;
      score += Math.round((dish.rating || 4.5) * 40);

      // Map verified high-res food image via DishAsset engine
      const visual = getDishVisualAssets(dish.name, dish.image);
      const cleanName = formatCleanDishName(dish.name, restaurant.name);

      seenDishNames.add(cleanName.toLowerCase());
      scored.push({
        dish: {
          ...dish,
          name: cleanName,
          image: visual.flyingImage || visual.plateImage
        },
        score
      });
    }
  }

  // Swiggy & Zomato In-Restaurant Menu Search:
  // Strictly return matching dishes within this restaurant's own catalog only.
  // Never leak dishes from other restaurants or synthesize unauthentic items.
  const isPureVegRest = (restaurant.is_veg === 1) ||
    restaurant.name.toLowerCase().includes('pure veg') ||
    (restaurant.name.toLowerCase().includes('veg') && !restaurant.name.toLowerCase().includes('non-veg') && !restaurant.name.toLowerCase().includes('non veg'));

  const filtered = isPureVegRest
    ? scored.filter(s => {
        const lower = s.dish.name.toLowerCase();
        return !['chicken', 'mutton', 'fish', 'prawn', 'egg', 'anda', 'meat', 'pork', 'beef', 'seafood', 'crab'].some(kw => lower.includes(kw));
      })
    : scored;

  filtered.sort((a, b) => b.score - a.score);

  return filtered.map(s => s.dish);
}

