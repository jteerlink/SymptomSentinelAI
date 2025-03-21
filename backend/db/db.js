/**
 * Database Connection Configuration
 * 
 * This file sets up the database connection using Knex.js ORM
 * for PostgreSQL database connectivity in our application.
 */

const knex = require('knex');
require('dotenv').config();

// Determine which environment to use
const environment = process.env.NODE_ENV || 'development';

// For test environment, we use mocks instead of a real database connection
let db;
if (environment === 'test') {
  // Mock database functionality for testing
  const mockKnex = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue([{ count: 0 }]),
    returning: jest.fn().mockReturnThis(),
    raw: jest.fn().mockResolvedValue([{ count: 1 }])
  };
  
  db = () => mockKnex;
  db.raw = jest.fn().mockResolvedValue([{ count: 1 }]);
  db.transaction = jest.fn(trxCallback => trxCallback(mockKnex));
  
  console.log('Using mock database for testing');
} else {
  // Get database connection configuration from environment variables
  const config = {
    client: 'pg',
    connection: {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: { rejectUnauthorized: false }
    },
    pool: { min: 0, max: 7 },
    debug: environment === 'development'
  };

  // Create and export the database connection
  db = knex(config);

  // Test database connection
  db.raw('SELECT 1')
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection error:', err));
}

module.exports = db;