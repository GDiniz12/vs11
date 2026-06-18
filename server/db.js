require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

if (require.main === module) {
  pool.connect()
    .then(client => {
      console.log('Database connected successfully!');
      client.release();
      process.exit(0);
    })
    .catch(err => {
      console.error('Database connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = pool;
