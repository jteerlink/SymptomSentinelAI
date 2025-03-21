/**
 * Migration: Create Users Table
 * 
 * This migration creates the 'users' table to store user information
 * including email, password (hashed), name, subscription type, etc.
 */

exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('name').notNullable();
    table.enum('subscription', ['free', 'premium']).defaultTo('free');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};