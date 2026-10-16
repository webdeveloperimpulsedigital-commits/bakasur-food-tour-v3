const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  const [[activeDishes]] = await pool.query("SELECT COUNT(*) as c FROM dishes WHERE status = 'active'");
  console.log('Active dishes in table:', activeDishes.c);
  const [extraDishes] = await pool.query("SELECT DISTINCT dish_name FROM campaign_visits WHERE dish_name IS NOT NULL AND dish_name != '' AND dish_name NOT IN (SELECT name FROM dishes)");
  console.log('Extra dishes from campaign_visits not in dishes table:', extraDishes);
  await pool.end();
}

test();
