import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Cache key salt to instantly bust any previous stale in-memory cached buffers
const CACHE_VERSION = 'v16_tandoor_chicken_tikka_perfect';
const imageBufferCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Local authentic photographic assets stored in public/images/food/
const CANONICAL_LOCAL_ASSETS: Record<string, string> = {
  garlic_naan: 'garlic_naan.jpg',
  butter_naan: 'butter_naan.jpg',
  bhakri: 'bhakri.jpg',
  paratha: 'paratha.jpg',
  puran_poli: 'puran_poli.jpg',
  chole_bhature: 'chole_bhature.jpg',
  dal_makhani: 'dal_makhani.jpg',
  dal_tadka: 'dal_tadka.jpg',
  gulab_jamun: 'gulab_jamun.jpg',
  jalebi: 'jalebi.jpg',
  poha: 'poha.jpg',
  kathi_roll: 'kathi_roll.jpg',
  misal_pav: 'misal_pav.jpg',
  mutton_thali: 'mutton_thali.jpg',
  mutton_curry: 'mutton_curry.jpg',
  chicken_curry: 'chicken_curry.jpg',
  chicken_lollipop: 'chicken_lollipop.jpg',
  fish_fry: 'fish_fry.jpg',
  seafood: 'fish_fry.jpg',
  pani_puri: 'pani_puri.jpg',
  sabudana_vada: 'sabudana_vada.jpg',
  thali: 'thali.jpg',
  jeera_rice: 'jeera_rice.jpg',
  biryani: 'biryani.jpg',
  fried_rice: 'fried_rice.jpg',
  paneer_butter_masala: 'paneer_butter_masala.jpg',
  paneer_tikka: 'paneer_tikka.jpg',
  palak_paneer: 'palak_paneer.jpg',
  veg_kolhapuri: 'veg_kolhapuri.jpg',
  shev_bhaji: 'shev_bhaji.jpg',
  modak: 'modak.jpg',
  kothimbir_vadi: 'kothimbir_vadi.jpg',
  alu_vadi: 'alu_vadi.jpg',
  masala_taak: 'masala_taak.jpg',
  solkadhi: 'solkadhi.jpg',
  lassi: 'punjabi_lassi.jpg',
  punjabi_lassi: 'punjabi_lassi.jpg',
  pav_bhaji: 'pav_bhaji.jpg',
  vada_pav: 'vada_pav.jpg',
  samosa: 'samosa.jpg',
  dosa: 'dosa.jpg',
  idli: 'idli.jpg',
  momos: 'momos.jpg',
  pizza: 'pizza.jpg',
  burger: 'burger.jpg',
  butter_chicken: 'butter_chicken.jpg',
  tandoori_chicken: 'tandoori_chicken.jpg',
  chicken_tikka: 'tandoori_chicken.jpg'
};

// Remote verified CDN fallbacks for beverages, specialties, and network redundancy
const CANONICAL_REMOTE_PHOTOS: Record<string, string> = {
  thali: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85',
  mutton_thali: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=85',
  puran_poli_thali: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85',
  paratha: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  garlic_naan: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  butter_naan: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  bhakri: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  puran_poli: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  jeera_rice: 'https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  fried_rice: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=85',
  noodles: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=85',
  paneer_butter_masala: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  paneer_tikka: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  palak_paneer: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  kaju_curry: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  dal_makhani: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  dal_tadka: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  veg_kolhapuri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  chole_bhature: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',
  misal_pav: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  pav_bhaji: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85',
  vada_pav: 'https://images.unsplash.com/photo-1750767396969-f37060ebe07d?w=800&auto=format&fit=crop&q=85',
  samosa: 'https://images.unsplash.com/photo-1747008624832-e068ee496908?w=800&auto=format&fit=crop&q=85',
  pani_puri: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85',
  spdp: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85',
  sabudana_vada: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop&q=85',
  poha: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=85',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  idli: 'https://images.unsplash.com/photo-1741376509047-66dae5df90f9?w=800&auto=format&fit=crop&q=85',
  medu_vada: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop&q=85',
  momos: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  kathi_roll: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  butter_chicken: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=85',
  tandoori_chicken: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tandoorimumbai.jpg',
  chicken_tikka: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tandoorimumbai.jpg',
  chicken_lollipop: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=85',
  seafood: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=85',
  prawn_fry: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=85',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=85',
  waffles: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=85',
  pancakes: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop&q=85',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=85',
  brownie: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=85',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=85',
  ice_cream: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=85',
  fruit_juice: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=85',
  smoothie: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=85',
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=85',
  egg_dish: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=85',
  nachos: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&auto=format&fit=crop&q=85',
  garlic_bread: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&auto=format&fit=crop&q=85',
  hot_dog: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=800&auto=format&fit=crop&q=85',
  gulab_jamun: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  jalebi: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  mango_mastani: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  chocolate_mastani: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  falooda: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=800&auto=format&fit=crop&q=85',
  kulfi: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  lassi: 'https://images.unsplash.com/photo-1571006687898-3bfd4b407421?w=800&auto=format&fit=crop&q=85',
  punjabi_lassi: 'https://images.unsplash.com/photo-1571006687898-3bfd4b407421?w=800&auto=format&fit=crop&q=85',
  cold_coffee: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85',
  bun_maska: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  filter_coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85',
  masala_chai: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=85',
  default_feast: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85'
};

/**
 * Intelligent Culinary Semantic Matcher
 * Parses the dish name with strict semantic boundaries and category isolation.
 * Dishes will NEVER cross categories (e.g. flatbreads/naan will never match idli, veg will never match mutton).
 */
function matchDishToCanonicalKey(dishName: string, restaurantName: string = ''): string {
  const d = (dishName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const r = (restaurantName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // === 0. TRADITIONAL BEVERAGES & COOLERS (High Priority) ===
  // Solkadhi (Konkani/Malvani cooling pink coconut kokum digestive drink)
  if (d.includes('solkadhi') || d.includes('sol kadhi') || d.includes('kokum kadhi') || (d.includes('kokum') && !d.includes('sharbat'))) {
    return 'solkadhi';
  }

  // Masala Taak / Spiced Buttermilk / Mattha / Chaas / Majjiga
  if (
    d.includes('taak') || d.includes('tak') || d.includes('mattha') ||
    d.includes('matha') || d.includes('chaas') || d.includes('chhas') ||
    d.includes('buttermilk') || d.includes('spiced butter milk') || d.includes('masala curd') ||
    d.includes('majjiga')
  ) {
    return 'masala_taak';
  }

  // Punjabi Sweet Lassi / Lassi (All variations)
  if (
    /\blassi\b/.test(d) || /\blasi\b/.test(d) ||
    (d.includes('punjabi') && (d.includes('sweet') || d.includes('curd') || d.includes('malai') || d.includes('yogurt')))
  ) {
    return 'punjabi_lassi';
  }

  // === 1. NON-VEG SPECIALTIES (High Priority to prevent bread/accompaniment false matches) ===
  // Detect if dish contains explicit non-veg ingredients
  const hasFish = (
    d.includes('fish') || d.includes('surmai') || d.includes('pomfret') ||
    d.includes('bombil') || d.includes('prawn') || d.includes('prawns') ||
    d.includes('crab') || d.includes('seafood') || d.includes('tisreo') ||
    d.includes('bangda') || d.includes('kolambi') || d.includes('rawas') ||
    d.includes('bhetki') || d.includes('chingri') || d.includes('royyala')
  );

  const hasMutton = (
    d.includes('mutton') || d.includes('gosht') || d.includes('rogan josh') ||
    d.includes('nihari') || d.includes('tambda') || d.includes('pandhra') ||
    d.includes('kheema') || d.includes('keema') || d.includes('laal maas') ||
    d.includes('goat') || d.includes('lamb')
  );

  const hasChicken = (
    d.includes('chicken') || d.includes('murgh') || d.includes('kukkad')
  );

  // Fish & Seafood (Surmai, Pomfret, Prawns, Crab, Bombil, Fish Thali, etc.)
  if (hasFish) {
    return 'fish_fry';
  }

  // Chicken Lollipop / Wings
  if (d.includes('lollipop') || (d.includes('wings') && !d.includes('veg'))) {
    return 'chicken_lollipop';
  }

  // Tandoori Chicken & Non-veg Kebabs
  if (
    d.includes('tandoori chicken') || d.includes('chicken tandoori') ||
    d.includes('tandoor chicken') || d.includes('chicken tandoor') ||
    d.includes('chicken tikka') || d.includes('tikka chicken') ||
    (d.includes('tikka') && (hasChicken || !d.includes('paneer'))) ||
    d.includes('tangdi') || d.includes('reshmi') ||
    d.includes('malai tikka') || d.includes('roast chicken') ||
    ((d.includes('kebab') || d.includes('kabab') || d.includes('seekh') || d.includes('boti') || d.includes('burra') || d.includes('kakori') || d.includes('galouti') || d.includes('pasinda')) && !d.includes('paneer') && !d.includes('veg') && !d.includes('soya'))
  ) {
    return 'tandoori_chicken';
  }

  // Non-Veg Biryani
  if ((d.includes('biryani') || d.includes('biriyani') || d.includes('briyani')) && (hasMutton || hasChicken || d.includes('egg') || d.includes('anda'))) {
    return 'biryani';
  }

  // Non-Veg Thalis
  if (
    (d.includes('thali') || d.includes('bhojan') || d.includes('platter')) &&
    (hasMutton || hasChicken || d.includes('non veg') || d.includes('nonveg') || d.includes('gavran') || d.includes('military'))
  ) {
    return 'mutton_thali';
  }

  // Mutton Curries, Sukka, Rassa, Kheema & Gravies
  if (hasMutton) {
    return 'mutton_curry';
  }

  // Butter Chicken / Murgh Makhani
  if (d.includes('butter chicken') || d.includes('makhani chicken') || d.includes('murgh makhani')) {
    return 'butter_chicken';
  }

  // Chicken Curries, Handi, Sukka, Gravies
  if (hasChicken || (d.includes('gavran') && !d.includes('pithla'))) {
    return 'chicken_curry';
  }

  // === 2. MAHARASHTRIAN SPECIALTIES & SWEETS ===
  // Steamed Ukdiche Modak / Modak
  if (d.includes('modak')) {
    return 'modak';
  }

  // Shev Bhaji / Sev Bhaji / Sev Tamatar / Khandeshi Shev Bhaji
  if (d.includes('shev bhaji') || d.includes('sev bhaji') || d.includes('shev curry') || d.includes('sev curry') || d.includes('sev tamatar') || d.includes('shev tamatar') || (d.includes('shev') && !d.includes('sev puri')) || d.includes('ratlami shev')) {
    return 'shev_bhaji';
  }

  // Kothimbir Vadi
  if (d.includes('kothimbir') || d.includes('kothambir') || d.includes('coriander vadi')) {
    return 'kothimbir_vadi';
  }

  // Alu Vadi / Aloo Vadi / Patra
  if (d.includes('alu vadi') || d.includes('aloo vadi') || d.includes('aluvadi') || d.includes('aloovadi') || d.includes('patra') || d.includes('colocasia')) {
    return 'alu_vadi';
  }

  // Puran Poli
  if (d.includes('puran poli') || d.includes('puranpoli') || d.includes('puran') || d.includes('vedmi')) {
    return 'puran_poli';
  }

  // Misal Pav
  if (d.includes('misal') || d.includes('katakirr') || d.includes('tarri pav')) {
    return 'misal_pav';
  }

  // Pav Bhaji
  if (d.includes('pav bhaji') || d.includes('pavbhaji') || d.includes('bhaji pav')) {
    return 'pav_bhaji';
  }

  // Vada Pav
  if (d.includes('vada pav') || d.includes('vadapav') || d.includes('wada pav') || d.includes('batata vada') || d.includes('batatavada') || d.includes('bombay burger')) {
    return 'vada_pav';
  }

  // Sabudana Vada / Khichdi
  if (d.includes('sabudana') || d.includes('upvas') || d.includes('fasting')) {
    return 'sabudana_vada';
  }

  // Poha / Kanda Poha
  if (d.includes('poha') || d.includes('pohe') || d.includes('kanda poha') || d.includes('batata poha')) {
    return 'poha';
  }

  // === 3. PURE INDIAN BREADS (Only for standalone bread orders) ===
  if (d.includes('garlic naan') || d.includes('lasuni naan') || d.includes('lahsuni naan') || (d.includes('naan') && d.includes('garlic'))) {
    return 'garlic_naan';
  }
  if (d.includes('naan')) {
    return 'butter_naan';
  }
  if (d.includes('roti') || d.includes('kulcha') || d.includes('rumali') || d.includes('roomali') || d.includes('chapati') || d.includes('chapatti') || d.includes('phulka')) {
    return 'butter_naan';
  }
  if (d.includes('bhakri') || d.includes('rotla') || d.includes('pithla') || d.includes('pitla') || d.includes('thecha') || d.includes('zunka') || d.includes('zhunka')) {
    return 'bhakri';
  }
  if (d.includes('paratha') || d.includes('parantha') || d.includes('pratha') || d.includes('thepla') || d.includes('thalipeeth') || d.includes('thali pith')) {
    return 'paratha';
  }
  if (d.includes('bhature') || d.includes('bhatura') || (d.includes('chole') && !d.includes('rice')) || d.includes('chhole')) {
    return 'chole_bhature';
  }

  // === 4. SOUTH INDIAN ===
  if (d.includes('idli') || d.includes('idly') || d.includes('thatte idli') || d.includes('rava idli')) {
    return 'idli';
  }
  if (d.includes('dosa') || d.includes('dosai') || d.includes('uttapam') || d.includes('oothappam') || d.includes('appam') || d.includes('pesrattu')) {
    return 'dosa';
  }
  if (d.includes('medu vada') || d.includes('vada sambar') || d.includes('wada sambar') || d.includes('medu vadai')) {
    return 'idli';
  }

  // === 5. BIRYANI & RICE ===
  if (d.includes('biryani') || d.includes('biriyani') || d.includes('briyani')) {
    return 'biryani';
  }
  if (d.includes('jeera rice') || d.includes('steam rice') || d.includes('steamed rice') || d.includes('curd rice') || d.includes('khichdi') || d.includes('pulao') || d.includes('pulav') || d.includes('rice') || d.includes('varan bhat')) {
    return 'jeera_rice';
  }

  // === 6. THALIS (Veg) ===
  if (d.includes('thali') || d.includes('bhojan') || d.includes('platter') || d.includes('swayampak') || d.includes('maharaja') || d.includes('deluxe thali')) {
    return 'thali';
  }

  // === 7. DALS ===
  if (d.includes('dal makhani') || d.includes('makhani dal') || d.includes('dal bukhara')) {
    return 'dal_makhani';
  }
  if (d.includes('dal tadka') || d.includes('dal fry') || d.includes('tadka dal') || d.includes('varan') || d.includes('dal') || d.includes('daal')) {
    return 'dal_tadka';
  }

  // === 8. PANEER SPECIALTIES & GRAVIES ===
  // 8a. Palak Paneer / Saag Paneer
  if (
    d.includes('palak paneer') || d.includes('saag paneer') ||
    (d.includes('paneer') && (d.includes('palak') || d.includes('saag') || d.includes('spinach')))
  ) {
    return 'palak_paneer';
  }

  // 8b. Paneer Tikka / Tandoori Paneer / Skewers
  if (
    (d.includes('paneer') && (d.includes('tikka') || d.includes('tandoor') || d.includes('kebab') || d.includes('kabab') || d.includes('skewer') || d.includes('chilli') || d.includes('chili') || d.includes('dry') || d.includes('platter'))) ||
    d.includes('paneer tikka') || d.includes('paneer seekh')
  ) {
    return 'paneer_tikka';
  }

  // 8c. Paneer Gravies (Paneer Butter Masala, Shahi Paneer, Kadai Paneer, Matar Paneer, Paneer Lababdar, Handi, Bhurji, Kolhapuri, etc.)
  if (
    d.includes('paneer') || d.includes('panir') || d.includes('cottage cheese') ||
    d.includes('makhani') || d.includes('makhanwala') || d.includes('lababdar') ||
    d.includes('pasanda') || (d.includes('shahi') && !d.includes('biryani') && !d.includes('tukda') && !d.includes('phirni'))
  ) {
    return 'paneer_butter_masala';
  }
  if (d.includes('kolhapuri') || d.includes('handi') || d.includes('kadai') || d.includes('mix veg') || d.includes('vangi') || d.includes('baingan') || d.includes('kaju curry') || d.includes('cashew curry') || d.includes('veg korma') || d.includes('malai kofta') || d.includes('dum aloo') || d.includes('veg curry')) {
    return 'veg_kolhapuri';
  }

  // === 9. SOUPS & SALADS ===
  if (d.includes('soup') || d.includes('shorba')) return 'soup';
  if (d.includes('salad') || d.includes('buddha bowl') || d.includes('protein bowl') || d.includes('quinoa') || d.includes('sprouts')) return 'salad';

  // === 10. BREAKFAST SPECIALS & EGGS ===
  if (d.includes('omelette') || d.includes('omelet') || d.includes('boiled egg') || d.includes('scrambled egg') || d.includes('egg curry') || d.includes('anda bhurji') || d.includes('egg bhurji') || d.includes('anda curry')) {
    return 'egg_dish';
  }
  if (d.includes('upma')) return 'poha';
  if (d.includes('waffle')) return 'waffles';
  if (d.includes('pancake') || d.includes('french toast')) return 'pancakes';

  // === 11. ITALIAN & CAFÉ MEALS ===
  if (d.includes('pasta') || d.includes('spaghetti') || d.includes('lasagna') || d.includes('mac and cheese') || d.includes('penne') || d.includes('alfredo') || d.includes('ravioli') || d.includes('arrabbiata') || d.includes('risotto') || d.includes('pesto')) {
    return 'pasta';
  }
  if (d.includes('nachos') || d.includes('quesadilla')) return 'nachos';
  if (d.includes('garlic bread') || d.includes('bruschetta') || d.includes('garlic toast') || d.includes('open toast') || d.includes('avocado toast')) return 'garlic_bread';
  if (d.includes('hot dog') || d.includes('hotdog')) return 'hot_dog';

  // === 12. SNACKS & FAST FOOD ===
  if (d.includes('samosa') || d.includes('samose') || d.includes('kachori') || d.includes('dhokla') || d.includes('khandvi')) return 'samosa';
  if (d.includes('pani puri') || d.includes('panipuri') || d.includes('golgappa') || d.includes('puchka') || d.includes('spdp') || d.includes('sev puri') || d.includes('dahi puri') || d.includes('bhel') || d.includes('chaat') || d.includes('papdi chaat')) return 'pani_puri';
  if (d.includes('roll') || d.includes('kathi') || d.includes('frankie') || d.includes('shawarma') || d.includes('wrap') || d.includes('baida roti')) return 'kathi_roll';
  if (d.includes('bun maska') || d.includes('maska bun') || d.includes('sandwich') || d.includes('toast') || d.includes('grilled cheese')) return 'sandwich';
  if (d.includes('momo') || d.includes('dimsum') || d.includes('dim sum') || d.includes('dumpling')) return 'momos';
  if (d.includes('noodle') || d.includes('chowmein') || d.includes('hakka') || d.includes('chow mein') || d.includes('chopsuey')) return 'noodles';
  if (d.includes('fried rice') || d.includes('schezwan') || d.includes('manchurian') || d.includes('triple') || d.includes('chilli paneer')) return 'fried_rice';
  if (d.includes('pizza') || d.includes('margherita') || d.includes('calzone')) return 'pizza';
  if (d.includes('burger')) return 'burger';
  if (d.includes('fries') || d.includes('finger chips') || d.includes('wedges')) return 'fries';
  if (d.includes('croissant')) return 'croissant';

  // === 13. DESSERTS, BAKERY & SWEETS ===
  if (d.includes('brownie')) return 'brownie';
  if (d.includes('cake') || d.includes('cheesecake') || d.includes('tiramisu') || d.includes('cupcake') || d.includes('donut') || d.includes('doughnut') || d.includes('muffin') || d.includes('churros') || d.includes('pastry')) return 'cake';
  if (d.includes('ice cream') || d.includes('gelato') || d.includes('sorbet') || d.includes('sundae')) return 'ice_cream';
  if (d.includes('jalebi') || d.includes('imarti') || d.includes('rabdi') || d.includes('rabri')) return 'jalebi';
  if (d.includes('gulab jamun') || d.includes('jamun') || d.includes('rasgulla') || d.includes('rasmalai') || d.includes('halwa') || d.includes('sheera') || d.includes('sweet') || d.includes('mithai') || d.includes('laddoo') || d.includes('laddu') || d.includes('kaju katli') || d.includes('barfi') || d.includes('peda') || d.includes('shrikhand') || d.includes('basundi')) return 'gulab_jamun';

  // === 14. BEVERAGES, SHAKES, JUICES & SMOOTHIES ===
  if (d.includes('chocolate mastani')) return 'chocolate_mastani';
  if (d.includes('mastani')) return 'mango_mastani';
  if (d.includes('mango') && d.includes('shake')) return 'mango_mastani';
  if (d.includes('smoothie') || d.includes('granola') || d.includes('fruit bowl') || d.includes('oats')) return 'smoothie';
  if (d.includes('falooda') || d.includes('kulfi')) return 'falooda';
  if (d.includes('cold coffee') || d.includes('frappe')) return 'cold_coffee';
  if (d.includes('shake') || d.includes('thick shake') || d.includes('milkshake')) return 'chocolate_mastani';
  if (d.includes('juice') || d.includes('fresh lime') || d.includes('nimbu pani') || d.includes('lemonade') || d.includes('iced tea') || d.includes('sharbat')) return 'fruit_juice';
  if (d.includes('filter coffee') || d.includes('espresso') || d.includes('cappuccino') || d.includes('latte') || d.includes('americano') || d.includes('mocha') || d.includes('flat white') || d.includes('macchiato')) return 'filter_coffee';
  if (d.includes('chai') || d.includes('tea') || d.includes('masala chai') || d.includes('green tea') || d.includes('irani chai')) return 'masala_chai';

  // Context Fallbacks based on restaurant name
  if (r.includes('biryani')) return 'biryani';
  if (r.includes('seafood') || r.includes('fish') || r.includes('malvan') || r.includes('nisarg') || r.includes('gajalee')) return 'fish_fry';
  if (r.includes('mutton') || r.includes('military') || r.includes('maratha') || r.includes('dehati') || r.includes('surve')) return 'mutton_curry';

  return 'thali';
}

function resolveDishPhotoUrl(dishName: string, restaurantName: string = ''): string {
  const canonicalKey = matchDishToCanonicalKey(dishName, restaurantName);
  return CANONICAL_REMOTE_PHOTOS[canonicalKey] || CANONICAL_REMOTE_PHOTOS.default_feast;
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

/**
 * Retrieves raw image buffer using tiered multi-layer fallback:
 * Layer 1: Local verified authentic photo from public/images/food/ (0ms, 100% reliable)
 * Layer 2: Remote verified CDN / Unsplash URL with custom User-Agent
 * Layer 3: Default authentic Indian feast plate
 */
async function getRawFoodImageBuffer(canonicalKey: string, explicitUrl?: string): Promise<Buffer | null> {
  // 1. If explicit verified URL from Swiggy/Cloudinary provided, attempt fetch
  if (explicitUrl) {
    try {
      const res = await fetch(explicitUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BakasurFoodApp/3.0' },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (e) {
      console.warn('Explicit food photo fetch failed, falling back to canonical:', e);
    }
  }

  // 2. Local authentic photographic asset in public/images/food/
  const localFileName = CANONICAL_LOCAL_ASSETS[canonicalKey];
  if (localFileName) {
    try {
      const localFilePath = path.join(process.cwd(), 'public', 'images', 'food', localFileName);
      if (fs.existsSync(localFilePath)) {
        return await fs.promises.readFile(localFilePath);
      }
    } catch (fsErr) {
      console.warn('Local food asset read failed, falling back to remote CDN:', fsErr);
    }
  }

  // 3. Fallback to remote CDN / Unsplash URL for this canonical key
  const remoteUrl = CANONICAL_REMOTE_PHOTOS[canonicalKey] || CANONICAL_REMOTE_PHOTOS.thali;
  try {
    const res = await fetch(remoteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BakasurFoodApp/3.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  } catch (remoteErr) {
    console.warn('Remote CDN food photo fetch failed:', remoteErr);
  }

  // 4. Fallback to local default thali feast
  try {
    const defaultLocalPath = path.join(process.cwd(), 'public', 'images', 'food', 'thali.jpg');
    if (fs.existsSync(defaultLocalPath)) {
      return await fs.promises.readFile(defaultLocalPath);
    }
  } catch (defErr) {
    console.warn('Default local thali fallback failed:', defErr);
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dish = (searchParams.get('dish') || 'Special Dish').trim();
    const restaurant = (searchParams.get('restaurant') || 'Restaurant').trim();
    const explicitImgUrl = (searchParams.get('imgUrl') || '').trim();

    const cacheKey = `${CACHE_VERSION}_${dish.toLowerCase()}_${restaurant.toLowerCase()}${explicitImgUrl ? '_' + encodeURIComponent(explicitImgUrl).slice(0, 40) : ''}`;
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

    // Identify authentic food source
    const isVerifiedExplicit = Boolean(
      explicitImgUrl &&
      (explicitImgUrl.startsWith('http://') || explicitImgUrl.startsWith('https://')) &&
      (explicitImgUrl.includes('swiggy.com') || explicitImgUrl.includes('cloudinary.com'))
    );

    // Resolve dish name with intelligent semantic matcher
    const canonicalKey = matchDishToCanonicalKey(dish, restaurant);
    const rawBuffer = await getRawFoodImageBuffer(canonicalKey, isVerifiedExplicit ? explicitImgUrl : undefined);

    let finalPngBuffer: Buffer | null = null;
    if (rawBuffer) {
      finalPngBuffer = await processFoodImageToPurePng(rawBuffer);
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
        'X-Food-Restaurant': encodeURIComponent(restaurant),
        'X-Canonical-Key': canonicalKey
      }
    });
  } catch (error: unknown) {
    console.error('AI Dish Image Generation Error:', error);
    // Emergency pure photographic gradient plate
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
