/**
 * Universal AI Dish Visual Assets Generator
 * Generates dynamic AI-based pure food PNG images in real-time with ZERO background.
 * Checks the user-selected restaurant and the chosen menu item dynamically.
 */

export interface DishVisualAssets {
  plateImage: string;
  flyingImage: string;
}

export function formatCleanDishName(dishName?: string, restaurantName?: string): string {
  if (!dishName) return 'Signature Dish';
  let name = dishName.trim();

  if (restaurantName) {
    const restClean = restaurantName.split(',')[0].trim();
    if (restClean) {
      const escaped = restClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Remove prepended "RestaurantName ," or "RestaurantName -"
      const prefixRegex = new RegExp(`^${escaped}\\s*[,\\-:]\\s*`, 'i');
      name = name.replace(prefixRegex, '');

      // Remove repeated "Special RestaurantName Special"
      const specRestSpec = new RegExp(`Special\\s+${escaped}\\s+Special`, 'gi');
      name = name.replace(specRestSpec, 'Special');
    }
  }

  // Remove duplicate consecutive "Special Special"
  name = name.replace(/\bSpecial\s+Special\b/gi, 'Special');

  // Clean double spaces or comma artifacts
  name = name.replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '').trim();

  return name || 'Signature Dish';
}

export function isDishVeg(dishName?: string): boolean {
  if (!dishName) return true;
  const n = dishName.toLowerCase();

  // Non-veg meats and poultry ALWAYS make a dish non-veg
  const meatKeywords = [
    'chicken', 'mutton', 'egg', 'anda', 'fish', 'prawn', 'prawns', 'crab',
    'bombil', 'surmai', 'pomfret', 'meat', 'gosht', 'bokud', 'bolai',
    'tangdi', 'lamb', 'beef', 'pork', 'bacon', 'nihari', 'paya',
    'seafood', 'duck', 'turkey', 'rawas', 'kolambi', 'clams', 'lobster',
    'zinger', 'fried chicken', 'kfc'
  ];
  if (meatKeywords.some(kw => new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i').test(n))) {
    return false;
  }

  // Explicit vegetarian identifiers
  if (
    n.includes('paneer') || n.includes('pure veg') || n.includes('veg thali') ||
    n.includes('soya') || n.includes('dal') || n.includes('aloo') || n.includes('gobi') ||
    n.includes('dosa') || n.includes('idli') || n.includes('sambar') || n.includes('vada pav') ||
    n.includes('misal') || n.includes('pav bhaji') || n.includes('hara bhara') ||
    n.includes('dahi ke') || n.includes('mushroom') || n.includes('corn') ||
    n.includes('palak') || n.includes('methi') || n.includes('matar') || n.includes('bhindi') ||
    n.includes('chole') || n.includes('rajma') || n.includes('baingan') || n.includes('kadhi') ||
    n.includes('kachori') || n.includes('samosa') || n.includes('bhel') || n.includes('poha') ||
    n.includes('upma') || n.includes('dhokla') || n.includes('khichdi') || n.includes('barfi') ||
    n.includes('katli') || n.includes('ladoo') || n.includes('jalebi') || n.includes('rasmalai') ||
    n.includes('gulab jamun') || n.includes('modak') || n.includes('puran poli') ||
    n.includes('thalipeeth') || n.includes('kothimbir') || n.includes('alu vadi') ||
    n.includes('solkadhi') || n.includes('taak') || n.includes('lassi') ||
    n.includes('pithla') || n.includes('pitla') || n.includes('bhakri') ||
    n.includes('bharli vangi') || n.includes('varan bhat') || n.includes('varan') ||
    n.includes('katachi amti') || n.includes('amti') || n.includes('shev bhaji') ||
    n.includes('rassa bhaji') || n.includes('sukhi bhaji') || n.includes('masala bhaat') ||
    n.includes('masale bhat') || n.includes('shrikhand') || n.includes('aamras') ||
    n.includes('mattha') || n.includes('khamang kakdi') || n.includes('sabudana') ||
    n.includes('matki') || n.includes('usal') || n.includes('aluchi bhaji') ||
    n.includes('fadfade') || n.includes('puneri thali') || n.includes('dadpe pohe') ||
    /\bveg\b/i.test(n) || /\bvegetarian\b/i.test(n)
  ) {
    return true;
  }

  const otherNonVegKeywords = [
    'keema', 'kheema', 'galouti', 'seekh', 'non veg', 'non-veg', 'nonveg',
    'tandoori chicken', 'kebab', 'kabab', 'shawarma', 'sukka', 'gavran', 'tambda', 'pandhra', 'rassa'
  ];
  return !otherNonVegKeywords.some(kw => n.includes(kw));
}

/**
 * Universal Pure Vegetarian Restaurant Validator
 * Validates whether an establishment is strictly a vegetarian institution.
 * Prevents non-vegetarian items (like chicken or mutton) from ever appearing
 * in the menus of pure-veg heritage dining halls, sweets, or Maharashtrian cultural institutions.
 */
export function isPureVegRestaurantName(restaurantName?: string): boolean {
  if (!restaurantName) return false;
  const lower = restaurantName.toLowerCase().trim();

  // Explicit non-veg disqualifiers
  const nonVegTerms = [
    'non-veg', 'non veg', 'nonveg', 'mutton', 'chicken', 'fish', 'seafood',
    'prawn', 'crab', 'meat', 'military', 'biryani house', 'kebab', 'kabab',
    'bar', 'pub', 'permit room', 'kfc', 'burger king', 'mcdonald'
  ];
  if (nonVegTerms.some(term => lower.includes(term))) {
    return false;
  }

  // Heritage vegetarian landmarks and pure-veg indicators
  const vegLandmarks = [
    'poona guest house', 'poona guest', 'durvankur', 'shreyas', 'sukanta',
    'badshahi', 'shabree', 'sujata mastani', 'sujata', 'chitale bandhu',
    'chitale', 'bedekar tea stall', 'bedekar', 'bipin snacks', 'bipin katta',
    'vaishali', 'roopali', 'hotel roopali', 'wadeshwar', 'girija pure veg',
    'ankur veg', 'visava pure veg', 'greens pure veg', 'gajanan vadapav',
    'mamledar misal', 'prashant corner', 'sardar refreshments', 'gurukripa',
    'anand stall', 'sita ram diwan chand', 'vidyarthi bhavan', 'shri sagar ctr',
    'ctr', 'mtr', 'corner house ice cream', 'k.c. das sweets', 'chutneys',
    'kaka halwai', 'bikanervala', 'haldiram'
  ];
  if (vegLandmarks.some(landmark => lower.includes(landmark))) {
    return true;
  }

  // Generic pure veg identifiers
  return (
    lower.includes('pure veg') ||
    lower.includes('pure-veg') ||
    (lower.includes('veg') && !lower.includes('non')) ||
    lower.includes('bhojanalay') ||
    lower.includes('bhojanalaya') ||
    lower.includes('shakahari') ||
    lower.includes('swayampakghar') ||
    lower.includes('swayampak') ||
    lower.includes('dining hall') ||
    lower.includes('dining room') ||
    lower.includes('khanawal') ||
    lower.includes('bhavan') ||
    lower.includes('udupi') ||
    lower.includes('udipi') ||
    lower.includes('dosa') ||
    lower.includes('idli') ||
    lower.includes('mithai') ||
    lower.includes('sweets') ||
    lower.includes('bhel') ||
    lower.includes('chaat') ||
    lower.includes('jain')
  );
}

/**
 * Universal Dish Visual Assets Resolver
 * Guarantees that ALL food items (searched or menu-generated) return
 * 100% pure food PNG format with NO background, dynamically generated by AI.
 * If an authentic dish photo URL exists (e.g. from Swiggy via Apify), it is passed
 * as the imgUrl source to create the cutout.
 */
export function getDishVisualAssets(dishName?: string, dishImage?: string, restaurantName?: string): DishVisualAssets {
  const cleanName = formatCleanDishName(dishName, restaurantName);

  // If dishImage is already an AI endpoint URL, check that it matches cleanName
  if (dishImage && dishImage.startsWith('/api/ai/dish-image')) {
    try {
      const url = new URL(dishImage, 'http://localhost');
      const urlDish = url.searchParams.get('dish') || '';
      if (urlDish && (cleanName.toLowerCase().includes(urlDish.toLowerCase().slice(0, 6)) || urlDish.toLowerCase().includes(cleanName.toLowerCase().slice(0, 6)))) {
        return {
          plateImage: dishImage,
          flyingImage: dishImage
        };
      }
    } catch {
      // ignore
    }
  }

  let aiPngUrl = `/api/ai/dish-image?dish=${encodeURIComponent(cleanName)}&restaurant=${encodeURIComponent(restaurantName || '')}&v=v30`;
  // Only forward verified remote Swiggy CDN or Cloudinary API images, never local assets or generic Unsplash URLs
  if (dishImage && (dishImage.startsWith('http://') || dishImage.startsWith('https://')) && (dishImage.includes('swiggy.com') || dishImage.includes('cloudinary.com'))) {
    aiPngUrl += `&imgUrl=${encodeURIComponent(dishImage)}`;
  }

  return {
    plateImage: aiPngUrl,
    flyingImage: aiPngUrl
  };
}

export function getMatchingFlyingCutout(dishName?: string, restaurantName?: string, dishImage?: string): string {
  return getDishVisualAssets(dishName, dishImage, restaurantName).flyingImage;
}

export function getDishExactPlateImage(dishName?: string, dishImage?: string, restaurantName?: string): string {
  return getDishVisualAssets(dishName, dishImage, restaurantName).plateImage;
}

export function getDishExactFlyingImage(dishName?: string, dishImage?: string, restaurantName?: string): string {
  return getDishVisualAssets(dishName, dishImage, restaurantName).flyingImage;
}
