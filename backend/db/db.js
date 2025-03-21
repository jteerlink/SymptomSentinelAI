/**
 * Database Connection Configuration
 * 
 * This file sets up the database connection using Knex.js ORM
 * for PostgreSQL database connectivity in our application.
 */

const knex = require('knex');
require('dotenv').config();

// Get database connection configuration from environment variables
const config = {
  client: 'pg',
  connection: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  pool: { min: 0, max: 7 },
  debug: process.env.NODE_ENV === 'development'
};

// Create and export the database connection
const db = knex(config);

// Test database connection
db.raw('SELECT 1')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

module.exports = db;