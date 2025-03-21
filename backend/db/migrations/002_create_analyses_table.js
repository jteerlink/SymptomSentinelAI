/**
 * Migration: Create Analyses Table
 * 
 * This migration creates the 'analyses' table to store results of
 * medical image analyses, including conditions detected, confidence scores,
 * image references, and timestamps.
 */

exports.up = function(knex) {
  return knex.schema.createTable('analyses', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', ['throat', 'ear']).notNullable();
    table.string('image_url');
    table.jsonb('conditions').notNullable(); // Stores array of conditions with confidence scores
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('user_id');
    table.index('type');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('analyses');
};