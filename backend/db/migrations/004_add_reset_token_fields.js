/**
 * Migration: Add Reset Token Fields to Users Table
 * 
 * This migration adds the reset_token and reset_token_expires fields
 * to the users table to support password reset functionality.
 */

exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.string('reset_token').nullable();
    table.timestamp('reset_token_expires').nullable();
    table.integer('analysis_count').defaultTo(0).notNullable();
    table.timestamp('last_reset_date').defaultTo(knex.fn.now()).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('reset_token');
    table.dropColumn('reset_token_expires');
    table.dropColumn('analysis_count');
    table.dropColumn('last_reset_date');
  });
};