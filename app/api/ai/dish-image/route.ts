import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// In-memory cache for generated AI PNG buffers
const imageBufferCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Verified authentic culinary photography assets (100% remote API & CDN hosted URLs)
const CANONICAL_FOOD_PHOTOS: Record<string, string> = {
  // Grand Thalis
  thali: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85',
  mutton_thali: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85',

  // Indian Breads & Parathas
  paratha: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  garlic_naan: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  bhakri: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  puran_poli: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',

  // Rice & Biryani
  jeera_rice: 'https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  fried_rice: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=85',

  // Curries & Gravies
  paneer_butter_masala: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=85',
  kaju_curry: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  dal_makhani: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=85',
  dal_tadka: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  veg_kolhapuri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  chole_bhature: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',

  // Street Snacks & Fast Food
  misal_pav: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  pav_bhaji: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85',
  vada_pav: 'https://images.unsplash.com/photo-1750767396969-f37060ebe07d?w=800&auto=format&fit=crop&q=85',
  samosa: 'https://images.unsplash.com/photo-1747008624832-e068ee496908?w=800&auto=format&fit=crop&q=85',
  pani_puri: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e?w=800&auto=format&fit=crop&q=85',
  sabudana_vada: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  spdp: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e?w=800&auto=format&fit=crop&q=85',

  // South Indian
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  idli: 'https://images.unsplash.com/photo-1741376509047-66dae5df90f9?w=800&auto=format&fit=crop&q=85',
  medu_vada: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop&q=85',

  // Fast Food & Asian
  momos: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',

  // Non-Veg
  butter_chicken: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=85',
  tandoori_chicken: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  chicken_lollipop: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=85',
  seafood: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85',

  // Desserts & Beverages
  gulab_jamun: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=85',
  mango_mastani: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  chocolate_mastani: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  falooda: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=800&auto=format&fit=crop&q=85',
  kulfi: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  lassi: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=85',
  cold_coffee: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85',
  bun_maska: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  poha: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',
  upma: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  sheera: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=800&auto=format&fit=crop&q=85',
  filter_coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85',
  masala_chai: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=85',
  default_feast: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85'
};

/**
 * Maps any Indian dish and restaurant name to its authentic photographic representation
 */
function resolveDishPhotoUrl(dishName: string, restaurantName: string): string {
  const text = `${dishName} ${restaurantName}`.toLowerCase();

  // 1. Mutton / Chicken / Non-Veg Thali
  if (
    (text.includes('thali') || text.includes('bhojan')) &&
    (text.includes('mutton') || text.includes('chicken') || text.includes('non veg') || text.includes('non-veg') || text.includes('gavran') || text.includes('fish') || text.includes('seafood'))
  ) {
    return CANONICAL_FOOD_PHOTOS.mutton_thali;
  }

  // 2. Grand Veg Thali / Maharaja Thali
  if (text.includes('thali') || text.includes('bhojan') || text.includes('maharaja') || text.includes('deluxe thali') || text.includes('platter')) {
    return CANONICAL_FOOD_PHOTOS.thali;
  }

  // 3. Paratha / Parantha / Thepla / Lachha / Aloo Paratha
  if (
    text.includes('paratha') ||
    text.includes('parantha') ||
    text.includes('pratha') ||
    text.includes('parata') ||
    text.includes('thepla')
  ) {
    return CANONICAL_FOOD_PHOTOS.paratha;
  }

  // 4. Jeera Rice / Geera Rice / Cumin Rice
  if (
    text.includes('jeera') ||
    text.includes('geera') ||
    text.includes('zeera') ||
    text.includes('cumin rice')
  ) {
    return CANONICAL_FOOD_PHOTOS.jeera_rice;
  }

  // 5. Biryani & Pulao
  if (text.includes('biryani') || text.includes('biriyani') || text.includes('briyani')) {
    return CANONICAL_FOOD_PHOTOS.biryani;
  }

  // 6. Fried Rice / Schezwan / Chinese Rice
  if (text.includes('fried rice') || text.includes('schezwan rice') || text.includes('triple') || text.includes('manchurian')) {
    return CANONICAL_FOOD_PHOTOS.fried_rice;
  }

  // 7. General Rice
  if (text.includes('rice') || text.includes('pulao') || text.includes('pulav') || text.includes('khichdi')) {
    return CANONICAL_FOOD_PHOTOS.jeera_rice;
  }

  // 8. Indian Breads: Naan, Roti, Kulcha
  if (text.includes('naan') || text.includes('roti') || text.includes('kulcha') || text.includes('rumali')) {
    return CANONICAL_FOOD_PHOTOS.garlic_naan;
  }

  // 9. Bhakri
  if (text.includes('bhakri') || text.includes('pithla')) {
    return CANONICAL_FOOD_PHOTOS.bhakri;
  }

  // 10. Puran Poli
  if (text.includes('puran poli') || text.includes('puranpoli') || text.includes('poli')) {
    return CANONICAL_FOOD_PHOTOS.puran_poli;
  }

  // 11. Chole Bhature
  if (text.includes('bhature') || text.includes('bhatura') || text.includes('chole bhature') || text.includes('chhole')) {
    return CANONICAL_FOOD_PHOTOS.chole_bhature;
  }

  // 12. Samosa
  if (text.includes('samosa') || text.includes('samose')) {
    return CANONICAL_FOOD_PHOTOS.samosa;
  }

  // 13. Pani Puri / Golgappa
  if (text.includes('pani puri') || text.includes('panipuri') || text.includes('golgappa') || text.includes('golgappe') || text.includes('puchka')) {
    return CANONICAL_FOOD_PHOTOS.pani_puri;
  }

  // 14. Sabudana Vada
  if (text.includes('sabudana')) {
    return CANONICAL_FOOD_PHOTOS.sabudana_vada;
  }

  // 15. Vada Pav
  if (text.includes('vada pav') || text.includes('vadapav') || text.includes('wada pav') || text.includes('batata vada')) {
    return CANONICAL_FOOD_PHOTOS.vada_pav;
  }

  // 16. Misal Pav
  if (text.includes('misal') || text.includes('katakirr') || text.includes('tarri') || text.includes('rassa')) {
    return CANONICAL_FOOD_PHOTOS.misal_pav;
  }

  // 17. Pav Bhaji
  if (text.includes('pav bhaji') || text.includes('pavbhaji') || text.includes('bhaji pav')) {
    return CANONICAL_FOOD_PHOTOS.pav_bhaji;
  }

  // 18. SPDP / Chaat
  if (text.includes('spdp') || text.includes('sev puri') || text.includes('dahi puri') || text.includes('bhel') || text.includes('chaat')) {
    return CANONICAL_FOOD_PHOTOS.spdp;
  }

  // 19. Cashew / Kaju Curry
  if (text.includes('kaju') || text.includes('cashew')) {
    return CANONICAL_FOOD_PHOTOS.kaju_curry;
  }

  // 20. Paneer Specialties
  if (text.includes('paneer')) {
    return CANONICAL_FOOD_PHOTOS.paneer_butter_masala;
  }

  // 21. Dal Specialties
  if (text.includes('dal makhani') || text.includes('makhani dal')) {
    return CANONICAL_FOOD_PHOTOS.dal_makhani;
  }
  if (text.includes('dal') || text.includes('tadka')) {
    return CANONICAL_FOOD_PHOTOS.dal_tadka;
  }

  // 22. Veg Kolhapuri / Spicy Veg
  if (text.includes('kolhapuri') || text.includes('veg handi') || text.includes('mix veg')) {
    return CANONICAL_FOOD_PHOTOS.veg_kolhapuri;
  }

  // 23. South Indian (Dosa, Idli, Medu Vada)
  if (text.includes('dosa') || text.includes('uttapam') || text.includes('appam')) {
    return CANONICAL_FOOD_PHOTOS.dosa;
  }
  if (text.includes('idli')) {
    return CANONICAL_FOOD_PHOTOS.idli;
  }
  if (text.includes('medu vada') || text.includes('vada sambar') || text.includes('wada sambar')) {
    return CANONICAL_FOOD_PHOTOS.medu_vada;
  }

  // 24. Momos
  if (text.includes('momo') || text.includes('dimsum')) {
    return CANONICAL_FOOD_PHOTOS.momos;
  }

  // 25. Western / Fast Food
  if (text.includes('pizza')) return CANONICAL_FOOD_PHOTOS.pizza;
  if (text.includes('burger')) return CANONICAL_FOOD_PHOTOS.burger;
  if (text.includes('fries')) return CANONICAL_FOOD_PHOTOS.fries;
  if (text.includes('sandwich') || text.includes('toast') || text.includes('grilled cheese')) return CANONICAL_FOOD_PHOTOS.sandwich;

  // 26. Non-Veg Specialties
  if (text.includes('butter chicken') || text.includes('murgh makhani')) {
    return CANONICAL_FOOD_PHOTOS.butter_chicken;
  }
  if (text.includes('lollipop')) {
    return CANONICAL_FOOD_PHOTOS.chicken_lollipop;
  }
  if (text.includes('tandoori chicken') || text.includes('tikka') || text.includes('kebab') || text.includes('kabab')) {
    return CANONICAL_FOOD_PHOTOS.tandoori_chicken;
  }
  if (text.includes('fish') || text.includes('surmai') || text.includes('pomfret') || text.includes('prawn') || text.includes('seafood') || text.includes('crab')) {
    return CANONICAL_FOOD_PHOTOS.seafood;
  }

  // 27. Drinks & Cafe
  if (text.includes('chocolate mastani')) return CANONICAL_FOOD_PHOTOS.chocolate_mastani;
  if (text.includes('mastani')) return CANONICAL_FOOD_PHOTOS.mango_mastani;
  if (text.includes('bun maska')) return CANONICAL_FOOD_PHOTOS.bun_maska;
  if (text.includes('cold coffee') || text.includes('frappe')) return CANONICAL_FOOD_PHOTOS.cold_coffee;
  if (text.includes('filter coffee')) return CANONICAL_FOOD_PHOTOS.filter_coffee;
  if (text.includes('chai') || text.includes('tea')) return CANONICAL_FOOD_PHOTOS.masala_chai;
  if (text.includes('lassi') || text.includes('chaas') || text.includes('buttermilk')) return CANONICAL_FOOD_PHOTOS.lassi;

  // 28. Snacks & Sweets
  if (text.includes('poha') || text.includes('pohe')) return CANONICAL_FOOD_PHOTOS.poha;
  if (text.includes('upma') || text.includes('sanja')) return CANONICAL_FOOD_PHOTOS.upma;
  if (text.includes('sheera') || text.includes('halwa')) return CANONICAL_FOOD_PHOTOS.sheera;
  if (text.includes('falooda') || text.includes('kulfi') || text.includes('ice cream')) return CANONICAL_FOOD_PHOTOS.falooda;
  if (text.includes('gulab jamun') || text.includes('jamun') || text.includes('sweet') || text.includes('rasgulla')) return CANONICAL_FOOD_PHOTOS.gulab_jamun;

  // Default fallback
  return CANONICAL_FOOD_PHOTOS.default_feast;
}

/**
 * Produce a clean, transparent PNG cutout of the food dish (Zero background)
 */
async function processFoodImageToPurePng(imageBuffer: Buffer, size = 440): Promise<Buffer> {
  const radius = size / 2 - 8;
  const maskSvg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <defs>
        <radialGradient id="featherMask" cx="50%" cy="50%" r="50%">
          <stop offset="92%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="url(#featherMask)" />
    </svg>`
  );

  return sharp(imageBuffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .modulate({ saturation: 1.15, brightness: 1.02 })
    .sharpen({ sigma: 1.2 })
    .png({ quality: 92, compressionLevel: 8 })
    .toBuffer();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dish = (searchParams.get('dish') || 'Special Dish').trim();
    const restaurant = (searchParams.get('restaurant') || 'Restaurant').trim();
    const explicitImgUrl = (searchParams.get('imgUrl') || '').trim();

    const cacheKey = `${dish.toLowerCase()}_${restaurant.toLowerCase()}${explicitImgUrl ? '_' + encodeURIComponent(explicitImgUrl).slice(0, 40) : ''}`;
    const cached = imageBufferCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-AI-Generated': 'cached',
          'X-Food-Dish': encodeURIComponent(dish),
          'X-Food-Restaurant': encodeURIComponent(restaurant)
        }
      });
    }

    // 1. Identify primary authentic photo source (Swiggy CDN or verified remote culinary API catalog)
    const isVerifiedExplicit = explicitImgUrl && (
      explicitImgUrl.startsWith('http://') ||
      explicitImgUrl.startsWith('https://')
    ) && (
      explicitImgUrl.includes('swiggy.com') ||
      explicitImgUrl.includes('cloudinary.com') ||
      explicitImgUrl.includes('unsplash.com')
    );

    const photoUrl = isVerifiedExplicit
      ? explicitImgUrl
      : resolveDishPhotoUrl(dish, restaurant);
    let finalPngBuffer: Buffer | null = null;

    // Fetch the authentic photographic visual strictly via remote API / CDN
    try {
      const imgRes = await fetch(photoUrl, {
        headers: { 'User-Agent': 'BakasurFoodAI/3.0' },
        next: { revalidate: 86400 }
      });
      if (imgRes.ok) {
        const rawBuffer = Buffer.from(await imgRes.arrayBuffer());
        finalPngBuffer = await processFoodImageToPurePng(rawBuffer);
      }
    } catch (fetchErr) {
      console.warn('Primary food photo fetch notice:', fetchErr);
    }

    // 2. Fallback to default feast photo if primary failed
    if (!finalPngBuffer) {
      try {
        const fallbackRes = await fetch(CANONICAL_FOOD_PHOTOS.default_feast, {
          headers: { 'User-Agent': 'BakasurFoodAI/3.0' }
        });
        if (fallbackRes.ok) {
          const rawBuffer = Buffer.from(await fallbackRes.arrayBuffer());
          finalPngBuffer = await processFoodImageToPurePng(rawBuffer);
        }
      } catch (fbErr) {
        console.warn('Fallback food photo fetch notice:', fbErr);
      }
    }

    if (!finalPngBuffer) {
      throw new Error('Unable to process food photo into PNG');
    }

    // Cache the generated PNG buffer
    imageBufferCache.set(cacheKey, { buffer: finalPngBuffer, timestamp: Date.now() });

    return new NextResponse(new Uint8Array(finalPngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-AI-Generated': 'fresh',
        'X-Food-Dish': encodeURIComponent(dish),
        'X-Food-Restaurant': encodeURIComponent(restaurant)
      }
    });
  } catch (error: unknown) {
    console.error('AI Dish Image Generation Error:', error);
    // If completely offline or network issue, generate a simple photographic gradient plate in PNG
    const fallbackSvg = Buffer.from(
      `<svg width="440" height="440" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="plate" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stop-color="#D4380D" />
            <stop offset="70%" stop-color="#9C2706" />
            <stop offset="100%" stop-color="#5A1502" />
          </radialGradient>
        </defs>
        <circle cx="220" cy="220" r="210" fill="url(#plate)" />
      </svg>`
    );
    const emergencyBuffer = await sharp(fallbackSvg).png().toBuffer();
    return new NextResponse(new Uint8Array(emergencyBuffer), {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    });
  }
}
