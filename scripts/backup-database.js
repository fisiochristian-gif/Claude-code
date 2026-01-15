#!/usr/bin/env node

/**
 * DATABASE BACKUP SCRIPT
 * The RD Station - Automated backup utility
 *
 * Usage: node scripts/backup-database.js
 *
 * Creates timestamped backup of database.db in backups/ folder
 * Automatically cleans old backups (keeps last 7 by default)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, '..', 'database.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 7; // Keep last 7 backups

// Create backup directory if not exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('✓ Created backups directory');
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const backupFilename = `database_${timestamp}.db`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ ERROR: database.db not found');
  process.exit(1);
}

// Create backup
try {
  fs.copyFileSync(DB_PATH, backupPath);
  const stats = fs.statSync(backupPath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('✅ Backup created successfully');
  console.log(`   File: ${backupFilename}`);
  console.log(`   Size: ${sizeInMB} MB`);
  console.log(`   Path: ${backupPath}`);
} catch (error) {
  console.error('❌ ERROR creating backup:', error.message);
  process.exit(1);
}

// Clean old backups
try {
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('database_') && file.endsWith('.db'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (backupFiles.length > MAX_BACKUPS) {
    const filesToDelete = backupFiles.slice(MAX_BACKUPS);

    filesToDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    });

    console.log(`✓ Kept ${MAX_BACKUPS} most recent backups`);
  }
} catch (error) {
  console.warn('⚠️  WARNING: Could not clean old backups:', error.message);
}

console.log('✅ Backup process completed');
process.exit(0);
