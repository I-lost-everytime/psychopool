require('dotenv').config();
const pool = require('./index');

async function testDB() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ DB Connected:', res.rows[0]);
    process.exit();
  } catch (err) {
    console.error('❌ DB Error:', err.message);
    process.exit(1);
  }
}

testDB();
