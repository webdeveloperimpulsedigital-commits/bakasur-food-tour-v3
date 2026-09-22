/**
 * Universal Dish Visual Assets Mapping
 * Resolves exact plate images and transparent flying cutouts for all dishes,
 * specifically handling momos, biryani, pav bhaji, dosas, street food, etc.
 */

export interface DishVisualAssets {
  plateImage: string;
  flyingImage: string;
}

export function getDishVisualAssets(dishName?: string, dishImage?: string): DishVisualAssets {
  const n = (dishName || '').toLowerCase().trim();
  const img = (dishImage || '').toLowerCase().trim();

  // 1. Momos / Dimsum / Dumpling (Explicit priority as requested)
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

  // 3. Samosa / Dahi Samosa
  if (n.includes('samosa') || img.includes('samosa')) {
    return {
      plateImage: '/images/eating/samosa_flying.png',
      flyingImage: '/images/eating/samosa_flying.png'
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

  // 5. Misal / Katakirr / Tarri / Usal Pav
  if (
    n.includes('misal') ||
    n.includes('tarri') ||
    n.includes('katakirr') ||
    n.includes('rassa') ||
    n.includes('usal') ||
    img.includes('misal')
  ) {
    return {
      plateImage: '/images/eating/misal_dish.jpg',
      flyingImage: '/images/eating/misal_dish_flying.png'
    };
  }

  // 6. Chole Bhature / Bhatura
  if (n.includes('chole') || n.includes('bhature') || n.includes('bhatura') || img.includes('chole_bhature')) {
    return {
      plateImage: '/images/eating/chole_bhature_dish.jpg',
      flyingImage: '/images/eating/chole_bhature_dish_flying.png'
    };
  }

  // 7. Vada Pav / Batata Vada / Sabudana Vada / Kothimbir Vadi
  if (
    n.includes('vada pav') ||
    n.includes('vadapav') ||
    n.includes('vada pao') ||
    n.includes('batata vada') ||
    n.includes('sabudana vada') ||
    n.includes('kothimbir vadi') ||
    img.includes('vada_pav')
  ) {
    return {
      plateImage: '/images/eating/vada_pav_dish.jpg',
      flyingImage: '/images/eating/vada_pav_dish.jpg'
    };
  }

  // 8. Dosa / Uttapam / Idli / Medu Vada
  if (
    n.includes('dosa') ||
    n.includes('uttapam') ||
    n.includes('roast') ||
    n.includes('benne') ||
    n.includes('idli') ||
    n.includes('vada') ||
    img.includes('dosa')
  ) {
    return {
      plateImage: '/images/eating/dosa_dish.jpg',
      flyingImage: '/images/eating/dosa_dish_flying.png'
    };
  }

  // 9. Biryani / Pulao / Dum Biryani
  if (n.includes('biryani') || n.includes('pulao') || n.includes('khichdi') || img.includes('biryani')) {
    return {
      plateImage: '/images/eating/biryani_dish.jpg',
      flyingImage: '/images/eating/biryani_dish_flying.png'
    };
  }

  // 10. Butter Chicken / Chicken Handi / Chicken Tikka
  if (
    n.includes('butter chicken') ||
    n.includes('chicken') ||
    n.includes('murgh') ||
    img.includes('butter_chicken')
  ) {
    return {
      plateImage: '/images/eating/butter_chicken_dish.jpg',
      flyingImage: '/images/eating/butter_chicken_dish_flying.png'
    };
  }

  // 11. Paneer / Paneer Tikka / Paneer Butter Masala
  if (n.includes('paneer') || img.includes('paneer')) {
    return {
      plateImage: '/images/eating/paneer_dish.jpg',
      flyingImage: '/images/eating/paneer_dish_flying.png'
    };
  }

  // 12. Dal Makhani / Dal Tadka
  if (n.includes('dal') || n.includes('makhani') || n.includes('tadka') || img.includes('dal_makhani')) {
    return {
      plateImage: '/images/eating/dal_makhani.jpg',
      flyingImage: '/images/eating/dal_makhani_flying.png'
    };
  }

  // 13. Puran Poli / Roti / Paratha / Naan
  if (
    n.includes('puran') ||
    n.includes('poli') ||
    n.includes('roti') ||
    n.includes('paratha') ||
    n.includes('naan') ||
    n.includes('bhakri') ||
    img.includes('puran_poli')
  ) {
    return {
      plateImage: '/images/eating/puran_poli.jpg',
      flyingImage: '/images/eating/puran_poli_flying.png'
    };
  }

  // 14. SPDP / Chaat / Sev Puri / Bhel Puri / Dahi Puri
  if (
    n.includes('spdp') ||
    n.includes('chaat') ||
    n.includes('sev') ||
    n.includes('bhel') ||
    n.includes('dahi') ||
    n.includes('kachori') ||
    img.includes('spdp')
  ) {
    return {
      plateImage: '/images/eating/spdp.jpg',
      flyingImage: '/images/eating/spdp_flying.png'
    };
  }

  // 15. Keema Pav / Mutton / Kebab
  if (n.includes('keema') || n.includes('mutton') || n.includes('nihari') || img.includes('keema')) {
    return {
      plateImage: '/images/eating/keema_pav.jpg',
      flyingImage: '/images/eating/keema_pav_flying.png'
    };
  }

  // 16. Kebab / Galouti / Seekh
  if (n.includes('kebab') || n.includes('galouti') || n.includes('seekh') || img.includes('kebab')) {
    return {
      plateImage: '/images/eating/kebab_dish.jpg',
      flyingImage: '/images/eating/kebab_dish.jpg'
    };
  }

  // 17. Thali / Maharaja Thali
  if (n.includes('thali') || n.includes('maharaja') || n.includes('meals') || img.includes('thali')) {
    return {
      plateImage: '/images/eating/thali_dish.jpg',
      flyingImage: '/images/eating/thali_dish.jpg'
    };
  }

  // 18. Verified flying image passed directly
  if (dishImage && dishImage.includes('_flying.png')) {
    return {
      plateImage: dishImage.replace('_flying.png', '.jpg'),
      flyingImage: dishImage
    };
  }

  // 19. Custom valid local or remote image passed
  if (dishImage && !dishImage.includes('bakasur') && (dishImage.startsWith('/') || dishImage.startsWith('http'))) {
    return {
      plateImage: dishImage,
      flyingImage: dishImage
    };
  }

  // Fallback signature delight
  return {
    plateImage: '/images/eating/paneer_dish.jpg',
    flyingImage: '/images/eating/paneer_dish_flying.png'
  };
}

export function getDishExactPlateImage(dishName?: string, dishImage?: string): string {
  return getDishVisualAssets(dishName, dishImage).plateImage;
}

export function getDishExactFlyingImage(dishName?: string, dishImage?: string): string {
  return getDishVisualAssets(dishName, dishImage).flyingImage;
}
