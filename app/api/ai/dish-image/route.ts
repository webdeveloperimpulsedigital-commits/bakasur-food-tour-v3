import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Cache key salt to instantly bust any previous stale in-memory cached buffers
const CACHE_VERSION = 'v32_accurate_search_dish_images_pav_bhaji_ragda_puri';
const imageBufferCache = new Map<string, { buffer: Buffer; timestamp: number }>();
imageBufferCache.clear();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Local authentic photographic assets stored in public/images/food/
const CANONICAL_LOCAL_ASSETS: Record<string, string> = {
  // Authentic Maharashtrian Main Courses, Sweets & Breads
  shrikhand_puri: 'shrikhand_puri.jpg',
  shrikhand: 'shrikhand.jpg',
  puri_bhaji: 'puri_bhaji.jpg',
  poori_bhaji: 'puri_bhaji.jpg',
  batata_bhaji: 'batata_bhaji.jpg',
  sukhi_bhaji: 'batata_bhaji.jpg',
  kheer: 'kheer.jpg',
  rice_kheer: 'kheer.jpg',
  shevai_kheer: 'kheer.jpg',
  seviyan_kheer: 'kheer.jpg',
  payasam: 'kheer.jpg',
  aamras_puri: 'aamras_puri.jpg',
  aamras: 'aamras.jpg',
  pithla_bhakri: 'pithla_bhakri.jpg',
  pitla_bhakri: 'pithla_bhakri.jpg',
  pithla: 'pithla_bhakri.jpg',
  pitla: 'pithla_bhakri.jpg',
  zunka_bhakar: 'pithla_bhakri.jpg',
  zunka: 'pithla_bhakri.jpg',
  bharli_vangi: 'bharli_vangi.jpg',
  varan_bhat: 'varan_bhat.jpg',
  masala_bhaat: 'masala_bhaat.jpg',
  thalipeeth: 'thalipeeth.jpg',
  bhajani_thalipeeth: 'thalipeeth.jpg',
  sabudana_khichdi: 'sabudana_khichdi.jpg',
  sabudana_vada: 'sabudana_vada.jpg',
  shev_bhaji: 'shev_bhaji.jpg',
  modak: 'modak.jpg',
  kothimbir_vadi: 'kothimbir_vadi.jpg',
  alu_vadi: 'alu_vadi.jpg',
  masala_taak: 'masala_taak.jpg',
  solkadhi: 'solkadhi.jpg',
  puran_poli: 'puran_poli.jpg',
  katachi_amti: 'katachi_amti.jpg',
  matki_usal: 'matki_usal.jpg',
  bhakri: 'bhakri.jpg',
  poha: 'poha.jpg',
  misal_pav: 'misal_pav.jpg',
  tomato_omelette: 'tomato_omelette.jpg',
  veg_omelette: 'tomato_omelette.jpg',

  // Street Food, Chaat & Pav Specialties
  ragda_pattice: 'ragda_pattice.jpg',
  pattice: 'ragda_pattice.jpg',
  ragda_patties: 'ragda_pattice.jpg',
  ragda_puri: 'ragda_puri.jpg',
  pani_puri: 'pani_puri.jpg',
  golgappa: 'pani_puri.jpg',
  puchka: 'pani_puri.jpg',
  masala_pav: 'masala_pav.jpg',
  butter_masala_pav: 'masala_pav.jpg',
  cheese_pav_bhaji: 'cheese_pav_bhaji.jpg',
  cheese_loaded_pav_bhaji: 'cheese_pav_bhaji.jpg',
  kanda_bhaji: 'kanda_bhaji.jpg',
  khekda_bhaji: 'kanda_bhaji.jpg',
  kanda_bhajiya: 'kanda_bhaji.jpg',
  kanda_pakoda: 'kanda_bhaji.jpg',
  onion_pakoda: 'kanda_bhaji.jpg',

  garlic_naan: 'garlic_naan.jpg',
  butter_naan: 'butter_naan.jpg',
  paratha: 'paratha.jpg',
  chole_bhature: 'chole_bhature.jpg',
  dal_makhani: 'dal_makhani.jpg',
  dal_tadka: 'dal_tadka.jpg',
  gulab_jamun: 'gulab_jamun.jpg',
  jalebi: 'jalebi.jpg',
  barfi: 'barfi.jpg',
  kaju_katli: 'kaju_katli.jpg',
  kaju_barfi: 'barfi.jpg',
  mango_barfi: 'mango_barfi.jpg',
  amba_barfi: 'mango_barfi.jpg',
  bhakarwadi: 'bhakarwadi.jpg',
  ladoo: 'ladoo.jpg',
  rasmalai: 'rasmalai.jpg',
  chai: 'chai.jpg',
  masala_chai: 'chai.jpg',
  coffee: 'coffee.jpg',
  filter_coffee: 'coffee.jpg',
  cold_coffee: 'coffee.jpg',
  kathi_roll: 'kathi_roll.jpg',
  mutton_thali: 'mutton_thali.jpg',
  mutton_curry: 'mutton_curry.jpg',
  chicken_curry: 'chicken_curry.jpg',
  chicken_lollipop: 'chicken_lollipop.jpg',
  fish_fry: 'fish_fry.jpg',
  seafood: 'fish_fry.jpg',
  thali: 'thali.jpg',
  jeera_rice: 'jeera_rice.jpg',
  biryani: 'biryani.jpg',
  chicken_biryani: 'biryani.jpg',
  fried_rice: 'fried_rice.jpg',
  pulao: 'pulao.jpg',
  veg_pulao: 'pulao.jpg',
  tawa_pulao: 'tawa_pulao.jpg',
  chicken_pulao: 'chicken_pulao.jpg',
  paneer_butter_masala: 'paneer_butter_masala.jpg',
  paneer_tikka: 'paneer_tikka.jpg',
  palak_paneer: 'palak_paneer.jpg',
  veg_kolhapuri: 'veg_kolhapuri.jpg',
  lassi: 'punjabi_lassi.jpg',
  punjabi_lassi: 'punjabi_lassi.jpg',
  pav_bhaji: 'pav_bhaji.jpg',
  vada_pav: 'vada_pav.jpg',
  samosa: 'samosa.jpg',
  dosa: 'dosa.jpg',
  idli: 'idli.jpg',
  momos: 'momos.jpg',
  // Pizza, Wood-Fired & Italian
  pizza: 'pizza.jpg',
  wood_fired_pizza: 'wood_fired_pizza.jpg',
  pizza_fire: 'wood_fired_pizza.jpg',
  fire_pizza: 'wood_fired_pizza.jpg',
  margherita_pizza: 'margherita_pizza.jpg',
  farmhouse_pizza: 'farmhouse_pizza.jpg',
  veg_supreme_pizza: 'farmhouse_pizza.jpg',
  paneer_pizza: 'paneer_pizza.jpg',
  chicken_pizza: 'pizza.jpg',
  pepperoni_pizza: 'pizza.jpg',
  garlic_bread: 'garlic_bread.jpg',
  cheese_garlic_bread: 'garlic_bread.jpg',
  garlic_breadsticks: 'garlic_bread.jpg',

  // Burgers & Fast Food
  burger: 'burger.jpg',
  sandwich: 'sandwich.jpg',
  crispy_chicken_burger: 'crispy_chicken_burger.jpg',
  zinger_burger: 'zinger_burger.jpg',

  // KFC & Crispy Fried Chicken
  fried_chicken: 'fried_chicken.jpg',
  kfc_fried_chicken: 'kfc_fried_chicken.jpg',
  crispy_fried_chicken: 'fried_chicken.jpg',
  chicken_bucket: 'kfc_fried_chicken.jpg',
  kfc_bucket: 'kfc_fried_chicken.jpg',
  chicken_popcorn: 'chicken_popcorn.jpg',
  popcorn_chicken: 'chicken_popcorn.jpg',
  chicken_strips: 'chicken_strips.jpg',
  chicken_tenders: 'chicken_strips.jpg',
  chicken_wings: 'chicken_wings.jpg',
  hot_wings: 'chicken_wings.jpg',

  // Fries
  fries: 'fries.jpg',
  peri_peri_fries: 'peri_peri_fries.jpg',
  cheesy_fries: 'peri_peri_fries.jpg',
  loaded_fries: 'peri_peri_fries.jpg',

  // Poultry & Tandoori
  butter_chicken: 'butter_chicken.jpg',
  tandoori_chicken: 'tandoori_chicken.jpg',
  chicken_tikka: 'tandoori_chicken.jpg',

  // Authentic Pune Mastani Varieties
  mango_mastani: 'mango_mastani.jpg',
  kesar_pista_mastani: 'kesar_pista_mastani.jpg',
  chocolate_mastani: 'chocolate_mastani.jpg',
  strawberry_mastani: 'strawberry_mastani.jpg',
  sitaphal_mastani: 'sitaphal_mastani.jpg',
  dryfruit_mastani: 'dryfruit_mastani.jpg',
  rose_mastani: 'rose_mastani.jpg',
  butterscotch_mastani: 'butterscotch_mastani.jpg',
  pista_mastani: 'kesar_pista_mastani.jpg',

  // Ice Cream Flavours & Sundaes
  ice_cream: 'vanilla_ice_cream.jpg',
  vanilla_ice_cream: 'vanilla_ice_cream.jpg',
  chocolate_ice_cream: 'chocolate_ice_cream.jpg',
  mango_ice_cream: 'mango_ice_cream.jpg',
  strawberry_ice_cream: 'strawberry_ice_cream.jpg',
  butterscotch_ice_cream: 'butterscotch_ice_cream.jpg',
  kesar_pista_ice_cream: 'kesar_pista_ice_cream.jpg',
  pista_ice_cream: 'kesar_pista_ice_cream.jpg',
  tender_coconut_ice_cream: 'tender_coconut_ice_cream.jpg',
  sitaphal_ice_cream: 'sitaphal_ice_cream.jpg',
  black_currant_ice_cream: 'black_currant_ice_cream.jpg',
  kaju_draksh_ice_cream: 'kaju_draksh_ice_cream.jpg',
  coffee_ice_cream: 'coffee_ice_cream.jpg',
  death_by_chocolate: 'death_by_chocolate.jpg',
  hot_fudge_sundae: 'hot_fudge_sundae.jpg',
  fruit_sundae: 'fruit_sundae.jpg',
  kulfi: 'kulfi.jpg',
  falooda: 'falooda.jpg'
};

// Remote verified CDN fallbacks for beverages, specialties, and network redundancy
const CANONICAL_REMOTE_PHOTOS: Record<string, string> = {
  // Thalis & Meals
  thali: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85',
  mutton_thali: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=85',
  fish_thali: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
  puran_poli_thali: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85',

  // Breads
  roti: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  butter_roti: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  tandoori_roti: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  paratha: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  paneer_paratha: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  gobi_paratha: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  laccha_paratha: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  garlic_naan: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  butter_naan: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  bhakri: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  puran_poli: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  kulcha: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  puri_bhaji: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',

  // Rice & Biryani & Pulao
  jeera_rice: 'https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  veg_biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  paneer_biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  mushroom_biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  chicken_biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  mutton_biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  egg_biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  fish_biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  prawn_biryani: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=85',
  fried_rice: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=85',
  chicken_fried_rice: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=85',
  pulao: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  tawa_pulao: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&auto=format&fit=crop&q=85',
  chicken_pulao: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  lemon_rice: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  curd_rice: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',

  // Chinese & Indo-Chinese
  noodles: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=85',
  veg_hakka_noodles: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=85',
  chicken_hakka_noodles: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=85',
  schezwan_noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=85',
  hot_garlic_noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=85',
  american_chopsuey: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=85',
  veg_manchurian: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  paneer_manchurian: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  chicken_manchurian: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&auto=format&fit=crop&q=85',
  chilli_paneer: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  chilli_chicken: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&auto=format&fit=crop&q=85',
  dragon_chicken: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=85',
  spring_roll: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85',
  chicken_spring_roll: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85',
  crispy_corn: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&auto=format&fit=crop&q=85',
  momos: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
  chicken_momos: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',

  // Curries & Gravies
  paneer_butter_masala: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  shahi_paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  paneer_tikka: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  palak_paneer: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  dal_makhani: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  dal_tadka: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  rajma_chawal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  veg_kolhapuri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  mix_veg: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  aloo_gobi: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  baingan_bharta: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  kadhi_pakora: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  butter_chicken: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=85',
  chicken_curry: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  chicken_tikka_masala: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  mutton_curry: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=85',
  fish_curry: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
  egg_curry: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=85',
  prawn_masala: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=85',

  // Street Food & Snacks
  chole_bhature: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',
  misal_pav: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  pav_bhaji: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85',
  vada_pav: 'https://images.unsplash.com/photo-1750767396969-f37060ebe07d?w=800&auto=format&fit=crop&q=85',
  samosa: 'https://images.unsplash.com/photo-1747008624832-e068ee496908?w=800&auto=format&fit=crop&q=85',
  kachori: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  aloo_tikki: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  pani_puri: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85',
  sev_puri: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  dahi_puri: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',
  bhel_puri: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',
  dabeli: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=85',
  ragda_pattice: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  chaat: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  kanda_bhaji: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  pakoda: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  sabudana_vada: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop&q=85',
  poha: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=85',

  // South Indian
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  plain_dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  rava_dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  set_dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  uttapam: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop&q=85',
  idli: 'https://images.unsplash.com/photo-1741376509047-66dae5df90f9?w=800&auto=format&fit=crop&q=85',
  medu_vada: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop&q=85',
  sambar_vada: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&auto=format&fit=crop&q=85',
  upma: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  appam: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  puttu: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',
  pongal: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  idiyappam: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=85',
  kerala_parotta: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  chicken_dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=85',

  // Pizza, Pasta & Italian
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85',
  veg_supreme_pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85',
  paneer_pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85',
  chicken_pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85',
  pepperoni_pizza: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=85',
  white_sauce_pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=85',
  red_sauce_pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=85',
  pink_sauce_pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=85',
  alfredo_pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=85',
  arrabbiata_pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=85',
  lasagna: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&auto=format&fit=crop&q=85',
  garlic_bread: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800&auto=format&fit=crop&q=85',
  cheesy_fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85',

  // Burgers, Sandwiches & Fast Food
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  aloo_tikki_burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  paneer_burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  chicken_burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  crispy_chicken_burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  fish_burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85',
  peri_peri_fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  cheese_sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  club_sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  chicken_sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  kathi_roll: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  paneer_wrap: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  chicken_wrap: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  hot_dog: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=800&auto=format&fit=crop&q=85',
  nuggets: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=85',
  chicken_wings: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=85',

  // Tandoori & Grilled
  tandoori_chicken: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tandoorimumbai.jpg',
  chicken_tikka: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tandoorimumbai.jpg',
  chicken_lollipop: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=85',
  tandoori_mushroom: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  hara_bhara_kebab: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  veg_seekh_kebab: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=85',
  chicken_seekh_kebab: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=85',
  mutton_seekh_kebab: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=85',
  fish_tikka: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
  tandoori_fish: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=85',
  grilled_chicken: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&auto=format&fit=crop&q=85',
  bbq_chicken_wings: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=85',

  // Seafood
  seafood: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=85',
  fish_fry: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=85',
  surmai_fry: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=85',
  pomfret_fry: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=85',
  prawn_fry: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=85',
  butter_garlic_prawns: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=85',
  crab_masala: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85',

  // Breakfast
  tomato_omelette: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85',
  pancakes: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop&q=85',
  waffles: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=85',
  french_toast: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop&q=85',
  egg_dish: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=85',
  bread_omelette: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=85',
  boiled_eggs: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=85',
  scrambled_eggs: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=85',
  cheese_omelette: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=85',
  cornflakes: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=800&auto=format&fit=crop&q=85',
  oats: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=800&auto=format&fit=crop&q=85',
  granola_bowl: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=800&auto=format&fit=crop&q=85',

  // Healthy & Salads
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85',
  caesar_salad: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&auto=format&fit=crop&q=85',
  greek_salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85',
  garden_salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=85',
  sprouts_salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85',
  fruit_bowl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&auto=format&fit=crop&q=85',
  protein_bowl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85',
  buddha_bowl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=85',
  grilled_chicken_salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85',
  paneer_salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85',
  quinoa_bowl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85',
  smoothie_bowl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=85',
  grilled_vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=85',

  // Beverages (Clean cups / glasses of coffee/tea, NOT café interiors!)
  coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85',
  filter_coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85',
  espresso: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&auto=format&fit=crop&q=85',
  cappuccino: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=85',
  latte: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85',
  americano: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85',
  mocha: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=85',
  cold_coffee: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85',
  iced_coffee: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85',
  chai: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=800&auto=format&fit=crop&q=85',
  masala_chai: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=800&auto=format&fit=crop&q=85',
  green_tea: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=800&auto=format&fit=crop&q=85',
  lemon_tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=85',
  iced_tea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=85',
  hot_chocolate: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&auto=format&fit=crop&q=85',
  milkshakes: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  smoothie: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=85',
  smoothies: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=85',
  fruit_juice: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=85',
  mango_mastani: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85',
  kesar_pista_mastani: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=800&auto=format&fit=crop&q=85',
  chocolate_mastani: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  strawberry_mastani: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=85',
  sitaphal_mastani: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  dryfruit_mastani: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=800&auto=format&fit=crop&q=85',
  rose_mastani: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=800&auto=format&fit=crop&q=85',
  butterscotch_mastani: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=85',
  pista_mastani: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  lassi: 'https://images.unsplash.com/photo-1571006687898-3bfd4b407421?w=800&auto=format&fit=crop&q=85',
  punjabi_lassi: 'https://images.unsplash.com/photo-1571006687898-3bfd4b407421?w=800&auto=format&fit=crop&q=85',

  // Sweets & Desserts
  barfi: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  kaju_katli: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  kaju_barfi: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  mango_barfi: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  amba_barfi: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  bhakarwadi: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=85',
  ladoo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  rasmalai: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  gulab_jamun: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  jalebi: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=85',
  shrikhand: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  basundi: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  gajar_halwa: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  kulfi: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  ice_cream: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=85',
  vanilla_ice_cream: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=85',
  chocolate_ice_cream: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  mango_ice_cream: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  strawberry_ice_cream: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=85',
  butterscotch_ice_cream: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=85',
  kesar_pista_ice_cream: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  pista_ice_cream: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  tender_coconut_ice_cream: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  sitaphal_ice_cream: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  black_currant_ice_cream: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=85',
  kaju_draksh_ice_cream: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=800&auto=format&fit=crop&q=85',
  coffee_ice_cream: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=85',
  death_by_chocolate: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85',
  hot_fudge_sundae: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=85',
  fruit_sundae: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=85',
  falooda: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=800&auto=format&fit=crop&q=85',
  rabri: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  malpua: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=85',
  fruit_custard: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=85',
  brownie: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=85',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=85',
  pastries: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=85',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=85',
  muffins: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=85',
  donuts: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&auto=format&fit=crop&q=85',
  cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&auto=format&fit=crop&q=85',
  cheesecake: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=85',
  nachos: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&auto=format&fit=crop&q=85',
  loaded_fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85',

  // Maharashtrian Main Courses, Sweets & Breads
  shrikhand_puri: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=85',
  batata_bhaji: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  kheer: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  rice_kheer: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  shevai_kheer: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  aamras_puri: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85',
  aamras: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85',
  pithla_bhakri: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85',
  zunka_bhakar: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=85',
  bharli_vangi: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  varan_bhat: 'https://images.unsplash.com/photo-1789991184293-224a84e41900?w=800&auto=format&fit=crop&q=85',
  masala_bhaat: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=85',
  thalipeeth: 'https://images.unsplash.com/photo-1668357530437-72a12c660f94?w=800&auto=format&fit=crop&q=85',
  sabudana_khichdi: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=85',
  ukadiche_modak: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=85',
  katachi_amti: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=85',
  matki_usal: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=85',
  bun_maska: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
  default_feast: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=800&auto=format&fit=crop&q=85'
};

/**
 * Intelligent Culinary Semantic Matcher
 * Parses the dish name with strict semantic boundaries and category isolation across all 15 categories.
 * Dishes will NEVER cross categories or protein types (e.g. veg biryani vs chicken biryani, coffee in cup vs cafe interior).
 */
function matchDishToCanonicalKey(dishName: string, restaurantName: string = ''): string {
  const d = (dishName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const r = (restaurantName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // === 0. TRADITIONAL BEVERAGES & COOLERS ===
  if (d.includes('solkadhi') || d.includes('sol kadhi') || d.includes('kokum kadhi')) {
    return 'solkadhi';
  }
  if (
    d.includes('taak') || d.includes('tak') || d.includes('mattha') ||
    d.includes('matha') || d.includes('chaas') || d.includes('chhas') ||
    d.includes('buttermilk') || d.includes('spiced butter milk') || d.includes('masala curd')
  ) {
    return 'masala_taak';
  }
  if (
    /\blassi\b/.test(d) || /\blasi\b/.test(d) ||
    (d.includes('punjabi') && (d.includes('sweet') || d.includes('curd') || d.includes('malai') || d.includes('yogurt')))
  ) {
    return 'punjabi_lassi';
  }

  // Hot & Cold Teas
  if (d.includes('green tea')) return 'green_tea';
  if (d.includes('lemon tea')) return 'lemon_tea';
  if (d.includes('iced tea')) return 'iced_tea';
  if (
    d.includes('chai') || d.includes('chaha') ||
    (/\btea\b/.test(d) && !d.includes('steam')) ||
    d.includes('masala tea') || d.includes('cutting chai') || d.includes('irani chai') ||
    d.includes('ginger tea')
  ) {
    return 'chai';
  }

  // Coffee Ice Cream isolation before beverage coffee check
  if ((d.includes('coffee') || d.includes('mocha') || d.includes('espresso')) && (d.includes('ice cream') || d.includes('icecream') || d.includes('gelato') || d.includes('sundae'))) {
    return 'coffee_ice_cream';
  }

  // Coffees (All strictly beverage in cup/glass, NO cafe interiors!)
  if (d.includes('espresso')) return 'espresso';
  if (d.includes('cappuccino')) return 'cappuccino';
  if (d.includes('latte')) return 'latte';
  if (d.includes('americano')) return 'americano';
  if (d.includes('mocha')) return 'mocha';
  if (d.includes('cold coffee') || d.includes('frappe')) return 'cold_coffee';
  if (d.includes('iced coffee')) return 'iced_coffee';
  if (d.includes('filter coffee') || d.includes('kaapi') || d.includes('coffee') || d.includes('macchiato')) return 'coffee';

  // Cafe Beverages & Shakes
  if (d.includes('hot chocolate') || d.includes('hot cocoa')) return 'hot_chocolate';

  // Authentic Pune Mastani Varieties (Strictly mapped by flavor, restaurant & dish context)
  if (d.includes('mastani') || r.includes('mastani') || r.includes('sujata')) {
    if (d.includes('falooda') || d.includes('faluda')) return 'falooda';
    if (d.includes('kulfi')) return 'kulfi';
    if (d.includes('chocolate') || d.includes('brownie') || d.includes('fudge') || d.includes('cocoa') || d.includes('dark')) return 'chocolate_mastani';
    if (d.includes('kesar') || d.includes('pista') || d.includes('pistachio') || d.includes('saffron')) return 'kesar_pista_mastani';
    if (d.includes('strawberry') || d.includes('berry')) return 'strawberry_mastani';
    if (d.includes('sitaphal') || d.includes('custard apple')) return 'sitaphal_mastani';
    if (d.includes('anjir') || d.includes('badam') || d.includes('fig') || d.includes('almond') || d.includes('dryfruit') || d.includes('dry fruit') || d.includes('kaju') || d.includes('royal')) return 'dryfruit_mastani';
    if (d.includes('rose') || d.includes('gulkand')) return 'rose_mastani';
    if (d.includes('butterscotch') || d.includes('caramel')) return 'butterscotch_mastani';
    return 'mango_mastani';
  }

  if (d.includes('smoothie')) return 'smoothies';
  if (d.includes('milkshake') || d.includes('shake')) return 'milkshakes';
  if (d.includes('juice') || d.includes('fresh lime') || d.includes('lemonade') || d.includes('sharbat')) return 'fruit_juice';

  // === 0b. AUTHENTIC MAHARASHTRIAN MAIN COURSES, SPECIALTIES & SWEETS ===
  // Shrikhand, Amrakhand & Puri Combos
  if ((d.includes('shrikhand') || d.includes('amrakhand') || d.includes('shrikhanda')) && (d.includes('puri') || d.includes('poori') || d.includes('plate') || d.includes('combo') || d.includes('thali'))) {
    return 'shrikhand_puri';
  }
  if (d.includes('shrikhand') || d.includes('amrakhand') || d.includes('srikhand')) {
    return 'shrikhand';
  }

  // Aamras & Puri Combos
  if ((d.includes('aamras') || d.includes('amras') || d.includes('aam ras') || d.includes('mango pulp') || d.includes('aamrasa')) && (d.includes('puri') || d.includes('poori') || d.includes('plate') || d.includes('combo') || d.includes('thali'))) {
    return 'aamras_puri';
  }
  if (d.includes('aamras') || d.includes('amras') || d.includes('aam ras')) {
    return 'aamras';
  }

  // Puri Bhaji / Poori Bhaji & Batata Sukhi Bhaji
  if (
    d.includes('puri bhaji') || d.includes('poori bhaji') ||
    d.includes('puri sagu') || d.includes('poori sagu') ||
    d.includes('puri masala') || d.includes('poori masala') ||
    (d.includes('puri') && (d.includes('bhaji') || d.includes('batata') || d.includes('aloo') || d.includes('alu')))
  ) {
    return 'puri_bhaji';
  }
  if (
    d.includes('batata sukhi bhaji') || d.includes('batata bhaji') ||
    d.includes('batatyachi bhaji') || d.includes('sukhi bhaji') ||
    d.includes('sukha batata') || d.includes('sukha aloo') || d.includes('aloo sukhi')
  ) {
    return 'batata_bhaji';
  }

  // Traditional Kheer, Shevai Kheer, Rice Kheer & Payasam
  if (
    d.includes('kheer') || d.includes('khir') || d.includes('payasam') ||
    d.includes('payasa') || d.includes('seviyan') || d.includes('shevai') ||
    d.includes('rice pudding') || d.includes('tandul kheer') || d.includes('gud kheer')
  ) {
    return 'kheer';
  }

  // Puran Poli
  if (d.includes('puran poli') || d.includes('puranpoli') || d.includes('vedmi') || d.includes('bobbatlu') || d.includes('holige')) {
    return 'puran_poli';
  }

  // Pithla Bhakri, Zunka Bhakar & Besan
  if (
    d.includes('pithla') || d.includes('pitla') ||
    d.includes('zunka') || d.includes('zhunka') ||
    d.includes('junka') || d.includes('besan bhakri') ||
    (d.includes('bhakri') && (d.includes('thecha') || d.includes('kanda')))
  ) {
    return 'pithla_bhakri';
  }

  // Bharli Vangi (Stuffed Eggplants)
  if (d.includes('bharli vangi') || d.includes('bharli wangi') || d.includes('vangyachi bhaji') || (d.includes('vangi') && !d.includes('bharta'))) {
    return 'bharli_vangi';
  }

  // Varan Bhat (Indrayani Rice with Golden Toor Dal & Pure Ghee)
  if (
    d.includes('varan bhat') || d.includes('varan bhaat') ||
    d.includes('indrayani varan') || d.includes('indrayani bhat') ||
    d.includes('dal varan') || d.includes('sajuk toop bhat') ||
    (d.includes('bhat') && d.includes('varan')) || (d.includes('rice') && d.includes('varan'))
  ) {
    return 'varan_bhat';
  }

  // Masala Bhaat (Spiced Goda Masala Wedding Rice)
  if (
    d.includes('masala bhaat') || d.includes('masala bhat') ||
    d.includes('masale bhaat') || d.includes('masale bhat') ||
    d.includes('goda masala rice') || d.includes('marathi rice')
  ) {
    return 'masala_bhaat';
  }

  // Thalipeeth
  if (d.includes('thalipeeth') || d.includes('thali pith') || d.includes('bhajani thalipeeth') || d.includes('dhapate')) {
    return 'thalipeeth';
  }

  // Sabudana Khichdi
  if (d.includes('sabudana khichdi') || d.includes('sabudana khichadi') || d.includes('sago khichdi') || (d.includes('sabudana') && (d.includes('khichdi') || d.includes('dahi')))) {
    return 'sabudana_khichdi';
  }

  // Sabudana Vada
  if (d.includes('sabudana vada') || d.includes('sabudana wada') || d.includes('sago vada')) {
    return 'sabudana_vada';
  }

  // Modak / Ukdiche Modak
  if (d.includes('modak') || d.includes('ukdiche modak') || d.includes('ukadiche modak')) {
    return 'modak';
  }

  // Kothimbir Vadi & Alu Vadi
  if (d.includes('kothimbir') || d.includes('kothambir') || d.includes('coriander vadi')) {
    return 'kothimbir_vadi';
  }
  if (d.includes('alu vadi') || d.includes('aloo vadi') || d.includes('patra') || d.includes('aluche')) {
    return 'alu_vadi';
  }

  // Khandeshi Shev Bhaji
  if (d.includes('shev bhaji') || d.includes('sev bhaji') || d.includes('shev curry')) {
    return 'shev_bhaji';
  }

  // Katachi Amti
  if (d.includes('katachi amti') || d.includes('amti') || d.includes('aamti') || d.includes('chana dal amti')) {
    return 'katachi_amti';
  }

  // Matki Usal
  if (d.includes('matki usal') || d.includes('usal') || d.includes('misal rassa')) {
    return 'matki_usal';
  }

  // Dadpe Pohe
  if (d.includes('dadpe pohe') || d.includes('dadpe poha')) {
    return 'poha';
  }

  // === 1. INDIAN STREET FOOD, CHAAT & PAV SPECIALTIES ===
  // Cheese Pav Bhaji (Must precede regular Pav Bhaji)
  if (
    (d.includes('cheese') || d.includes('cheesy')) &&
    (d.includes('pav bhaji') || d.includes('pavbhaji') || d.includes('bhaji pav') || (d.includes('pav') && d.includes('bhaji')))
  ) {
    return 'cheese_pav_bhaji';
  }

  // Regular Pav Bhaji
  if (
    d.includes('pav bhaji') || d.includes('pavbhaji') || d.includes('bhaji pav') ||
    (d.includes('pav') && d.includes('bhaji') && !d.includes('masala pav') && !d.includes('vada pav') && !d.includes('misal'))
  ) {
    return 'pav_bhaji';
  }

  // Masala Pav (Distinct dish: spiced butter pav tossed on tawa, NOT pav bhaji)
  if (
    d.includes('masala pav') || d.includes('masalapav') ||
    (d.includes('masala') && d.includes('pav') && !d.includes('bhaji') && !d.includes('vada') && !d.includes('misal'))
  ) {
    return 'masala_pav';
  }

  // Vada Pav
  if (d.includes('vada pav') || d.includes('vadapav') || d.includes('wada pav') || d.includes('batata vada') || d.includes('batatavada')) {
    return 'vada_pav';
  }

  // Ragda Puri (Strictly before Ragda Pattice)
  if (
    d.includes('ragda puri') || d.includes('ragdapuri') ||
    (d.includes('ragda') && (d.includes('puri') || d.includes('poori')))
  ) {
    return 'ragda_puri';
  }

  // Ragda Pattice
  if (
    d.includes('ragda pattice') || d.includes('ragda patties') || d.includes('pattice') || d.includes('patties') ||
    (d.includes('ragda') && !d.includes('puri') && !d.includes('poori'))
  ) {
    return 'ragda_pattice';
  }

  // Pani Puri (Golgappa)
  if (d.includes('pani puri') || d.includes('panipuri') || d.includes('golgappa') || d.includes('golgappe') || d.includes('puchka')) {
    return 'pani_puri';
  }

  // Sev Puri & SPDP & Dahi Puri & Bhel
  if (d.includes('sev puri') || d.includes('shev puri') || d.includes('sev batata')) return 'sev_puri';
  if (d.includes('dahi puri') || d.includes('spdp') || d.includes('dahi batata') || d.includes('dahi papdi')) return 'dahi_puri';
  if (d.includes('bhel') || d.includes('bhelpuri') || d.includes('sukha bhel') || d.includes('oli bhel') || d.includes('matki bhel')) return 'bhel_puri';
  if (d.includes('dabeli') || d.includes('kutchi dabeli')) return 'dabeli';

  // Kanda Bhaji / Onion Pakoda (Strictly crispy onion fritters)
  if (
    d.includes('kanda bhaji') || d.includes('kanda bhajji') || d.includes('khekda bhaji') ||
    d.includes('kanda pakoda') || d.includes('kanda bhajiya') || d.includes('onion pakoda') ||
    d.includes('onion bhaji') || d.includes('pyaz pakoda') ||
    (d.includes('bhajiya') || d.includes('pakoda') || d.includes('bhajji'))
  ) {
    return 'kanda_bhaji';
  }

  // Misal Pav
  if (d.includes('misal') || d.includes('missal') || d.includes('katakirr') || d.includes('tarri pav')) return 'misal_pav';
  if (d.includes('samosa') || d.includes('samose')) return 'samosa';
  if (d.includes('kachori') || d.includes('khasta kachori')) return 'kachori';
  if (d.includes('aloo tikki') || d.includes('alu tikki')) return 'aloo_tikki';
  if (d.includes('chaat') || d.includes('papdi chaat')) return 'chaat';
  if (d.includes('sabudana vada') || d.includes('sabudana wada')) return 'sabudana_vada';
  if (d.includes('poha') || d.includes('pohe') || d.includes('kanda poha') || d.includes('batata poha')) return 'poha';

  // === KFC, FRIED CHICKEN & FAST FOOD CHICKEN ===
  if (
    d.includes('kfc') ||
    d.includes('fried chicken') ||
    d.includes('crispy chicken') ||
    d.includes('chicken popcorn') ||
    d.includes('popcorn chicken') ||
    d.includes('chicken strips') ||
    d.includes('chicken tenders') ||
    d.includes('chicken bucket') ||
    d.includes('hot wings') ||
    d.includes('zinger') ||
    r.includes('kfc') ||
    r.includes('kentucky')
  ) {
    if (d.includes('zinger') || d.includes('burger')) return 'zinger_burger';
    if (d.includes('popcorn')) return 'chicken_popcorn';
    if (d.includes('strip') || d.includes('tender')) return 'chicken_strips';
    if (d.includes('wing')) return 'chicken_wings';
    if (d.includes('peri peri') && d.includes('fries')) return 'peri_peri_fries';
    if (d.includes('fries') || d.includes('french fries')) return 'fries';
    return 'kfc_fried_chicken';
  }

  // === 2. BURGERS, SANDWICHES & FAST FOOD ===
  if (d.includes('burger')) {
    if (d.includes('zinger')) return 'zinger_burger';
    if (d.includes('aloo') || d.includes('tikki')) return 'aloo_tikki_burger';
    if (d.includes('paneer')) return 'paneer_burger';
    if (d.includes('fish')) return 'fish_burger';
    if (d.includes('crispy') || d.includes('crunchy') || d.includes('fried chicken')) return 'crispy_chicken_burger';
    if (d.includes('chicken')) return 'crispy_chicken_burger';
    return 'burger';
  }
  if (d.includes('sandwich') || d.includes('sandwiches') || (d.includes('toast') && !d.includes('french toast'))) {
    if (d.includes('club')) return 'club_sandwich';
    if (d.includes('chicken')) return 'chicken_sandwich';
    if (d.includes('cheese') || d.includes('grilled cheese')) return 'cheese_sandwich';
    if (d.includes('bun maska')) return 'bun_maska';
    return 'sandwich';
  }
  if (d.includes('wrap') || d.includes('roll') || d.includes('frankie')) {
    if (d.includes('chicken')) return 'chicken_wrap';
    if (d.includes('paneer')) return 'paneer_wrap';
    return 'kathi_roll';
  }
  if (d.includes('fries') || d.includes('french fries') || d.includes('finger chips') || d.includes('wedges')) {
    if (d.includes('peri') || d.includes('spicy') || d.includes('masala')) return 'peri_peri_fries';
    if (d.includes('cheese') || d.includes('cheesy')) return 'cheesy_fries';
    if (d.includes('loaded')) return 'loaded_fries';
    return 'fries';
  }
  if (d.includes('hot dog') || d.includes('hotdog')) return 'hot_dog';
  if (d.includes('nugget') || d.includes('nuggets')) return 'chicken_popcorn';
  if (d.includes('wings') || d.includes('chicken wings')) return 'chicken_wings';
  if (d.includes('nachos')) return 'nachos';
  if (d.includes('garlic bread') || d.includes('breadsticks') || d.includes('bruschetta')) return 'garlic_bread';

  // === 3. PIZZA, WOOD-FIRED & ITALIAN ===
  if (
    d.includes('pizza') ||
    d.includes('calzone') ||
    d.includes('margherita') ||
    d.includes('margarita') ||
    d.includes('pepperoni') ||
    d.includes('flatbread') ||
    r.includes('pizza') ||
    r.includes('pizzeria') ||
    r.includes('italian')
  ) {
    if (d.includes('margherita') || d.includes('margarita') || d.includes('basil')) return 'margherita_pizza';
    if (d.includes('pepperoni')) return 'pepperoni_pizza';
    if (d.includes('paneer') || d.includes('peppy paneer')) return 'paneer_pizza';
    if (d.includes('chicken') || d.includes('bbq chicken')) return 'chicken_pizza';
    if (d.includes('farmhouse') || d.includes('supreme') || d.includes('veggie') || d.includes('cheese burst')) return 'farmhouse_pizza';
    if (d.includes('fire') || d.includes('wood') || d.includes('brick oven') || d.includes('artisan') || d.includes('neapolitan')) return 'wood_fired_pizza';
    return 'wood_fired_pizza';
  }
  if (d.includes('pasta') || d.includes('penne') || d.includes('spaghetti') || d.includes('mac and cheese') || d.includes('fusilli')) {
    if (d.includes('white sauce') || d.includes('alfredo') || d.includes('bechamel')) return 'white_sauce_pasta';
    if (d.includes('red sauce') || d.includes('arrabbiata') || d.includes('arrabiata') || d.includes('marinara')) return 'red_sauce_pasta';
    if (d.includes('pink sauce')) return 'pink_sauce_pasta';
    return 'white_sauce_pasta';
  }
  if (d.includes('lasagna') || d.includes('lasagne')) return 'lasagna';

  // === 4. CHINESE & INDO-CHINESE ===
  if (d.includes('noodle') || d.includes('noodles') || d.includes('chow mein') || d.includes('chowmein') || d.includes('hakka')) {
    if (d.includes('schezwan') || d.includes('shezwan')) return 'schezwan_noodles';
    if (d.includes('hot garlic')) return 'hot_garlic_noodles';
    if (d.includes('chicken') || d.includes('egg') || d.includes('non veg')) return 'chicken_hakka_noodles';
    return 'veg_hakka_noodles';
  }
  if (d.includes('chopsuey') || d.includes('chop suey')) return 'american_chopsuey';
  if (d.includes('manchurian')) {
    if (d.includes('chicken')) return 'chicken_manchurian';
    if (d.includes('paneer')) return 'paneer_manchurian';
    return 'veg_manchurian';
  }
  if (d.includes('chilli paneer') || d.includes('paneer chilli')) return 'chilli_paneer';
  if (d.includes('chilli chicken') || d.includes('chicken chilli')) return 'chilli_chicken';
  if (d.includes('dragon chicken')) return 'dragon_chicken';
  if (d.includes('crispy corn') || d.includes('corn crispy')) return 'crispy_corn';
  if (d.includes('spring roll')) {
    if (d.includes('chicken')) return 'chicken_spring_roll';
    return 'spring_roll';
  }
  if (d.includes('momo') || d.includes('momos') || d.includes('dimsum')) {
    if (d.includes('chicken') || d.includes('mutton') || d.includes('meat') || d.includes('non veg')) return 'chicken_momos';
    return 'momos';
  }

  // === 5. RICE, BIRYANI & PULAO/PULAV ===
  if (d.includes('fried rice') || d.includes('schezwan rice') || d.includes('triple rice')) {
    if (d.includes('chicken') || d.includes('egg') || d.includes('prawn') || d.includes('non veg')) return 'chicken_fried_rice';
    return 'fried_rice';
  }
  if (d.includes('biryani') || d.includes('biriyani') || d.includes('briyani')) {
    if (d.includes('prawn') || d.includes('kolambi')) return 'prawn_biryani';
    if (d.includes('fish') || d.includes('surmai')) return 'fish_biryani';
    if (d.includes('mutton') || d.includes('gosht') || d.includes('lamb')) return 'mutton_biryani';
    if (d.includes('chicken') || d.includes('murgh')) return 'chicken_biryani';
    if (d.includes('egg') || d.includes('anda')) return 'egg_biryani';
    if (d.includes('paneer')) return 'paneer_biryani';
    if (d.includes('mushroom')) return 'mushroom_biryani';
    return 'veg_biryani';
  }
  if (d.includes('pulao') || d.includes('pulav') || d.includes('pilaf') || d.includes('pilau') || d.includes('masale bhaat')) {
    if (d.includes('tawa') || d.includes('tava') || d.includes('mumbai')) return 'tawa_pulao';
    if (d.includes('chicken') || d.includes('yakhni') || d.includes('mutton') || d.includes('prawn') || d.includes('egg') || d.includes('murgh')) return 'chicken_pulao';
    return 'pulao';
  }
  if (d.includes('lemon rice') || d.includes('chitranna')) return 'lemon_rice';
  if (d.includes('curd rice') || d.includes('thayir sadam') || d.includes('dahi bhaat')) return 'curd_rice';
  if (d.includes('jeera rice') || d.includes('steam rice') || d.includes('steamed rice') || d.includes('khichdi') || d.includes('varan bhat') || d.includes('ghee rice') || /\brice\b/.test(d)) {
    return 'jeera_rice';
  }

  // === 6. SOUTH INDIAN ===
  if (d.includes('dosa') || d.includes('dosai')) {
    if (d.includes('chicken') || d.includes('mutton') || d.includes('keema')) return 'chicken_dosa';
    if (d.includes('rava') || d.includes('ravva')) return 'rava_dosa';
    if (d.includes('set dosa')) return 'set_dosa';
    if (d.includes('plain dosa') || d.includes('sada dosa')) return 'plain_dosa';
    return 'dosa';
  }
  if (d.includes('uttapam') || d.includes('uthappam') || d.includes('oothappam')) return 'uttapam';
  if (d.includes('sambar vada') || d.includes('sambar wada')) return 'sambar_vada';
  if (d.includes('medu vada') || d.includes('vada sambar') || d.includes('wada sambar')) return 'medu_vada';
  if (d.includes('idli') || d.includes('idly') || d.includes('thatte idli')) return 'idli';
  if (d.includes('upma') || d.includes('uppittu')) return 'upma';
  if (d.includes('appam') && !d.includes('idiyappam')) return 'appam';
  if (d.includes('puttu')) return 'puttu';
  if (d.includes('pongal') || d.includes('ven pongal')) return 'pongal';
  if (d.includes('idiyappam')) return 'idiyappam';
  if (d.includes('kerala parotta') || d.includes('malabar parotta') || d.includes('porotta')) return 'kerala_parotta';

  // === 7. NORTH INDIAN BREADS ===
  if (d.includes('garlic naan') || d.includes('lasuni naan') || (d.includes('naan') && d.includes('garlic'))) return 'garlic_naan';
  if (d.includes('butter naan')) return 'butter_naan';
  if (d.includes('naan')) return 'butter_naan';
  if (d.includes('tandoori roti') || d.includes('tandoor roti')) return 'tandoori_roti';
  if (d.includes('butter roti')) return 'butter_roti';
  if (d.includes('roti') || d.includes('chapati') || d.includes('phulka')) return 'roti';
  if (d.includes('bhakri') || d.includes('rotla')) return 'bhakri';
  if (d.includes('paneer paratha')) return 'paneer_paratha';
  if (d.includes('gobi paratha') || d.includes('gobhi paratha')) return 'gobi_paratha';
  if (d.includes('laccha paratha') || d.includes('lachha paratha')) return 'laccha_paratha';
  if (d.includes('paratha') || d.includes('parantha') || d.includes('aloo paratha') || d.includes('thepla')) return 'paratha';
  if (d.includes('kulcha')) return 'kulcha';
  if (d.includes('puri bhaji') || d.includes('poori bhaji')) return 'puri_bhaji';
  if (d.includes('bhature') || d.includes('bhatura') || (d.includes('chole') && !d.includes('rice')) || d.includes('chhole')) return 'chole_bhature';
  if (d.includes('puran poli') || d.includes('puranpoli')) return 'puran_poli';

  // === 8. INDIAN MAIN COURSE CURRIES ===
  // 8a. Vegetarian Curries
  if (d.includes('shahi paneer')) return 'shahi_paneer';
  if (d.includes('palak paneer') || d.includes('saag paneer') || (d.includes('paneer') && (d.includes('palak') || d.includes('saag') || d.includes('spinach')))) return 'palak_paneer';
  if (d.includes('paneer butter') || d.includes('paneer makhani') || d.includes('paneer makhanwala') || (d.includes('paneer') && !d.includes('tikka') && !d.includes('chilli'))) return 'paneer_butter_masala';
  if (d.includes('dal makhani') || d.includes('makhani dal')) return 'dal_makhani';
  if (d.includes('dal tadka') || d.includes('dal fry') || d.includes('yellow dal') || d.includes('varan') || d.includes('dal') || d.includes('daal')) return 'dal_tadka';
  if (d.includes('rajma')) return 'rajma_chawal';
  if (d.includes('veg kolhapuri') || d.includes('kolhapuri veg')) return 'veg_kolhapuri';
  if (d.includes('mix veg') || d.includes('mixed veg') || d.includes('subz handi')) return 'mix_veg';
  if (d.includes('aloo gobi') || d.includes('alu gobi') || d.includes('aloo gobhi')) return 'aloo_gobi';
  if (d.includes('baingan bharta') || d.includes('vangyache bharit') || d.includes('baingan ka bharta')) return 'baingan_bharta';
  if (d.includes('kadhi pakora') || d.includes('punjabi kadhi') || d.includes('kadhi pakoda')) return 'kadhi_pakora';

  // 8b. Non-Vegetarian Curries
  if (d.includes('butter chicken') || d.includes('murgh makhani')) return 'butter_chicken';
  if (d.includes('chicken tikka masala') || d.includes('murgh tikka masala')) return 'chicken_tikka_masala';
  if (d.includes('chicken curry') || d.includes('chicken handi') || d.includes('chicken masala') || d.includes('chicken rassa') || d.includes('chicken kadai') || d.includes('kadhai chicken') || d.includes('murgh handi') || d.includes('chicken korma') || d.includes('chicken kolhapuri')) return 'chicken_curry';
  if (d.includes('mutton') || d.includes('gosht') || d.includes('rogan josh') || d.includes('nihari') || d.includes('tambda') || d.includes('pandhra') || d.includes('sukka') || d.includes('laal maas')) return 'mutton_curry';
  if ((d.includes('fish') || d.includes('surmai') || d.includes('pomfret')) && (d.includes('curry') || d.includes('rassa') || d.includes('gravy') || d.includes('caldin'))) return 'fish_curry';
  if (d.includes('egg curry') || d.includes('anda curry') || d.includes('anda rassa')) return 'egg_curry';
  if ((d.includes('prawn') || d.includes('kolambi')) && (d.includes('masala') || d.includes('curry') || d.includes('sukka'))) return 'prawn_masala';
  if (d.includes('crab')) return 'crab_masala';

  // === 9. SEAFOOD SPECIALTIES ===
  if (d.includes('surmai') && (d.includes('fry') || d.includes('rava') || d.includes('tawa'))) return 'surmai_fry';
  if (d.includes('pomfret') && (d.includes('fry') || d.includes('rava') || d.includes('tawa'))) return 'pomfret_fry';
  if ((d.includes('prawn') || d.includes('kolambi')) && d.includes('butter') && d.includes('garlic')) return 'butter_garlic_prawns';
  if ((d.includes('prawn') || d.includes('kolambi')) && (d.includes('fry') || d.includes('koliwada'))) return 'prawn_fry';
  if (d.includes('fish') && (d.includes('fry') || d.includes('koliwada') || d.includes('amritsari'))) return 'fish_fry';
  if (d.includes('seafood') || d.includes('bombil') || d.includes('tisreo')) return 'seafood';

  // === 10. TANDOORI, KEBAB & GRILLED FOOD ===
  if (d.includes('tandoori mushroom') || d.includes('mushroom tikka')) return 'tandoori_mushroom';
  if (d.includes('hara bhara') || d.includes('dahi ke kabab') || d.includes('dahi kebab')) return 'hara_bhara_kebab';
  if ((d.includes('seekh') || d.includes('kebab') || d.includes('kabab')) && (d.includes('veg') || d.includes('subz') || d.includes('paneer') || d.includes('soya'))) return 'veg_seekh_kebab';
  if (d.includes('paneer tikka') || d.includes('tandoori paneer')) return 'paneer_tikka';
  if (d.includes('chicken seekh') || (d.includes('seekh') && d.includes('chicken'))) return 'chicken_seekh_kebab';
  if (d.includes('mutton seekh') || (d.includes('seekh') && (d.includes('mutton') || d.includes('gosht') || d.includes('lamb')))) return 'mutton_seekh_kebab';
  if ((d.includes('fish') || d.includes('surmai')) && (d.includes('tikka') || d.includes('tandoori'))) return 'fish_tikka';
  if (d.includes('chicken lollipop') || d.includes('lollipop')) return 'chicken_lollipop';
  if (d.includes('tandoori chicken') || d.includes('chicken tandoori')) return 'tandoori_chicken';
  if (d.includes('chicken tikka') || d.includes('tikka chicken')) return 'chicken_tikka';
  if (d.includes('grilled chicken') || d.includes('chicken steak')) return 'grilled_chicken';
  if (d.includes('bbq chicken') || (d.includes('wings') && d.includes('bbq'))) return 'bbq_chicken_wings';
  if (d.includes('chicken') || d.includes('murgh') || d.includes('kukkad')) return 'chicken_curry';

  // === 11. BREAKFAST & EGGS ===
  if (d.includes('tomato omelette') || d.includes('tomato omelet') || d.includes('tomato omlet') || d.includes('veg omelette') || d.includes('veg omelet') || d.includes('cheese tomato omelette')) return 'tomato_omelette';
  if (d.includes('pancake') || d.includes('pancakes')) return 'pancakes';
  if (d.includes('waffle') || d.includes('waffles')) return 'waffles';
  if (d.includes('french toast')) return 'french_toast';
  if (d.includes('bread omelette') || d.includes('bread omelet')) return 'bread_omelette';
  if (d.includes('cheese omelette') || d.includes('cheese omelet')) return 'cheese_omelette';
  if (d.includes('boiled egg') || d.includes('boiled eggs')) return 'boiled_eggs';
  if (d.includes('scrambled egg') || d.includes('scrambled eggs')) return 'scrambled_eggs';
  if (d.includes('omelette') || d.includes('omelet') || d.includes('egg bhurji') || d.includes('anda bhurji')) return 'egg_dish';
  if (d.includes('cornflakes') || d.includes('corn flakes')) return 'cornflakes';
  if (d.includes('oats') || d.includes('oatmeal')) return 'oats';
  if (d.includes('granola')) return 'granola_bowl';

  // === 12. HEALTHY FOOD & SALADS ===
  if (d.includes('caesar')) return 'caesar_salad';
  if (d.includes('greek')) return 'greek_salad';
  if (d.includes('sprouts')) return 'sprouts_salad';
  if (d.includes('fruit bowl') || d.includes('fresh fruit')) return 'fruit_bowl';
  if (d.includes('protein bowl')) return 'protein_bowl';
  if (d.includes('buddha bowl')) return 'buddha_bowl';
  if (d.includes('salad') && d.includes('chicken')) return 'grilled_chicken_salad';
  if (d.includes('salad') && d.includes('paneer')) return 'paneer_salad';
  if (d.includes('quinoa')) return 'quinoa_bowl';
  if (d.includes('smoothie bowl') || d.includes('acai')) return 'smoothie_bowl';
  if (d.includes('grilled veg') || d.includes('grilled vegetable')) return 'grilled_vegetables';
  if (d.includes('salad')) return 'garden_salad';
  if (d.includes('soup') || d.includes('shorba')) return 'soup';

  // === 13. DESSERTS, SWEETS & BAKERY ===
  if (d.includes('mango barfi') || d.includes('amba barfi') || d.includes('aamba barfi')) return 'mango_barfi';
  if (d.includes('kaju katli') || d.includes('kaju barfi') || d.includes('katli')) return 'kaju_katli';
  if (d.includes('barfi') || d.includes('burfi') || d.includes('milk cake') || d.includes('peda') || d.includes('pedhe') || d.includes('sandesh') || d.includes('kalakand')) return 'barfi';
  if (d.includes('bhakarwadi') || d.includes('bhakrwadi') || d.includes('bakarwadi') || d.includes('bakrwadi')) return 'bhakarwadi';
  if (d.includes('ladoo') || d.includes('laddoo') || d.includes('laddu') || d.includes('motichoor') || d.includes('besan laddu') || d.includes('boondi lad')) return 'ladoo';
  if (d.includes('rasmalai') || d.includes('ras malai') || d.includes('rasgulla') || d.includes('rossogolla') || d.includes('cham cham')) return 'rasmalai';
  if (d.includes('gulab jamun') || d.includes('gulabjamun') || d.includes('kala jamun')) return 'gulab_jamun';
  if (d.includes('jalebi') || d.includes('jilbi') || d.includes('imarti')) return 'jalebi';
  if (d.includes('shrikhand') || d.includes('amrakhand')) return 'shrikhand';
  if (d.includes('basundi')) return 'basundi';
  if (d.includes('gajar halwa') || d.includes('gajar ka halwa') || d.includes('halwa') || d.includes('sheera')) return 'gajar_halwa';

  // Falooda & Kulfi
  if (d.includes('falooda') || d.includes('faluda')) return 'falooda';
  if (d.includes('kulfi') || d.includes('matka kulfi') || d.includes('malai kulfi')) return 'kulfi';

  // Sundaes & Signature Ice Cream Desserts
  if (
    d.includes('death by chocolate') || d.includes('dbc') ||
    d.includes('brownie bomb') ||
    ((d.includes('brownie') || d.includes('sizzling')) && (d.includes('ice cream') || d.includes('icecream') || d.includes('vanilla') || d.includes('sundae')))
  ) {
    return 'death_by_chocolate';
  }
  if (
    d.includes('hot fudge') ||
    (d.includes('fudge') && (d.includes('sundae') || d.includes('ice cream'))) ||
    (d.includes('chocolate') && d.includes('sundae'))
  ) {
    return 'hot_fudge_sundae';
  }
  if (
    d.includes('melba') || d.includes('banana split') ||
    (d.includes('fruit') && (d.includes('sundae') || d.includes('salad')))
  ) {
    return 'fruit_sundae';
  }

  // Ice Cream Flavours & Parlor Context
  const isIceCreamContext = Boolean(
    d.includes('ice cream') || d.includes('icecream') || d.includes('gelato') ||
    d.includes('sundae') || d.includes('scoop') || d.includes('tub') || d.includes('cone') ||
    r.includes('ice cream') || r.includes('naturals') || r.includes('corner house') ||
    r.includes('havmor') || r.includes('baskin') || r.includes('kawre') ||
    r.includes('cream stone') || r.includes('apsara')
  );

  if (isIceCreamContext) {
    if (d.includes('tender coconut') || (d.includes('coconut') && (d.includes('malai') || d.includes('fresh')))) return 'tender_coconut_ice_cream';
    if (d.includes('sitaphal') || d.includes('custard apple')) return 'sitaphal_ice_cream';
    if ((d.includes('kesar') || d.includes('saffron')) && (d.includes('pista') || d.includes('pistachio'))) return 'kesar_pista_ice_cream';
    if (d.includes('pista') || d.includes('pistachio')) return 'pista_ice_cream';
    if (d.includes('mango') || d.includes('alphonso') || d.includes('aam')) return 'mango_ice_cream';
    if (d.includes('strawberry') || d.includes('berry') || d.includes('raspberry')) return 'strawberry_ice_cream';
    if (d.includes('black currant') || d.includes('blackcurrant') || d.includes('currant')) return 'black_currant_ice_cream';
    if (d.includes('butterscotch') || d.includes('butter scotch') || d.includes('praline') || d.includes('caramel crunch')) return 'butterscotch_ice_cream';
    if (d.includes('chocolate') || d.includes('choco') || d.includes('belgian') || d.includes('dark choco') || d.includes('fudge')) return 'chocolate_ice_cream';
    if (d.includes('coffee') || d.includes('mocha') || d.includes('espresso') || d.includes('cappuccino')) return 'coffee_ice_cream';
    if (d.includes('kaju') || d.includes('almond') || d.includes('draksh') || d.includes('dry fruit') || d.includes('cashew') || d.includes('nut')) return 'kaju_draksh_ice_cream';
    if (d.includes('vanilla') || d.includes('plain')) return 'vanilla_ice_cream';
    return 'vanilla_ice_cream';
  }

  if (d.includes('rabri') || d.includes('rabdi')) return 'rabri';
  if (d.includes('malpua')) return 'malpua';
  if (d.includes('tiramisu')) return 'tiramisu';
  if (d.includes('fruit custard') || d.includes('custard')) return 'fruit_custard';
  if (d.includes('brownie')) return 'brownie';
  if (d.includes('cheesecake')) return 'cheesecake';
  if (d.includes('muffin') || d.includes('muffins')) return 'muffins';
  if (d.includes('croissant')) return 'croissant';
  if (d.includes('donut') || d.includes('doughnut')) return 'donuts';
  if (d.includes('cookie') || d.includes('cookies')) return 'cookies';
  if (d.includes('pastry') || d.includes('pastries')) return 'pastries';
  if (d.includes('cake')) return 'cake';

  // === 14. MAHARASHTRIAN SPECIALTIES ===
  if (d.includes('thalipeeth') || d.includes('thali pith')) return 'thalipeeth';
  if (d.includes('sabudana khichdi')) return 'sabudana_khichdi';
  if (d.includes('zunka') || d.includes('zhunka') || d.includes('pithla') || d.includes('pitla')) return 'zunka_bhakar';
  if (d.includes('bharli vangi') || d.includes('vangi')) return 'bharli_vangi';
  if (d.includes('modak') || d.includes('ukdiche')) return 'modak';
  if (d.includes('kothimbir') || d.includes('kothambir')) return 'kothimbir_vadi';
  if (d.includes('alu vadi') || d.includes('aloo vadi') || d.includes('patra')) return 'alu_vadi';
  if (d.includes('shev bhaji') || d.includes('sev bhaji')) return 'shev_bhaji';

  // === 15. THALIS & PLATTERS ===
  if (d.includes('thali') || d.includes('bhojan') || d.includes('platter')) {
    if (d.includes('fish') || d.includes('seafood') || d.includes('malvan')) return 'fish_thali';
    if (d.includes('mutton') || d.includes('chicken') || d.includes('non veg') || d.includes('nonveg') || d.includes('military') || d.includes('gavran')) return 'mutton_thali';
    return 'thali';
  }

  // Restaurant Context Sensitivity
  if (r.includes('biryani')) return 'biryani';
  if (r.includes('seafood') || r.includes('fish') || r.includes('malvan')) return 'fish_fry';
  if (r.includes('mutton') || r.includes('military') || r.includes('maratha')) return 'mutton_curry';
  if (r.includes('mithai') || r.includes('sweet') || r.includes('halwai') || r.includes('chitale')) return 'barfi';
  if (r.includes('mastani') || r.includes('sujata')) {
    if (d.includes('falooda') || d.includes('faluda')) return 'falooda';
    if (d.includes('kulfi')) return 'kulfi';
    if (d.includes('kesar') || d.includes('pista')) return 'kesar_pista_mastani';
    if (d.includes('chocolate') || d.includes('brownie')) return 'chocolate_mastani';
    if (d.includes('strawberry')) return 'strawberry_mastani';
    if (d.includes('sitaphal')) return 'sitaphal_mastani';
    if (d.includes('anjir') || d.includes('badam') || d.includes('dryfruit')) return 'dryfruit_mastani';
    if (d.includes('rose') || d.includes('gulkand')) return 'rose_mastani';
    if (d.includes('butterscotch')) return 'butterscotch_mastani';
    return 'mango_mastani';
  }
  if (r.includes('ice cream') || r.includes('naturals') || r.includes('corner house') || r.includes('havmor') || r.includes('baskin') || r.includes('kulfi') || r.includes('kawre') || r.includes('cream stone') || r.includes('apsara')) {
    if (d.includes('tender coconut') || d.includes('coconut')) return 'tender_coconut_ice_cream';
    if (d.includes('sitaphal')) return 'sitaphal_ice_cream';
    if (d.includes('kesar') || d.includes('pista')) return 'kesar_pista_ice_cream';
    if (d.includes('mango') || d.includes('alphonso')) return 'mango_ice_cream';
    if (d.includes('strawberry')) return 'strawberry_ice_cream';
    if (d.includes('black currant') || d.includes('currant')) return 'black_currant_ice_cream';
    if (d.includes('butterscotch')) return 'butterscotch_ice_cream';
    if (d.includes('coffee') || d.includes('mocha')) return 'coffee_ice_cream';
    if (d.includes('kaju') || d.includes('draksh')) return 'kaju_draksh_ice_cream';
    if (d.includes('chocolate') || d.includes('brownie') || d.includes('dbc')) return 'death_by_chocolate';
    if (d.includes('kulfi')) return 'kulfi';
    if (d.includes('falooda')) return 'falooda';
    return 'vanilla_ice_cream';
  }
  if (r.includes('kfc') || r.includes('kentucky')) {
    if (d.includes('burger') || d.includes('zinger')) return 'zinger_burger';
    if (d.includes('popcorn')) return 'chicken_popcorn';
    if (d.includes('strip') || d.includes('tender')) return 'chicken_strips';
    if (d.includes('wing')) return 'chicken_wings';
    if (d.includes('fries')) return 'fries';
    return 'kfc_fried_chicken';
  }
  if (r.includes('pizza') || r.includes('pizzeria') || r.includes('domino') || r.includes('la pinoz') || r.includes('ovenstory') || r.includes('fire')) {
    if (d.includes('garlic') || d.includes('bread')) return 'garlic_bread';
    if (d.includes('margherita')) return 'margherita_pizza';
    if (d.includes('paneer')) return 'paneer_pizza';
    if (d.includes('chicken')) return 'chicken_pizza';
    if (d.includes('farmhouse')) return 'farmhouse_pizza';
    return 'wood_fired_pizza';
  }

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

    const vParam = (searchParams.get('v') || '').trim();
    const cacheKey = `${CACHE_VERSION}_${dish.toLowerCase()}_${restaurant.toLowerCase()}${vParam ? '_' + vParam : ''}${explicitImgUrl ? '_' + encodeURIComponent(explicitImgUrl).slice(0, 40) : ''}`;
    const cached = imageBufferCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'Clear-Site-Data': '"cache"',
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Clear-Site-Data': '"cache"',
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
