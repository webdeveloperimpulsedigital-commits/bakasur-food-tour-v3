const http = require('http');

const dishesToTest = [
  'Barfi',
  'Kaju Katli',
  'Bhakarwadi',
  'Bhakrwadi',
  'Ladoo',
  'Motichoor Ladoo',
  'Chai',
  'Masala Chai',
  'Coffee',
  'Filter Coffee',
  'Cold Coffee',
  'Rasmalai',
  'Gulab Jamun',
  'Jalebi',
  'Modak',
  'Puran Poli',
  'Solkadhi',
  'Masala Taak',
  'Punjabi Sweet Lassi',
  'Sandwich',
  'Veg Pulao',
  'Tawa Pulao',
  'Chicken Pulao',
  'Paneer Butter Masala',
  'Butter Chicken'
];

async function checkDish(dish) {
  return new Promise((resolve) => {
    const url = `http://localhost:3000/api/ai/dish-image?dish=${encodeURIComponent(dish)}`;
    http.get(url, (res) => {
      let dataLen = 0;
      res.on('data', chunk => { dataLen += chunk.length; });
      res.on('end', () => {
        resolve({
          dish,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          bytes: dataLen
        });
      });
    }).on('error', (err) => {
      resolve({ dish, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing food dish images against dev server...');
  for (const dish of dishesToTest) {
    const result = await checkDish(dish);
    if (result.error) {
      console.log(`❌ ${dish}: ERROR - ${result.error}`);
    } else if (result.statusCode === 200 && result.bytes > 5000) {
      console.log(`✅ ${dish}: HTTP ${result.statusCode} (${result.contentType}, ${result.bytes} bytes)`);
    } else {
      console.log(`⚠️ ${dish}: HTTP ${result.statusCode} (${result.contentType}, ${result.bytes} bytes)`);
    }
  }
}

run();
