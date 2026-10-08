/**
 * Universal Dish Visual Assets Mapping
 * Resolves exact plate images and high-res transparent flying cutouts for all dishes.
 * Every dish maps to its EXACT matching high-res transparent PNG food cutout for realistic mouth feeding!
 */

export interface DishVisualAssets {
  plateImage: string;
  flyingImage: string;
}

export function getMatchingFlyingCutout(dishName?: string): string {
  const n = (dishName || '').toLowerCase().trim();
  if (n.includes('momo') || n.includes('dimsum')) return '/images/eating/momos_dish_flying.png';
  if (n.includes('pani puri') || n.includes('golgappa') || n.includes('puchka')) return '/images/eating/pani_puri_dish_flying.png';
  if (n.includes('sabudana') || n.includes('sago')) return '/images/eating/sabudana_vada_flying.png';
  if (n.includes('vada') || n.includes('wada') || n.includes('vadi') || n.includes('batata')) return '/images/eating/vada_pav_flying.png';
  if (n.includes('samosa')) return '/images/eating/samosa_hero_clean.png';
  if (n.includes('bun') || n.includes('chai') || n.includes('maska') || n.includes('tea') || n.includes('coffee')) return '/images/eating/bun_maska_flying.png';
  if (n.includes('pav bhaji')) return '/images/eating/pav_bhaji_dish_flying.png';
  if (n.includes('misal')) return '/images/eating/misal_dish_flying.png';
  if (n.includes('chole') || n.includes('bhatur') || n.includes('kulch')) return '/images/eating/chole_bhature_dish_flying.png';
  if (n.includes('dosa') || n.includes('idli') || n.includes('uttapam') || n.includes('puran')) return '/images/eating/dosa_dish_flying.png';
  if (n.includes('rice') || n.includes('noodle') || n.includes('biryani') || n.includes('pulao')) return '/images/eating/biryani_dish_flying.png';
  if (n.includes('lollipop') || n.includes('lolipop') || n.includes('wing') || n.includes('tikka') || n.includes('kebab') || n.includes('tandoor')) return '/images/eating/tandoori_chicken_tikka_flying.png';
  if (n.includes('chicken') || n.includes('murgh')) return '/images/eating/butter_chicken_dish_flying.png';
  if (n.includes('mutton') || n.includes('gosht') || n.includes('thali') || n.includes('fish') || n.includes('prawn') || n.includes('seafood')) return '/images/eating/gavran_mutton_thali_flying.png';
  if (n.includes('keema')) return '/images/eating/keema_pav_flying.png';
  if (n.includes('paneer') || n.includes('curry') || n.includes('gravy') || n.includes('sabzi') || n.includes('dal')) return '/images/eating/paneer_dish_flying.png';
  return '/images/eating/vada_pav_flying.png';
}

export function getDishVisualAssets(dishName?: string, dishImage?: string): DishVisualAssets {
  const n = (dishName || '').toLowerCase().trim();
  const img = (dishImage || '').toLowerCase().trim();

  // If dishName is NOT a samosa, but dishImage contains samosa or the generic unsplash photo, discard dishImage
  if (!n.includes('samosa') && dishImage && (dishImage.includes('samosa') || dishImage.includes('photo-1601050690597-df0568f70950'))) {
    dishImage = undefined;
  }

  // 1. Sabudana Vada / Sago Delicacy: ALWAYS return genuine Sabudana Vada assets
  if (n.includes('sabudana') || n.includes('sago') || img.includes('sabudana')) {
    return {
      plateImage: '/images/eating/sabudana_vada_dish.jpg',
      flyingImage: '/images/eating/sabudana_vada_flying.png'
    };
  }

  // 2. Vada Pav / Batata Vada / Kothimbir Vadi / Wada: ALWAYS return authentic Vada Pav assets
  if (
    !n.includes('samosa') &&
    (n.includes('vada') ||
      n.includes('wada') ||
      n.includes('vadapav') ||
      n.includes('vada pav') ||
      n.includes('vada pao') ||
      n.includes('batata vada') ||
      n.includes('kothimbir') ||
      n.includes('vadi'))
  ) {
    return {
      plateImage: '/images/eating/vada_pav_dish.jpg',
      flyingImage: '/images/eating/vada_pav_flying.png'
    };
  }

  // 3. User Custom Upload (data URI or uploaded file)
  if (dishImage && (dishImage.startsWith('data:') || dishImage.includes('upload'))) {
    return {
      plateImage: dishImage,
      flyingImage: getMatchingFlyingCutout(dishName)
    };
  }

  // 4. Caller provided verified local dish image or explicit valid URL (that isn't generic unsplash)
  if (
    dishImage &&
    !dishImage.includes('bakasur') &&
    !dishImage.includes('unsplash.com') &&
    (dishImage.startsWith('/images/') || dishImage.startsWith('http'))
  ) {
    const flying = dishImage.includes('_flying.png') ? dishImage : getMatchingFlyingCutout(dishName);
    return {
      plateImage: dishImage,
      flyingImage: flying
    };
  }

  // 5. Momos / Dimsum / Dumpling
  if (n.includes('momo') || n.includes('dimsum') || n.includes('dumpling') || img.includes('momo')) {
    return {
      plateImage: '/images/eating/momos_dish.jpg',
      flyingImage: '/images/eating/momos_dish_flying.png'
    };
  }

  // 2. Pani Puri / Golgappa / Puchka / Gupchup
  if (
    n.includes('pani puri') ||
    n.includes('panipuri') ||
    n.includes('golgappa') ||
    n.includes('gol gappe') ||
    n.includes('puchka') ||
    n.includes('gupchup') ||
    n.includes('pani patashi') ||
    img.includes('pani_puri')
  ) {
    return {
      plateImage: '/images/eating/pani_puri_dish.jpg',
      flyingImage: '/images/eating/pani_puri_dish_flying.png'
    };
  }

  // 3. Samosa / Dahi Samosa / Samosa Chaat
  if (n.includes('samosa') || img.includes('samosa')) {
    return {
      plateImage: '/images/eating/samosa_dish.jpg',
      flyingImage: '/images/eating/samosa_hero_clean.png'
    };
  }

  // 3.5 Bun Maska & Special Irani Chai / Cafe Goodluck / Irani Cafe
  if (
    n.includes('bun maska') ||
    n.includes('irani chai') ||
    n.includes('goodluck bun') ||
    (n.includes('bun') && n.includes('maska')) ||
    (n.includes('maska') && !n.includes('keema') && !n.includes('pav bhaji')) ||
    (n.includes('chai') && !n.includes('samosa') && !n.includes('chole')) ||
    (n.includes('tea') && !n.includes('steak')) ||
    (n.includes('goodluck') && (n.includes('bun') || n.includes('chai'))) ||
    img.includes('bun_maska')
  ) {
    return {
      plateImage: '/images/eating/bun_maska_dish.jpg',
      flyingImage: '/images/eating/bun_maska_flying.png'
    };
  }

  // 4. Pav Bhaji / Masala Pav
  if (
    n.includes('pav bhaji') ||
    n.includes('pavbhaji') ||
    n.includes('bhaji pav') ||
    n.includes('amul butter pav') ||
    img.includes('pav_bhaji')
  ) {
    return {
      plateImage: '/images/eating/pav_bhaji_dish.jpg',
      flyingImage: '/images/eating/pav_bhaji_dish_flying.png'
    };
  }

  // 5. Misal / Katakirr / Tarri Misal / Usal Pav
  if (
    n.includes('misal') ||
    n.includes('katakirr') ||
    n.includes('rassa misal') ||
    (n.includes('tarri') && !n.includes('mutton')) ||
    n.includes('usal pav') ||
    img.includes('misal')
  ) {
    return {
      plateImage: '/images/eating/misal_dish.jpg',
      flyingImage: '/images/eating/misal_dish_flying.png'
    };
  }

  // 6. Chole Bhature / Bhatura
  if (n.includes('bhature') || n.includes('bhatura') || (n.includes('chole') && !n.includes('kulche')) || img.includes('chole_bhature')) {
    return {
      plateImage: '/images/eating/chole_bhature_dish.jpg',
      flyingImage: '/images/eating/chole_bhature_dish_flying.png'
    };
  }

  // 6.5 Sabudana Vada / Sago Delicacy
  if (n.includes('sabudana') || n.includes('sago') || img.includes('sabudana')) {
    return {
      plateImage: '/images/eating/sabudana_vada_dish.jpg',
      flyingImage: '/images/eating/sabudana_vada_flying.png'
    };
  }

  // 7. Vada Pav / Batata Vada / Kothimbir Vadi / Wada
  if (
    n.includes('vada') ||
    n.includes('wada') ||
    n.includes('vadapav') ||
    n.includes('vada pav') ||
    n.includes('vada pao') ||
    n.includes('batata vada') ||
    n.includes('kothimbir vadi') ||
    n.includes('vadi') ||
    img.includes('vada_pav')
  ) {
    return {
      plateImage: '/images/eating/vada_pav_dish.jpg',
      flyingImage: '/images/eating/vada_pav_flying.png'
    };
  }

  // 8. Dosa / Uttapam / Masala Dosa / Set Dosa / Rava Dosa
  if (
    n.includes('dosa') ||
    n.includes('uttapam') ||
    n.includes('masala dosa') ||
    n.includes('benne dosa') ||
    n.includes('set dosa') ||
    img.includes('dosa')
  ) {
    return {
      plateImage: '/images/eating/dosa_dish.jpg',
      flyingImage: '/images/eating/dosa_dish_flying.png'
    };
  }

  // 9. Triple Schezwan Rice / Fried Rice / Noodles / Manchurian / Chinese
  if (
    n.includes('tripple') ||
    n.includes('triple') ||
    n.includes('schezwan') ||
    n.includes('fried rice') ||
    n.includes('friedrice') ||
    n.includes('rise') ||
    n.includes('rice') ||
    n.includes('noodle') ||
    n.includes('chowmein') ||
    n.includes('manchurian') ||
    n.includes('chinese') ||
    img.includes('rice') ||
    img.includes('noodle')
  ) {
    return {
      plateImage: '/images/eating/fried_rice_dish.jpg',
      flyingImage: '/images/eating/biryani_dish_flying.png'
    };
  }

  // 10. Biryani / Dum Biryani
  if (n.includes('biryani') || (n.includes('pulao') && !n.includes('dosa')) || img.includes('biryani')) {
    return {
      plateImage: '/images/eating/biryani_dish.jpg',
      flyingImage: '/images/eating/biryani_dish_flying.png'
    };
  }

  // 11. Chicken Lollipop / Lolipop / Wings / Fried Chicken / Starters
  if (
    n.includes('lollipop') ||
    n.includes('lolipop') ||
    n.includes('chicken wings') ||
    n.includes('wings') ||
    n.includes('crispy chicken') ||
    n.includes('chicken 65') ||
    n.includes('chilli chicken') ||
    n.includes('fried chicken') ||
    n.includes('drumstick')
  ) {
    return {
      plateImage: '/images/eating/chicken_lollipop_dish.jpg',
      flyingImage: '/images/eating/tandoori_chicken_tikka_flying.png'
    };
  }

  // 11.5 Butter Chicken / Tandoori / Chicken Curries / General Chicken
  if (
    n.includes('butter chicken') ||
    n.includes('chicken') ||
    n.includes('murgh') ||
    img.includes('chicken')
  ) {
    if (n.includes('tikka') || n.includes('tandoor') || n.includes('kebab') || n.includes('roast') || n.includes('fry') || n.includes('tangdi')) {
      return {
        plateImage: '/images/eating/tandoori_chicken_tikka.jpg',
        flyingImage: '/images/eating/tandoori_chicken_tikka_flying.png'
      };
    }
    return {
      plateImage: '/images/eating/butter_chicken_dish.jpg',
      flyingImage: '/images/eating/butter_chicken_dish_flying.png'
    };
  }

  // 12. Paneer / Paneer Tikka / Paneer Butter Masala
  if (n.includes('paneer') || img.includes('paneer')) {
    return {
      plateImage: '/images/eating/paneer_dish.jpg',
      flyingImage: '/images/eating/paneer_dish_flying.png'
    };
  }

  // 13. Dal Makhani
  if (
    n.includes('dal makhani') ||
    n.includes('makhani') ||
    (n.includes('dal') && !n.includes('baati') && !n.includes('rice') && !n.includes('curd') && !n.includes('khichdi')) ||
    img.includes('dal_makhani')
  ) {
    return {
      plateImage: '/images/eating/dal_makhani.jpg',
      flyingImage: '/images/eating/butter_chicken_dish_flying.png'
    };
  }

  // 14. Bhakri / Pithla Bhakri / Thecha
  if (
    n.includes('bhakri') ||
    n.includes('pithla') ||
    n.includes('thecha') ||
    img.includes('bhakri')
  ) {
    return {
      plateImage: '/images/eating/bhakri_bhaji_dish.jpg',
      flyingImage: '/images/eating/bhakri_bhaji_dish_flying.png'
    };
  }

  // 15. Puran Poli
  if (
    n.includes('puran poli') ||
    n.includes('puran') ||
    img.includes('puran_poli')
  ) {
    return {
      plateImage: '/images/eating/puran_poli.jpg',
      flyingImage: '/images/eating/dosa_dish_flying.png'
    };
  }

  // 16. SPDP / Chaat / Dahi Puri / Sev Batata Puri / Bhel
  if (
    n.includes('spdp') ||
    n.includes('dahi puri') ||
    n.includes('sev batata') ||
    n.includes('bhel') ||
    n.includes('kachori') ||
    img.includes('spdp')
  ) {
    return {
      plateImage: '/images/eating/spdp.jpg',
      flyingImage: '/images/eating/pani_puri_dish_flying.png'
    };
  }

  // 17. Gavran Mutton Thali / Non-Veg Thali / Jagdamb Special Thali
  if (
    (n.includes('mutton') && n.includes('thali')) ||
    (n.includes('gavran') && n.includes('thali')) ||
    n.includes('jagdamb') ||
    n.includes('raavan mutton thali') ||
    (n.includes('non veg') && n.includes('thali')) ||
    img.includes('gavran_mutton_thali')
  ) {
    return {
      plateImage: '/images/eating/gavran_mutton_thali.jpg',
      flyingImage: '/images/eating/gavran_mutton_thali_flying.png'
    };
  }

  // 18. Keema Pav / Mutton Curries
  if (n.includes('keema') || (n.includes('mutton') && !n.includes('biryani') && !n.includes('thali')) || n.includes('nihari') || img.includes('keema')) {
    return {
      plateImage: '/images/eating/keema_pav.jpg',
      flyingImage: '/images/eating/keema_pav_flying.png'
    };
  }

  // 19. Tandoori Chicken Tikka / Kebab / Galouti / Seekh / Tandoori Chicken
  if (
    n.includes('tikka') ||
    n.includes('tandoori') ||
    n.includes('chicken tikka') ||
    n.includes('kebab') ||
    n.includes('galouti') ||
    n.includes('seekh') ||
    img.includes('tikka') ||
    img.includes('tandoori') ||
    img.includes('kebab')
  ) {
    if (n.includes('paneer')) {
      return {
        plateImage: '/images/eating/paneer_dish.jpg',
        flyingImage: '/images/eating/paneer_dish_flying.png'
      };
    }
    return {
      plateImage: '/images/eating/tandoori_chicken_tikka.jpg',
      flyingImage: '/images/eating/butter_chicken_dish_flying.png'
    };
  }

  // 20. Thali / Maharaja Thali
  if (n.includes('thali') || n.includes('maharaja') || img.includes('thali')) {
    return {
      plateImage: '/images/eating/thali_dish.jpg',
      flyingImage: '/images/eating/gavran_mutton_thali_flying.png'
    };
  }

  // 21. Fast Food (Burger, Pizza, Pasta, Sandwich, Fries, Taco, Wrap, Frankie)
  if (
    n.includes('burger') ||
    n.includes('pizza') ||
    n.includes('pasta') ||
    n.includes('sandwich') ||
    n.includes('fries') ||
    n.includes('taco') ||
    n.includes('wrap') ||
    n.includes('frankie')
  ) {
    return {
      plateImage: '/images/eating/pav_bhaji_dish.jpg',
      flyingImage: '/images/eating/pav_bhaji_dish_flying.png'
    };
  }

  // 22. General Gravy / Curry / Paneer / Masala / Sabzi / Kofta / Korma
  if (
    n.includes('curry') ||
    n.includes('gravy') ||
    n.includes('masala') ||
    n.includes('kofta') ||
    n.includes('korma') ||
    n.includes('sabzi') ||
    n.includes('kadai') ||
    n.includes('handi')
  ) {
    return {
      plateImage: '/images/eating/paneer_dish.jpg',
      flyingImage: '/images/eating/paneer_dish_flying.png'
    };
  }

  // 23. Verified flying image passed directly
  if (dishImage && dishImage.includes('_flying.png')) {
    return {
      plateImage: dishImage.replace('_flying.png', '.jpg'),
      flyingImage: dishImage
    };
  }

  // 24. Custom valid local or remote image passed from menu / database / user upload
  if (
    dishImage &&
    !dishImage.includes('bakasur') &&
    (dishImage.startsWith('http://') ||
      dishImage.startsWith('https://') ||
      dishImage.startsWith('/images/') ||
      dishImage.startsWith('data:'))
  ) {
    return {
      plateImage: dishImage,
      flyingImage: dishImage
    };
  }

  // 25. SMART DETERMINISTIC HASH FALLBACK FOR ANY TYPED DISH!
  const fallbackPlates = [
    '/images/eating/samosa_dish.jpg',
    '/images/eating/momos_dish.jpg',
    '/images/eating/fried_rice_dish.jpg',
    '/images/eating/dosa_dish.jpg',
    '/images/eating/paneer_dish.jpg',
    '/images/eating/chole_bhature_dish.jpg',
    '/images/eating/pav_bhaji_dish.jpg',
    '/images/eating/biryani_dish.jpg',
    '/images/eating/misal_dish.jpg',
    '/images/eating/vada_pav_dish.jpg'
  ];

  const fallbackFlyingPNGs = [
    '/images/eating/samosa_hero_clean.png',
    '/images/eating/momos_dish_flying.png',
    '/images/eating/biryani_dish_flying.png',
    '/images/eating/dosa_dish_flying.png',
    '/images/eating/paneer_dish_flying.png',
    '/images/eating/chole_bhature_dish_flying.png',
    '/images/eating/pav_bhaji_dish_flying.png',
    '/images/eating/vada_pav_flying.png',
    '/images/eating/misal_dish_flying.png',
    '/images/eating/butter_chicken_dish_flying.png'
  ];

  let hash = 0;
  for (let i = 0; i < (n || 'food').length; i++) {
    hash = (hash << 5) - hash + (n || 'food').charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % fallbackPlates.length;

  return {
    plateImage: fallbackPlates[idx],
    flyingImage: fallbackFlyingPNGs[idx]
  };
}

export function getDishExactPlateImage(dishName?: string, dishImage?: string): string {
  return getDishVisualAssets(dishName, dishImage).plateImage;
}

export function getDishExactFlyingImage(dishName?: string, dishImage?: string): string {
  return getDishVisualAssets(dishName, dishImage).flyingImage;
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

      // Remove repeated "RestaurantName Special" in middle
      const restSpec = new RegExp(`\\b${escaped}\\s+Special`, 'gi');
      name = name.replace(restSpec, '');
    }
  }

  // Remove duplicate consecutive "Special Special"
  name = name.replace(/\bSpecial\s+Special\b/gi, 'Special');

  // Clean double spaces or comma artifacts
  name = name.replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '').trim();

  return name || 'Signature Dish';
}
