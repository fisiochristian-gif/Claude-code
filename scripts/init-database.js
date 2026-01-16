#!/usr/bin/env node

/**
 * DATABASE INITIALIZATION SCRIPT
 * The RD Station - Manual database setup utility
 *
 * Usage: node scripts/init-database.js
 *
 * Creates database.db and initializes all tables if not exists
 * Safe to run multiple times (won't overwrite existing data)
 */

const db = require('../database');
const path = require('path');
const fs = require('fs');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  THE RD STATION - DATABASE INITIALIZATION               ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

const DB_PATH = path.join(__dirname, '..', 'database.db');

// Check if database already exists
const dbExists = fs.existsSync(DB_PATH);

if (dbExists) {
  const stats = fs.statSync(DB_PATH);
  const sizeInKB = (stats.size / 1024).toFixed(2);
  console.log(`ℹ️  Database already exists: database.db (${sizeInKB} KB)`);
  console.log('');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Do you want to reinitialize? This will NOT delete data. (y/N): ', (answer) => {
    readline.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Initialization cancelled');
      process.exit(0);
    }

    initializeDatabase();
  });
} else {
  console.log('📦 Creating new database...');
  console.log('');
  initializeDatabase();
}

async function initializeDatabase() {
  try {
    console.log('⏳ Initializing database tables...');

    await db.initializeDatabase();

    console.log('');
    console.log('✅ DATABASE INITIALIZATION COMPLETED');
    console.log('');
    console.log('Tables created:');
    console.log('  ✓ users');
    console.log('  ✓ social_actions');
    console.log('  ✓ game_sessions');
    console.log('  ✓ game_players');
    console.log('  ✓ properties');
    console.log('  ✓ cards');
    console.log('  ✓ upvotes_tracking');
    console.log('  ✓ apr_distributions');
    console.log('');

    // Initialize cards
    console.log('⏳ Initializing game cards...');
    await db.initializeCards();
    console.log('  ✓ 32 cards loaded (16 IMPREVISTI + 16 PROBABILITÀ)');
    console.log('');

    // Show database info
    const stats = fs.statSync(DB_PATH);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    console.log('📊 Database info:');
    console.log(`  Path: ${DB_PATH}`);
    console.log(`  Size: ${sizeInKB} KB`);
    console.log('');

    console.log('🚀 Database ready for production!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start server: npm start');
    console.log('  2. Or with PM2: pm2 start ecosystem.config.js');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ ERROR during initialization:');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}
