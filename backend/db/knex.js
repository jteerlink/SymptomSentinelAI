/**
 * Knex Database Connection
 * 
 * This file sets up the Knex connection to the database based on
 * environment variables and configuration in knexfile.js
 */

const environment = process.env.NODE_ENV || 'development';
const config = require('../knexfile')[environment];
const knex = require('knex')(config);

module.exports = knex;