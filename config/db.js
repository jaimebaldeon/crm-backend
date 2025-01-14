// config/db.js
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tumi_db',
  password: 'tumi',
  port: 5432,
});

module.exports = pool;
