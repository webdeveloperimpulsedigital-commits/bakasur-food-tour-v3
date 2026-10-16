// Test calling the db.getMapData directly in Next.js environment context
const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  const sessionId = 'bkt_sess_1789123858588_mhgdge9d060';

  // Test the exact SQL and logic used in lib/db.ts
  const [restRows] = await pool.query(`
    SELECT r.id, r.name, r.address, r.area, r.city,
           CAST(r.latitude AS DECIMAL(10,6)) as latitude,
           CAST(r.longitude AS DECIMAL(10,6)) as longitude,
           COALESCE(r.rating, 4.8) as rating,
           COALESCE(r.image, '') as image,
           COALESCE(r.total_visits, 1) as total_visits,
           COALESCE(
             (SELECT d.name FROM dishes d WHERE d.restaurant_id = r.id ORDER BY d.is_recommended DESC, d.popularity DESC LIMIT 1),
             'Specialty Dish'
           ) as featured_dish
    FROM restaurants r
    WHERE r.status = 'active' AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    ORDER BY r.total_visits DESC
  `);

  const [visitRows] = await pool.query(`
    SELECT cv.id, cv.session_id, cv.restaurant_id, cv.dish_id, cv.city, cv.round_number,
           CAST(COALESCE(cv.latitude, r.latitude, 18.5204) AS DECIMAL(10,6)) as latitude, 
           CAST(COALESCE(cv.longitude, r.longitude, 73.8407) AS DECIMAL(10,6)) as longitude, 
           cv.visited_at,
           COALESCE(cv.restaurant_name, r.name) as restaurant_name,
           COALESCE(cv.dish_name, d.name, 'Specialty Dish') as dish_name,
           COALESCE(r.rating, 4.8) as rating,
           COALESCE(r.image, '') as image
    FROM campaign_visits cv
    LEFT JOIN restaurants r ON cv.restaurant_id = r.id
    LEFT JOIN dishes d ON cv.dish_id = d.id
    WHERE cv.restaurant_name IS NOT NULL AND cv.restaurant_name != ''
    ORDER BY cv.visited_at ASC, cv.id ASC
  `);

  const [[rCount]] = await pool.query(`
    SELECT COUNT(DISTINCT name) as c FROM (
      SELECT name FROM restaurants WHERE status = 'active'
      UNION
      SELECT restaurant_name as name FROM campaign_visits WHERE restaurant_name IS NOT NULL AND restaurant_name != ''
    ) as all_spots
  `);

  const [[dCount]] = await pool.query(`
    SELECT COUNT(*) as c FROM dishes WHERE status = 'active'
  `);

  const [[cCount]] = await pool.query(`
    SELECT COUNT(DISTINCT city) as c FROM (
      SELECT city FROM restaurants WHERE status = 'active' AND city IS NOT NULL AND city != ''
      UNION
      SELECT city FROM campaign_visits WHERE city IS NOT NULL AND city != ''
    ) as all_cities
  `);

  console.log('API Result Validation:');
  console.log('Total Active Restaurants from DB:', restRows.length);
  console.log('Campaign Visits from DB:', visitRows.length);
  console.log('Food Spots Count (DB):', rCount.c);
  console.log('Dishes Count (DB):', dCount.c);
  console.log('Cities Count (DB):', cCount.c);

  await pool.end();
}

test();
