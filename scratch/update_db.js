const { pool } = require('./server/db');

async function run() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS producer_name VARCHAR;');
    console.log('Column producer_name added successfully');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    process.exit();
  }
}

run();
