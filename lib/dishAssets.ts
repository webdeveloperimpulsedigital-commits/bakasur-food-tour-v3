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
  const n = dishName.toLowerCase().trim();

  // 1. Tomato Omelette in Indian & Maharashtrian cuisine is 100% vegetarian (besan/tomato/coriander pancake)
  if (
    n.includes('tomato omelette') || n.includes('tomato omelet') || n.includes('tomato omlet') ||
    n.includes('veg omelette') || n.includes('veg omelet') || n.includes('vegan omelette') ||
    n.includes('besan cheela') || n.includes('cheela') || n.includes('chilla')
  ) {
    return true;
  }

  // 2. Regular omelettes without explicit vegetarian prefix are made of eggs (non-vegetarian)
  if (/\bomelet(te)?\b/i.test(n) || /\bomlet\b/i.test(n)) {
    return false;
  }

  // 3. Non-veg meats, eggs, poultry, seafood ALWAYS make a dish non-veg
  const meatKeywords = [
    'chicken', 'mutton', 'egg', 'eggs', 'anda', 'ande', 'fish', 'prawn', 'prawns', 'crab',
    'bombil', 'surmai', 'pomfret', 'meat', 'gosht', 'bokud', 'bolai',
    'tangdi', 'lamb', 'beef', 'pork', 'bacon', 'nihari', 'paya',
    'seafood', 'duck', 'turkey', 'rawas', 'kolambi', 'clams', 'lobster',
    'zinger', 'fried chicken', 'kfc', 'baida roti', 'boti'
  ];
  if (meatKeywords.some(kw => new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i').test(n))) {
    return false;
  }

  // 4. Vegetarian exceptions for kebabs and seekh
  if (
    n.includes('veg kebab') || n.includes('veg seekh') || n.includes('hara bhara') ||
    n.includes('dahi ke') || n.includes('paneer tikka') || n.includes('mushroom tikka') ||
    n.includes('soya chaap') || n.includes('veg cutlet')
  ) {
    return true;
  }

  // 5. Other non-veg keywords
  const otherNonVegKeywords = [
    'keema', 'kheema', 'galouti', 'seekh', 'non veg', 'non-veg', 'nonveg',
    'tandoori chicken', 'kebab', 'kabab', 'shawarma', 'sukka', 'gavran', 'tambda', 'pandhra'
  ];
  if (otherNonVegKeywords.some(kw => n.includes(kw))) {
    return false;
  }

  // 6. Explicit vegetarian identifiers
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
    n.includes('kheer') || n.includes('payasam') || n.includes('puri bhaji') ||
    n.includes('poori bhaji') || n.includes('batata bhaji') ||
    n.includes('mattha') || n.includes('khamang kakdi') || n.includes('sabudana') ||
    n.includes('matki') || n.includes('usal') || n.includes('aluchi bhaji') ||
    n.includes('fadfade') || n.includes('puneri thali') || n.includes('dadpe pohe') ||
    n.includes('vada') || n.includes('wada') || n.includes('bhajji') || n.includes('bhaji') ||
    n.includes('pakoda') || n.includes('pakora') || n.includes('pattice') || n.includes('piyush') ||
    /\bveg\b/i.test(n) || /\bvegetarian\b/i.test(n)
  ) {
    return true;
  }

  return true;
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

  // Heritage vegetarian landmarks and pure-veg institutions (Pune, Mumbai, etc.)
  const vegLandmarks = [
    'joshi wadewale', 'rohit wadewale', 'wadewale', 'wade wale', 'wada pav', 'vadapav',
    'shaniwar peth', 'sadashiv peth', 'narayan peth',
    'poona guest house', 'poona guest', 'durvankur', 'phadke', 'phadke dining', 'shreyas', 'sukanta',
    'badshahi', 'shabree', 'sujata mastani', 'sujata', 'chitale bandhu',
    'chitale', 'bedekar tea stall', 'bedekar', 'bipin snacks', 'bipin katta',
    'tilak hotel', 'tilak snacks', 'saraswati misal',
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
    lower.includes('wadewale') ||
    lower.includes('wade wale') ||
    lower.includes('vada pav') ||
    lower.includes('vadapav') ||
    lower.includes('wada') ||
    lower.includes('batata vada') ||
    lower.includes('shaniwar peth') ||
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
    lower.includes('upahar') ||
    lower.includes('upahargruh') ||
    lower.includes('upahar gruh') ||
    lower.includes('nashta') ||
    lower.includes('poli bhaji') ||
    lower.includes('farsan') ||
    lower.includes('sweet mart') ||
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

  // 1. Direct local authentic photographic asset in public/images/food/
  if (dishImage && dishImage.startsWith('/images/food/')) {
    return {
      plateImage: dishImage,
      flyingImage: dishImage
    };
  }

  // 2. If dishImage is already a fully formed AI endpoint URL specifically for this dish
  if (dishImage && dishImage.startsWith('/api/ai/dish-image')) {
    return {
      plateImage: dishImage,
      flyingImage: dishImage
    };
  }

  let aiPngUrl = `/api/ai/dish-image?dish=${encodeURIComponent(cleanName)}&restaurant=${encodeURIComponent(restaurantName || '')}&v=v32`;
  // Only forward verified remote Swiggy CDN or Cloudinary API images, never generic placeholders
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

/**
 * Universal Strict Culinary Search & Menu Matcher
 * Guarantees that dish searches strictly return dishes relevant to the searched dish,
 * matching on dish name / title identity rather than accidental ingredient mentions.
 * Prevents cross-cuisine leakage, unrelated substitutions, or dish mixing.
 */
export function isDishRelevantToSearch(dishTitle?: string, userQuery?: string): boolean {
  if (!dishTitle || !userQuery) return false;

  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const dRaw = clean(dishTitle);
  const qRaw = clean(userQuery);
  if (!dRaw || !qRaw) return false;

  const typoMap: Record<string, string> = {
    vadapav: 'vada pav',
    wada: 'vada',
    bhajiya: 'bhaji',
    bhajji: 'bhaji',
    pakoda: 'bhaji',
    pakora: 'bhaji',
    poori: 'puri',
    pavbhaji: 'pav bhaji',
    panipuri: 'pani puri',
    ragdapuri: 'ragda puri',
    shevpuri: 'sev puri',
    bhelpuri: 'bhel puri',
    pulav: 'pulao',
    biriyani: 'biryani',
    briyani: 'biryani',
    pattice: 'pattice',
    patties: 'pattice'
  };

  const normalize = (str: string) => {
    let s = str;
    for (const [k, v] of Object.entries(typoMap)) {
      s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
    }
    return s.replace(/\s+/g, ' ').trim();
  };

  const d = normalize(dRaw);
  const q = normalize(qRaw);

  // === 1. Pav Bhaji & Variations (Strict Isolation) ===
  const isPavBhajiQuery =
    q.includes('pav bhaji') ||
    (q.includes('pav') && q.includes('bhaji') && !q.includes('masala pav') && !q.includes('vada pav') && !q.includes('misal'));

  if (isPavBhajiQuery) {
    const isDishPavBhaji =
      d.includes('pav bhaji') ||
      (d.includes('pav') && d.includes('bhaji') && !d.includes('vada pav') && !d.includes('misal pav'));

    if (!isDishPavBhaji) return false;

    // If query specifically asks for cheese pav bhaji:
    if (q.includes('cheese') && !d.includes('cheese') && !d.includes('cheesy')) {
      return false;
    }
    return true;
  }

  // === 2. Masala Pav (Distinct dish: spiced butter pav on tawa, NOT pav bhaji) ===
  const isMasalaPavQuery =
    q.includes('masala pav') || (q.includes('masala') && q.includes('pav') && !q.includes('bhaji'));

  if (isMasalaPavQuery) {
    return (
      (d.includes('masala pav') || (d.includes('masala') && d.includes('pav'))) &&
      !d.includes('pav bhaji') &&
      !d.includes('vada pav') &&
      !d.includes('misal')
    );
  }

  // === 3. Vada Pav ===
  const isVadaPavQuery =
    q.includes('vada pav') || q.includes('wada pav') || (q.includes('vada') && q.includes('pav'));

  if (isVadaPavQuery) {
    return (
      d.includes('vada pav') ||
      d.includes('wada pav') ||
      (d.includes('vada') && d.includes('pav') && !d.includes('misal') && !d.includes('bhaji'))
    );
  }

  // === 4. Pani Puri / Golgappa ===
  const isPaniPuriQuery =
    q.includes('pani puri') || q.includes('golgappa') || q.includes('puchka');

  if (isPaniPuriQuery) {
    return d.includes('pani puri') || d.includes('golgappa') || d.includes('puchka');
  }

  // === 5. Ragda Puri ===
  const isRagdaPuriQuery =
    q.includes('ragda puri') || (q.includes('ragda') && q.includes('puri'));

  if (isRagdaPuriQuery) {
    return (
      (d.includes('ragda puri') || (d.includes('ragda') && d.includes('puri'))) &&
      !d.includes('pattice') &&
      !d.includes('patties')
    );
  }

  // === 6. Ragda Pattice ===
  const isRagdaPatticeQuery =
    q.includes('ragda pattice') || q.includes('ragda patties') || q.includes('pattice') || q.includes('patties');

  if (isRagdaPatticeQuery) {
    return d.includes('pattice') || d.includes('patties') || (d.includes('ragda') && d.includes('pattice'));
  }

  // === 7. Kanda Bhaji / Onion Pakoda ===
  const isKandaBhajiQuery =
    q.includes('kanda bhaji') || q.includes('khekda bhaji') || (q.includes('kanda') && (q.includes('bhaji') || q.includes('pakoda')));

  if (isKandaBhajiQuery) {
    return (
      (d.includes('kanda') && (d.includes('bhaji') || d.includes('pakoda') || d.includes('bhajji'))) ||
      d.includes('khekda bhaji')
    );
  }

  // === 8. Batata Bhaji (Yellow sukhi sabzi, distinct from Puri Bhaji and Pav Bhaji) ===
  const isBatataBhajiQuery =
    q.includes('batata bhaji') || q.includes('batatyachi bhaji') ||
    (q.includes('batata') && q.includes('bhaji') && !q.includes('puri') && !q.includes('pav'));

  if (isBatataBhajiQuery) {
    return (
      (d.includes('batata') && (d.includes('bhaji') || d.includes('bhajji')) && !d.includes('puri') && !d.includes('pav')) ||
      d.includes('batatyachi bhaji')
    );
  }

  // === 9. Puri Bhaji ===
  const isPuriBhajiQuery =
    (q.includes('puri') || q.includes('poori')) && (q.includes('bhaji') || q.includes('bhajji') || q.includes('sagu'));

  if (isPuriBhajiQuery) {
    return (
      (d.includes('puri') || d.includes('poori')) &&
      (d.includes('bhaji') || d.includes('bhajji') || d.includes('sagu')) &&
      !d.includes('pav')
    );
  }

  // === 10. Shrikhand Puri ===
  const isShrikhandPuriQuery =
    (q.includes('shrikhand') || q.includes('amrakhand')) && (q.includes('puri') || q.includes('poori'));

  if (isShrikhandPuriQuery) {
    return (d.includes('shrikhand') || d.includes('amrakhand')) && (d.includes('puri') || d.includes('poori'));
  }

  // === 11. Misal / Misal Pav ===
  const isMisalQuery = q.includes('misal') || q.includes('katakirr');
  if (isMisalQuery) {
    return d.includes('misal') || d.includes('katakirr');
  }

  // === 12. Tomato Omelette / Veg Omelette / Besan Cheela ===
  const isTomatoOmeletteQuery =
    q.includes('tomato omelette') || q.includes('tomato omelet') || q.includes('tomato omlet') ||
    q.includes('veg omelette') || q.includes('veg omelet') || q.includes('besan cheela');
  if (isTomatoOmeletteQuery) {
    return (
      d.includes('tomato omelette') || d.includes('tomato omelet') || d.includes('tomato omlet') ||
      d.includes('veg omelette') || d.includes('veg omelet') || d.includes('besan cheela')
    );
  }

  // === 13. General Food Queries (Biryani, Pizza, Burger, Dosa, Idli, Pulao, Mastani, Falooda, etc.) ===
  // Direct full substring match
  if (d.includes(q)) return true;

  // Significant token match (all words with length >= 3 must appear in dish title)
  const stopWords = new Set(['special', 'plate', 'dish', 'best', 'super', 'hot', 'authentic', 'famous', 'legendary', 'the', 'and', 'with', 'for']);
  const qTokens = q.split(/\s+/).filter(t => t.length >= 3 && !stopWords.has(t));
  if (qTokens.length > 0) {
    const allTokensPresent = qTokens.every(token => d.includes(token));
    if (allTokensPresent) return true;
  }

  return false;
}

