const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

async function grantAdmin(email) {
  try {
    const result = await pool.query(
      "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING *",
      [email]
    );
    
    if (result.rowCount === 0) {
      console.log(`User with email ${email} not found.`);
    } else {
      console.log(`Successfully granted admin privileges to ${email}.`);
      console.log(result.rows[0]);
    }
  } catch (error) {
    console.error('Error granting admin:', error);
  } finally {
    await pool.end();
  }
}

grantAdmin('ravehero3@gmail.com');
