const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'lunc_horizon.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table with capital tracking and social points
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id_univoco TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          crediti INTEGER DEFAULT 1500,
          total_deposited_lunc REAL DEFAULT 0,
          punti_classifica INTEGER DEFAULT 0,
          last_points_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
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
          house_price INTEGER DEFAULT 50,
          is_mortgaged BOOLEAN DEFAULT 0,
          mortgage_value INTEGER,
          FOREIGN KEY (owner_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating properties table:', err);
      });

      // Game state table - Enhanced for lobby system
      db.run(`
        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id TEXT NOT NULL,
          table_id INTEGER DEFAULT 1,
          position INTEGER DEFAULT 0,
          game_balance INTEGER DEFAULT 1500,
          in_jail BOOLEAN DEFAULT 0,
          jail_turns INTEGER DEFAULT 0,
          is_bot BOOLEAN DEFAULT 0,
          buy_in_paid BOOLEAN DEFAULT 0,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
        if (err) console.error('Error creating messages table:', err);
      });

      // Global stats table for economic tracking
      db.run(`
        CREATE TABLE IF NOT EXISTS global_stats (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          total_staking_pool REAL DEFAULT 0,
          total_burned_from_yield REAL DEFAULT 0,
          current_apr_fund REAL DEFAULT 0,
          fondo_premi REAL DEFAULT 0,
          sviluppo_fund REAL DEFAULT 0,
          creator_fund REAL DEFAULT 0,
          current_apr_rate REAL DEFAULT 5.0,
          last_apr_distribution DATETIME,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating global_stats table:', err);
      });

      // Initialize global stats if not exists
      db.run(`
        INSERT OR IGNORE INTO global_stats (id) VALUES (1)
      `, (err) => {
        if (err) console.error('Error initializing global_stats:', err);
      });

      // Deposits table to track LUNC deposits
      db.run(`
        CREATE TABLE IF NOT EXISTS deposits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          amount_lunc REAL NOT NULL,
          crediti_minted INTEGER NOT NULL,
          transaction_hash TEXT,
          status TEXT DEFAULT 'confirmed',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating deposits table:', err);
      });

      // APR distributions table
      db.run(`
        CREATE TABLE IF NOT EXISTS apr_distributions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          distribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_apr_collected REAL NOT NULL,
          fondo_premi_amount REAL NOT NULL,
          burn_amount REAL NOT NULL,
          sviluppo_amount REAL NOT NULL,
          creator_amount REAL NOT NULL,
          notes TEXT
        )
      `, (err) => {
        if (err) console.error('Error creating apr_distributions table:', err);
      });

      // Social actions table for Social-to-Earn
      db.run(`
        CREATE TABLE IF NOT EXISTS social_actions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          action_type TEXT NOT NULL,
          link_verified TEXT,
          points_earned INTEGER NOT NULL,
          credits_cost INTEGER DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating social_actions table:', err);
      });

      // Transactions table for buy-ins and prize payouts
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          transaction_type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          table_id INTEGER,
          description TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating transactions table:', err);
      });

      // Game tables for matchmaking and lobby management
      db.run(`
        CREATE TABLE IF NOT EXISTS game_tables (
          table_id INTEGER PRIMARY KEY,
          status TEXT DEFAULT 'waiting',
          player_count INTEGER DEFAULT 0,
          max_players INTEGER DEFAULT 5,
          prize_pool INTEGER DEFAULT 0,
          countdown_started_at DATETIME,
          game_started_at DATETIME,
          game_ended_at DATETIME,
          winner_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating game_tables table:', err);
          reject(err);
        }
      });

      // Auctions table for property bidding system
      db.run(`
        CREATE TABLE IF NOT EXISTS auctions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_id INTEGER NOT NULL,
          property_id INTEGER NOT NULL,
          status TEXT DEFAULT 'active',
          current_bid INTEGER DEFAULT 0,
          current_bidder_id TEXT,
          excluded_players TEXT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ends_at DATETIME,
          FOREIGN KEY (property_id) REFERENCES properties(id),
          FOREIGN KEY (current_bidder_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating auctions table:', err);
          reject(err);
        } else {
          // Initialize 2 game tables
          db.run(`INSERT OR IGNORE INTO game_tables (table_id, status) VALUES (1, 'waiting')`, (err) => {
            if (err) console.error('Error initializing table 1:', err);
          });
          db.run(`INSERT OR IGNORE INTO game_tables (table_id, status) VALUES (2, 'waiting')`, (err) => {
            if (err) console.error('Error initializing table 2:', err);
            console.log('Database initialized successfully with Blitz Turn Engine schema');
            resolve();
          });
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
        else resolve({
          id_univoco: idUnivoco,
          username,
          crediti: 1500,
          total_deposited_lunc: 0,
          punti_classifica: 0
        });
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

// Economic operations

// Deposit LUNC and mint Crediti (100,000 LUNC = 1,500 Crediti)
const depositLUNC = (userId, amountLUNC, txHash = null) => {
  return new Promise((resolve, reject) => {
    // Calculate crediti to mint: 1,500 per 100,000 LUNC
    const creditiPerUnit = 1500;
    const luncPerUnit = 100000;
    const creditiMinted = Math.floor((amountLUNC / luncPerUnit) * creditiPerUnit);

    if (creditiMinted === 0) {
      return reject(new Error('Deposito minimo: 100,000 LUNC'));
    }

    db.serialize(() => {
      // Update user credits and total deposited
      db.run(
        'UPDATE users SET crediti = crediti + ?, total_deposited_lunc = total_deposited_lunc + ? WHERE id_univoco = ?',
        [creditiMinted, amountLUNC, userId],
        (err) => {
          if (err) return reject(err);
        }
      );

      // Update global staking pool
      db.run(
        'UPDATE global_stats SET total_staking_pool = total_staking_pool + ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [amountLUNC],
        (err) => {
          if (err) return reject(err);
        }
      );

      // Record deposit
      db.run(
        'INSERT INTO deposits (user_id, amount_lunc, crediti_minted, transaction_hash) VALUES (?, ?, ?, ?)',
        [userId, amountLUNC, creditiMinted, txHash],
        function(err) {
          if (err) reject(err);
          else resolve({
            depositId: this.lastID,
            amountLUNC,
            creditiMinted,
            totalStaked: amountLUNC
          });
        }
      );
    });
  });
};

// Get global statistics
const getGlobalStats = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM global_stats WHERE id = 1', (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Update APR fund from staking rewards
const updateAPRFund = (aprAmount) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE global_stats SET current_apr_fund = current_apr_fund + ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
      [aprAmount],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

// Distribute APR according to the economic model
const distributeAPR = (totalAPR, notes = '') => {
  return new Promise((resolve, reject) => {
    // Distribution percentages
    const fondoPremi = totalAPR * 0.50;  // 50% to Prize Fund
    const burnAmount = totalAPR * 0.20;  // 20% to Strategic Burn
    const sviluppo = totalAPR * 0.15;    // 15% to Development
    const creator = totalAPR * 0.15;     // 15% to Creator

    db.serialize(() => {
      // Update global stats with distribution
      db.run(
        `UPDATE global_stats SET
          fondo_premi = fondo_premi + ?,
          total_burned_from_yield = total_burned_from_yield + ?,
          sviluppo_fund = sviluppo_fund + ?,
          creator_fund = creator_fund + ?,
          current_apr_fund = current_apr_fund - ?,
          last_apr_distribution = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1`,
        [fondoPremi, burnAmount, sviluppo, creator, totalAPR],
        (err) => {
          if (err) return reject(err);
        }
      );

      // Record distribution
      db.run(
        `INSERT INTO apr_distributions
          (total_apr_collected, fondo_premi_amount, burn_amount, sviluppo_amount, creator_amount, notes)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [totalAPR, fondoPremi, burnAmount, sviluppo, creator, notes],
        function(err) {
          if (err) reject(err);
          else resolve({
            distributionId: this.lastID,
            totalAPR,
            fondoPremi,
            burnAmount,
            sviluppo,
            creator
          });
        }
      );
    });
  });
};

// Get user deposit history
const getUserDeposits = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Get recent APR distributions
const getRecentDistributions = (limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM apr_distributions ORDER BY distribution_date DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Update total deposited for migration (if needed)
const updateTotalDeposited = (userId, amount) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET total_deposited_lunc = total_deposited_lunc + ? WHERE id_univoco = ?',
      [amount, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

// ================================
// SOCIAL-TO-EARN OPERATIONS
// ================================

// Reward configuration for each action type
const SOCIAL_REWARDS = {
  'follow_blog': { points: 500, credits: 0, once: true },
  'comment_blog': { points: 50, credits: 5, once: false },
  'social_wall_message': { points: 10, credits: 1, once: false },
  'x_follow': { points: 300, credits: 0, once: true },
  'x_like': { points: 30, credits: 2, once: false },
  'x_repost': { points: 200, credits: 10, once: false },
  'reddit_join': { points: 400, credits: 0, once: true },
  'reddit_upvote': { points: 40, credits: 2, once: false },
  'referral_invite': { points: 1000, credits: 0, once: false }
};

// Check if user has already performed a "once" action
const hasPerformedAction = (userId, actionType) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM social_actions WHERE user_id = ? AND action_type = ?',
      [userId, actionType],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      }
    );
  });
};

// Record social action and award points
const recordSocialAction = (userId, actionType, linkVerified = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const reward = SOCIAL_REWARDS[actionType];

      if (!reward) {
        return reject(new Error('Azione non valida'));
      }

      // Check if action is "once" and already performed
      if (reward.once) {
        const alreadyPerformed = await hasPerformedAction(userId, actionType);
        if (alreadyPerformed) {
          return reject(new Error('Azione già completata (disponibile una sola volta)'));
        }
      }

      // Check credits
      const user = await getUser(userId);
      if (user.crediti < reward.credits) {
        return reject(new Error(`Crediti insufficienti (richiesti: ${reward.credits})`));
      }

      db.serialize(() => {
        // Deduct credits if required
        if (reward.credits > 0) {
          db.run(
            'UPDATE users SET crediti = crediti - ? WHERE id_univoco = ?',
            [reward.credits, userId],
            (err) => {
              if (err) return reject(err);
            }
          );
        }

        // Award points
        db.run(
          'UPDATE users SET punti_classifica = punti_classifica + ? WHERE id_univoco = ?',
          [reward.points, userId],
          (err) => {
            if (err) return reject(err);
          }
        );

        // Record action
        db.run(
          'INSERT INTO social_actions (user_id, action_type, link_verified, points_earned, credits_cost) VALUES (?, ?, ?, ?, ?)',
          [userId, actionType, linkVerified, reward.points, reward.credits],
          function(err) {
            if (err) reject(err);
            else resolve({
              actionId: this.lastID,
              pointsEarned: reward.points,
              creditsSpent: reward.credits,
              newCredits: user.crediti - reward.credits,
              newPoints: user.punti_classifica + reward.points
            });
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Get user's social actions history
const getUserSocialActions = (userId, limit = 20) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM social_actions WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Get leaderboard by points (for Social-to-Earn)
const getLeaderboardByPoints = (limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT username, punti_classifica, crediti FROM users ORDER BY punti_classifica DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Reset all users' points (monthly reset)
const resetAllPoints = () => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET punti_classifica = 0, last_points_reset = CURRENT_TIMESTAMP',
      function(err) {
        if (err) reject(err);
        else resolve({ usersReset: this.changes });
      }
    );
  });
};

// Check and perform monthly reset if needed
const checkMonthlyReset = () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT MIN(last_points_reset) as oldest_reset FROM users WHERE punti_classifica > 0`,
      async (err, row) => {
        if (err) return reject(err);

        if (!row.oldest_reset) {
          return resolve({ resetPerformed: false, reason: 'No active points' });
        }

        const lastReset = new Date(row.oldest_reset);
        const now = new Date();
        const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

        // Reset if more than 30 days
        if (daysSinceReset >= 30) {
          const result = await resetAllPoints();
          resolve({ resetPerformed: true, ...result });
        } else {
          resolve({ resetPerformed: false, daysRemaining: Math.ceil(30 - daysSinceReset) });
        }
      }
    );
  });
};

// Update points for specific user (admin/manual)
const updateUserPoints = (userId, points) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET punti_classifica = punti_classifica + ? WHERE id_univoco = ?',
      [points, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

// ================================
// LOBBY & MATCHMAKING FUNCTIONS
// ================================

const getGameTable = (tableId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM game_tables WHERE table_id = ?', [tableId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getAllGameTables = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM game_tables ORDER BY table_id', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const updateGameTableStatus = (tableId, status, updates = {}) => {
  return new Promise((resolve, reject) => {
    const fields = ['status = ?'];
    const values = [status];

    if (updates.playerCount !== undefined) {
      fields.push('player_count = ?');
      values.push(updates.playerCount);
    }
    if (updates.prizePool !== undefined) {
      fields.push('prize_pool = ?');
      values.push(updates.prizePool);
    }
    if (updates.countdownStartedAt !== undefined) {
      fields.push('countdown_started_at = ?');
      values.push(updates.countdownStartedAt);
    }
    if (updates.gameStartedAt !== undefined) {
      fields.push('game_started_at = ?');
      values.push(updates.gameStartedAt);
    }
    if (updates.gameEndedAt !== undefined) {
      fields.push('game_ended_at = ?');
      values.push(updates.gameEndedAt);
    }
    if (updates.winnerId !== undefined) {
      fields.push('winner_id = ?');
      values.push(updates.winnerId);
    }

    values.push(tableId);

    db.run(
      `UPDATE game_tables SET ${fields.join(', ')} WHERE table_id = ?`,
      values,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

const getTablePlayers = (tableId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT gs.*, u.username
       FROM game_state gs
       JOIN users u ON gs.player_id = u.id_univoco
       WHERE gs.table_id = ?
       ORDER BY gs.joined_at`,
      [tableId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const joinGameTable = (userId, tableId, isBot = false) => {
  return new Promise((resolve, reject) => {
    // First check if user already in a game
    db.get(
      'SELECT * FROM game_state WHERE player_id = ? AND table_id IN (SELECT table_id FROM game_tables WHERE status IN ("waiting", "starting", "active"))',
      [userId],
      (err, existing) => {
        if (err) {
          reject(err);
          return;
        }
        if (existing) {
          reject(new Error('Already in a game'));
          return;
        }

        // Add player to game_state
        db.run(
          `INSERT INTO game_state (player_id, table_id, is_bot, buy_in_paid, game_balance)
           VALUES (?, ?, ?, ?, 1500)`,
          [userId, tableId, isBot ? 1 : 0, isBot ? 1 : 0],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      }
    );
  });
};

const recordTransaction = (userId, type, amount, tableId, description) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO transactions (user_id, transaction_type, amount, table_id, description) VALUES (?, ?, ?, ?, ?)',
      [userId, type, amount, tableId, description],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const processBuyIn = (userId, tableId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check user has enough credits
      const user = await getUser(userId);
      if (!user || user.crediti < 50) {
        reject(new Error('Insufficient credits'));
        return;
      }

      // Deduct 50 credits
      await updateCredits(userId, -50);

      // Update buy_in_paid in game_state
      await new Promise((res, rej) => {
        db.run(
          'UPDATE game_state SET buy_in_paid = 1 WHERE player_id = ? AND table_id = ?',
          [userId, tableId],
          (err) => err ? rej(err) : res()
        );
      });

      // Record transaction
      await recordTransaction(userId, 'buy_in', -50, tableId, 'LUNOPOLY Buy-in');

      // Update table prize pool
      await new Promise((res, rej) => {
        db.run(
          'UPDATE game_tables SET prize_pool = prize_pool + 50 WHERE table_id = ?',
          [tableId],
          (err) => err ? rej(err) : res()
        );
      });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const leaveGameTable = (userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM game_state WHERE player_id = ? AND table_id IN (SELECT table_id FROM game_tables WHERE status = "waiting")',
      [userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

const resetGameTable = (tableId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Remove all players from this table
      await new Promise((res, rej) => {
        db.run('DELETE FROM game_state WHERE table_id = ?', [tableId], (err) => {
          if (err) rej(err);
          else res();
        });
      });

      // Reset properties ownership for this table
      await new Promise((res, rej) => {
        db.run('UPDATE properties SET owner_id = NULL, level = 0', (err) => {
          if (err) rej(err);
          else res();
        });
      });

      // Reset table status
      await updateGameTableStatus(tableId, 'waiting', {
        playerCount: 0,
        prizePool: 0,
        countdownStartedAt: null,
        gameStartedAt: null,
        gameEndedAt: null,
        winnerId: null
      });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// ================================
// CONSTRUCTION & MORTGAGE FUNCTIONS
// ================================

const mortgageProperty = (propertyId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const property = await getProperty(propertyId);
      if (!property) {
        reject(new Error('Property not found'));
        return;
      }

      if (property.is_mortgaged) {
        reject(new Error('Property already mortgaged'));
        return;
      }

      if (property.level > 0) {
        reject(new Error('Cannot mortgage property with buildings'));
        return;
      }

      const mortgageValue = Math.floor(property.price * 0.5);

      await new Promise((res, rej) => {
        db.run(
          'UPDATE properties SET is_mortgaged = 1, mortgage_value = ? WHERE id = ?',
          [mortgageValue, propertyId],
          (err) => err ? rej(err) : res()
        );
      });

      resolve({ mortgageValue, property });
    } catch (error) {
      reject(error);
    }
  });
};

const unmortgageProperty = (propertyId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const property = await getProperty(propertyId);
      if (!property) {
        reject(new Error('Property not found'));
        return;
      }

      if (!property.is_mortgaged) {
        reject(new Error('Property not mortgaged'));
        return;
      }

      // Cost to unmortgage is 110% of mortgage value
      const unmortgageCost = Math.floor(property.mortgage_value * 1.1);

      await new Promise((res, rej) => {
        db.run(
          'UPDATE properties SET is_mortgaged = 0, mortgage_value = NULL WHERE id = ?',
          [propertyId],
          (err) => err ? rej(err) : res()
        );
      });

      resolve({ unmortgageCost, property });
    } catch (error) {
      reject(error);
    }
  });
};

const upgradePropertyLevel = (propertyId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const property = await getProperty(propertyId);
      if (!property) {
        reject(new Error('Property not found'));
        return;
      }

      if (property.is_mortgaged) {
        reject(new Error('Cannot build on mortgaged property'));
        return;
      }

      if (property.level >= 5) {
        reject(new Error('Property already has maximum level (Hotel)'));
        return;
      }

      const upgradeCost = property.house_price;
      const newLevel = property.level + 1;

      await new Promise((res, rej) => {
        db.run(
          'UPDATE properties SET level = ? WHERE id = ?',
          [newLevel, propertyId],
          (err) => err ? rej(err) : res()
        );
      });

      resolve({ upgradeCost, newLevel, property });
    } catch (error) {
      reject(error);
    }
  });
};

const downgradePropertyLevel = (propertyId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const property = await getProperty(propertyId);
      if (!property) {
        reject(new Error('Property not found'));
        return;
      }

      if (property.level <= 0) {
        reject(new Error('Property has no buildings to sell'));
        return;
      }

      const sellValue = Math.floor(property.house_price * 0.5);
      const newLevel = property.level - 1;

      await new Promise((res, rej) => {
        db.run(
          'UPDATE properties SET level = ? WHERE id = ?',
          [newLevel, propertyId],
          (err) => err ? rej(err) : res()
        );
      });

      resolve({ sellValue, newLevel, property });
    } catch (error) {
      reject(error);
    }
  });
};

// ================================
// AUCTION FUNCTIONS
// ================================

const createAuction = (tableId, propertyId, startingBid = 1) => {
  return new Promise((resolve, reject) => {
    const endsAt = new Date(Date.now() + 30000); // 30 seconds from now

    db.run(
      `INSERT INTO auctions (table_id, property_id, current_bid, excluded_players, ends_at)
       VALUES (?, ?, ?, ?, ?)`,
      [tableId, propertyId, startingBid, '', endsAt.toISOString()],
      function(err) {
        if (err) reject(err);
        else resolve({ auctionId: this.lastID, endsAt });
      }
    );
  });
};

const getActiveAuction = (tableId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM auctions WHERE table_id = ? AND status = "active" ORDER BY id DESC LIMIT 1',
      [tableId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const placeBid = (auctionId, bidderId, bidAmount) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auction = await new Promise((res, rej) => {
        db.get('SELECT * FROM auctions WHERE id = ?', [auctionId], (err, row) => {
          if (err) rej(err);
          else res(row);
        });
      });

      if (!auction) {
        reject(new Error('Auction not found'));
        return;
      }

      if (auction.status !== 'active') {
        reject(new Error('Auction not active'));
        return;
      }

      // Check if player is excluded
      const excludedPlayers = auction.excluded_players ? auction.excluded_players.split(',') : [];
      if (excludedPlayers.includes(bidderId)) {
        reject(new Error('Player excluded from this auction'));
        return;
      }

      if (bidAmount <= auction.current_bid) {
        reject(new Error('Bid must be higher than current bid'));
        return;
      }

      // Update auction with new bid and reset timer
      const newEndsAt = new Date(Date.now() + 30000);

      await new Promise((res, rej) => {
        db.run(
          'UPDATE auctions SET current_bid = ?, current_bidder_id = ?, ends_at = ? WHERE id = ?',
          [bidAmount, bidderId, newEndsAt.toISOString(), auctionId],
          (err) => err ? rej(err) : res()
        );
      });

      resolve({ newBid: bidAmount, newEndsAt });
    } catch (error) {
      reject(error);
    }
  });
};

const excludePlayerFromAuction = (auctionId, playerId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auction = await new Promise((res, rej) => {
        db.get('SELECT * FROM auctions WHERE id = ?', [auctionId], (err, row) => {
          if (err) rej(err);
          else res(row);
        });
      });

      if (!auction) {
        reject(new Error('Auction not found'));
        return;
      }

      const excludedPlayers = auction.excluded_players ? auction.excluded_players.split(',').filter(p => p) : [];
      if (!excludedPlayers.includes(playerId)) {
        excludedPlayers.push(playerId);
      }

      await new Promise((res, rej) => {
        db.run(
          'UPDATE auctions SET excluded_players = ? WHERE id = ?',
          [excludedPlayers.join(','), auctionId],
          (err) => err ? rej(err) : res()
        );
      });

      resolve({ excludedPlayers });
    } catch (error) {
      reject(error);
    }
  });
};

const finalizeAuction = (auctionId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auction = await new Promise((res, rej) => {
        db.get('SELECT * FROM auctions WHERE id = ?', [auctionId], (err, row) => {
          if (err) rej(err);
          else res(row);
        });
      });

      if (!auction) {
        reject(new Error('Auction not found'));
        return;
      }

      // Update auction status
      await new Promise((res, rej) => {
        db.run(
          'UPDATE auctions SET status = "completed" WHERE id = ?',
          [auctionId],
          (err) => err ? rej(err) : res()
        );
      });

      // If there was a winner, assign property
      if (auction.current_bidder_id && auction.current_bid > 0) {
        await updatePropertyOwner(auction.property_id, auction.current_bidder_id);
      }

      resolve({
        winnerId: auction.current_bidder_id,
        finalBid: auction.current_bid,
        propertyId: auction.property_id
      });
    } catch (error) {
      reject(error);
    }
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
  getRecentMessages,
  // Economic functions
  depositLUNC,
  getGlobalStats,
  updateAPRFund,
  distributeAPR,
  getUserDeposits,
  getRecentDistributions,
  updateTotalDeposited,
  // Social-to-Earn functions
  recordSocialAction,
  getUserSocialActions,
  getLeaderboardByPoints,
  resetAllPoints,
  checkMonthlyReset,
  updateUserPoints,
  SOCIAL_REWARDS,
  // Lobby & Matchmaking functions
  getGameTable,
  getAllGameTables,
  updateGameTableStatus,
  getTablePlayers,
  joinGameTable,
  recordTransaction,
  processBuyIn,
  leaveGameTable,
  resetGameTable,
  // Construction & Mortgage functions
  mortgageProperty,
  unmortgageProperty,
  upgradePropertyLevel,
  downgradePropertyLevel,
  // Auction functions
  createAuction,
  getActiveAuction,
  placeBid,
  excludePlayerFromAuction,
  finalizeAuction
};
