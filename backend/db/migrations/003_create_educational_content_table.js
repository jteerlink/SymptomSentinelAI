/**
 * Migration: Create Educational Content Table
 * 
 * This migration creates the 'educational_content' table to store
 * educational articles, videos, and resources related to medical conditions.
 */

exports.up = function(knex) {
  return knex.schema.createTable('educational_content', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.string('image_url');
    table.enum('category', ['throat', 'ear', 'general']).notNullable();
    table.boolean('premium_only').defaultTo(false);
    table.jsonb('tags'); // Array of related tags/keywords
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('category');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('educational_content');
};