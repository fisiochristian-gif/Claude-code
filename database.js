const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'lunc_horizon.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id_univoco TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          crediti INTEGER DEFAULT 100,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err);
      });

      // Properties table for LUNOPOLY game
      db.run(`
        CREATE TABLE IF NOT EXISTS properties (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          position INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          owner_id TEXT,
          price INTEGER NOT NULL,
          rent INTEGER NOT NULL,
          level INTEGER DEFAULT 0,
          color_group TEXT,
          FOREIGN KEY (owner_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating properties table:', err);
      });

      // Game state table
      db.run(`
        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id TEXT NOT NULL,
          position INTEGER DEFAULT 0,
          in_jail BOOLEAN DEFAULT 0,
          jail_turns INTEGER DEFAULT 0,
          is_bot BOOLEAN DEFAULT 0,
          FOREIGN KEY (player_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating game_state table:', err);
      });

      // Messages table for Social Wall
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          username TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating messages table:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

// User operations
const createUser = (idUnivoco, username) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (id_univoco, username) VALUES (?, ?)',
      [idUnivoco, username],
      function(err) {
        if (err) reject(err);
        else resolve({ id_univoco: idUnivoco, username, crediti: 100 });
      }
    );
  });
};

const getUser = (idUnivoco) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id_univoco = ?',
      [idUnivoco],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updateCredits = (idUnivoco, amount) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET crediti = crediti + ? WHERE id_univoco = ?',
      [amount, idUnivoco],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const getLeaderboard = (limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT username, crediti FROM users ORDER BY crediti DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Property operations
const getProperties = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM properties ORDER BY position', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getProperty = (position) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM properties WHERE position = ?',
      [position],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updatePropertyOwner = (position, ownerId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE properties SET owner_id = ? WHERE position = ?',
      [ownerId, position],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const upgradeProperty = (position) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE properties SET level = level + 1 WHERE position = ?',
      [position],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

// Game state operations
const getPlayerState = (playerId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM game_state WHERE player_id = ?',
      [playerId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updatePlayerPosition = (playerId, position) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE game_state SET position = ? WHERE player_id = ?',
      [position, playerId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const createPlayerState = (playerId, isBot = false) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO game_state (player_id, is_bot) VALUES (?, ?)',
      [playerId, isBot],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

// Message operations
const saveMessage = (userId, username, message) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO messages (user_id, username, message) VALUES (?, ?, ?)',
      [userId, username, message],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, userId, username, message, timestamp: new Date() });
      }
    );
  });
};

const getRecentMessages = (limit = 50) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.reverse());
      }
    );
  });
};

module.exports = {
  db,
  initializeDatabase,
  createUser,
  getUser,
  getUserByUsername,
  updateCredits,
  getLeaderboard,
  getProperties,
  getProperty,
  updatePropertyOwner,
  upgradeProperty,
  getPlayerState,
  updatePlayerPosition,
  createPlayerState,
  saveMessage,
  getRecentMessages
};
