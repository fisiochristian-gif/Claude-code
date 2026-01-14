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

      // Game state table - Enhanced for lobby system and bankruptcy
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
          is_bankrupt BOOLEAN DEFAULT 0,
          debt_amount INTEGER DEFAULT 0,
          bankruptcy_timer_started DATETIME,
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
        }
      });

      // Trades table for Silence-Asset trade system
      db.run(`
        CREATE TABLE IF NOT EXISTS trades (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_id INTEGER NOT NULL,
          proposer_id TEXT NOT NULL,
          receiver_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          offered_properties TEXT,
          offered_currency INTEGER DEFAULT 0,
          requested_properties TEXT,
          requested_currency INTEGER DEFAULT 0,
          is_counter_offer BOOLEAN DEFAULT 0,
          parent_trade_id INTEGER,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (proposer_id) REFERENCES users(id_univoco),
          FOREIGN KEY (receiver_id) REFERENCES users(id_univoco),
          FOREIGN KEY (parent_trade_id) REFERENCES trades(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating trades table:', err);
          reject(err);
        }
      });

      // Cards table for IMPREVISTI and PROBABILITÀ card system
      db.run(`
        CREATE TABLE IF NOT EXISTS cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          effect_type TEXT NOT NULL,
          effect_value INTEGER,
          target_position INTEGER,
          branding_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating cards table:', err);
          reject(err);
        }
      });

      // Match history table for game results
      db.run(`
        CREATE TABLE IF NOT EXISTS match_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_id INTEGER NOT NULL,
          player_id TEXT NOT NULL,
          username TEXT NOT NULL,
          is_bot BOOLEAN DEFAULT 0,
          final_rank INTEGER NOT NULL,
          total_wealth INTEGER NOT NULL,
          cash_balance INTEGER NOT NULL,
          property_value INTEGER NOT NULL,
          building_value INTEGER NOT NULL,
          match_points INTEGER NOT NULL,
          credits_won INTEGER DEFAULT 0,
          credits_burned BOOLEAN DEFAULT 0,
          game_ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating match_history table:', err);
      });

      // Monthly leaderboard for match points
      db.run(`
        CREATE TABLE IF NOT EXISTS monthly_leaderboard (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id TEXT NOT NULL,
          username TEXT NOT NULL,
          total_match_points INTEGER DEFAULT 0,
          games_played INTEGER DEFAULT 0,
          first_place INTEGER DEFAULT 0,
          second_place INTEGER DEFAULT 0,
          third_place INTEGER DEFAULT 0,
          month_year TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(player_id, month_year),
          FOREIGN KEY (player_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating monthly_leaderboard table:', err);
          reject(err);
        }
      });

      // Minting settings table for APR configuration
      db.run(`
        CREATE TABLE IF NOT EXISTS minting_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          apr_multiplier REAL DEFAULT 0.8,
          sustainability_vault_allocation REAL DEFAULT 0.2,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          notes TEXT
        )
      `, (err) => {
        if (err) console.error('Error creating minting_settings table:', err);
      });

      // Initialize minting settings
      db.run(`
        INSERT OR IGNORE INTO minting_settings (id, apr_multiplier, sustainability_vault_allocation, notes)
        VALUES (1, 0.8, 0.2, '80% APR for minting, 20% to sustainability vault')
      `, (err) => {
        if (err) console.error('Error initializing minting_settings:', err);
      });

      // Social follow tracking for persistence logic
      db.run(`
        CREATE TABLE IF NOT EXISTS social_follow_tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          follow_type TEXT NOT NULL,
          first_follow_date DATETIME NOT NULL,
          first_follow_month TEXT NOT NULL,
          current_month TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          reward_tier TEXT DEFAULT 'initial',
          last_claimed_month TEXT,
          last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, platform, follow_type),
          FOREIGN KEY (user_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) console.error('Error creating social_follow_tracking table:', err);
      });

      // Upvote tracking for dynamic retraction
      db.run(`
        CREATE TABLE IF NOT EXISTS upvote_tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          content_id TEXT NOT NULL,
          content_type TEXT NOT NULL,
          vote_type TEXT NOT NULL,
          points_granted INTEGER DEFAULT 0,
          credits_granted INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, content_id, content_type),
          FOREIGN KEY (user_id) REFERENCES users(id_univoco)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating upvote_tracking table:', err);
          reject(err);
        } else {
          // Initialize 2 game tables
          db.run(`INSERT OR IGNORE INTO game_tables (table_id, status) VALUES (1, 'waiting')`, (err) => {
            if (err) console.error('Error initializing table 1:', err);
          });
          db.run(`INSERT OR IGNORE INTO game_tables (table_id, status) VALUES (2, 'waiting')`, (err) => {
            if (err) console.error('Error initializing table 2:', err);
            console.log('Database initialized successfully with Minting & Social Persistence System');
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
  return new Promise(async (resolve, reject) => {
    try {
      // Get minting settings (80% multiplier)
      const settings = await new Promise((res, rej) => {
        db.get('SELECT * FROM minting_settings WHERE id = 1', (err, row) => {
          if (err) rej(err);
          else res(row || { apr_multiplier: 0.8, sustainability_vault_allocation: 0.2 });
        });
      });

      const aprMultiplier = settings.apr_multiplier; // 0.8 (80%)
      const sustainabilityAllocation = settings.sustainability_vault_allocation; // 0.2 (20%)

      // Apply 80% multiplier to total APR for minting
      const mintableAPR = totalAPR * aprMultiplier;
      const sustainabilityVault = totalAPR * sustainabilityAllocation;

      // Distribution percentages (on mintable APR only)
      const fondoPremi = mintableAPR * 0.50;  // 50% to Prize Fund
      const burnAmount = mintableAPR * 0.20;  // 20% to Strategic Burn
      const sviluppo = mintableAPR * 0.15;    // 15% to Development
      const creator = mintableAPR * 0.15;     // 15% to Creator

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
          [mintableAPR, fondoPremi, burnAmount, sviluppo, creator, `${notes} | Sustainability Vault: ${sustainabilityVault.toFixed(2)} (${(sustainabilityAllocation * 100).toFixed(0)}%)`],
          function(err) {
            if (err) reject(err);
            else resolve({
              distributionId: this.lastID,
              totalAPR,
              mintableAPR,
              sustainabilityVault,
              aprMultiplier: `${(aprMultiplier * 100).toFixed(0)}%`,
              fondoPremi,
              burnAmount,
              sviluppo,
              creator
            });
          }
        );
      });
    } catch (error) {
      reject(error);
    }
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

      // Define follow-type actions for persistence tracking
      const followActions = ['follow_blog', 'x_follow', 'reddit_join', 'telegram_follow'];
      const isFollowAction = followActions.includes(actionType);

      let finalPoints = reward.points;
      let finalCredits = reward.credits;
      let rewardTier = 'standard';

      // Handle follow persistence logic
      if (isFollowAction) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

        // Check existing follow tracking
        const followRecord = await new Promise((res, rej) => {
          db.get(
            'SELECT * FROM social_follow_tracking WHERE user_id = ? AND follow_type = ?',
            [userId, actionType],
            (err, row) => {
              if (err) rej(err);
              else res(row);
            }
          );
        });

        if (followRecord) {
          // Existing follower - check if already claimed this month
          if (followRecord.last_claimed_month === currentMonth) {
            return reject(new Error('Follow ricompensa già richiesta questo mese'));
          }

          // Loyalty tier - 50% reward
          finalPoints = Math.floor(reward.points * 0.5);
          finalCredits = Math.floor(reward.credits * 0.5);
          rewardTier = 'loyalty';

          // Update follow tracking
          await new Promise((res, rej) => {
            db.run(
              'UPDATE social_follow_tracking SET current_month = ?, last_claimed_month = ?, reward_tier = ?, last_checked = CURRENT_TIMESTAMP WHERE id = ?',
              [currentMonth, currentMonth, 'loyalty', followRecord.id],
              (err) => {
                if (err) rej(err);
                else res();
              }
            );
          });

        } else {
          // First-time follower - 100% reward
          finalPoints = reward.points;
          finalCredits = reward.credits;
          rewardTier = 'initial';

          // Extract platform from action type
          const platformMap = {
            'follow_blog': 'blog',
            'x_follow': 'twitter',
            'reddit_join': 'reddit',
            'telegram_follow': 'telegram'
          };
          const platform = platformMap[actionType] || 'unknown';

          // Insert new follow tracking record
          await new Promise((res, rej) => {
            db.run(
              'INSERT INTO social_follow_tracking (user_id, platform, follow_type, first_follow_date, first_follow_month, current_month, is_active, reward_tier, last_claimed_month) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 1, ?, ?)',
              [userId, platform, actionType, currentMonth, currentMonth, 'initial', currentMonth],
              (err) => {
                if (err) rej(err);
                else res();
              }
            );
          });
        }
      } else {
        // Non-follow actions - check "once" restriction as before
        if (reward.once) {
          const alreadyPerformed = await hasPerformedAction(userId, actionType);
          if (alreadyPerformed) {
            return reject(new Error('Azione già completata (disponibile una sola volta)'));
          }
        }
      }

      // Check credits
      const user = await getUser(userId);
      if (user.crediti < finalCredits) {
        return reject(new Error(`Crediti insufficienti (richiesti: ${finalCredits})`));
      }

      db.serialize(() => {
        // Deduct credits if required
        if (finalCredits > 0) {
          db.run(
            'UPDATE users SET crediti = crediti - ? WHERE id_univoco = ?',
            [finalCredits, userId],
            (err) => {
              if (err) return reject(err);
            }
          );
        }

        // Award points
        db.run(
          'UPDATE users SET punti_classifica = punti_classifica + ? WHERE id_univoco = ?',
          [finalPoints, userId],
          (err) => {
            if (err) return reject(err);
          }
        );

        // Record action
        db.run(
          'INSERT INTO social_actions (user_id, action_type, link_verified, points_earned, credits_cost) VALUES (?, ?, ?, ?, ?)',
          [userId, actionType, linkVerified, finalPoints, finalCredits],
          function(err) {
            if (err) reject(err);
            else resolve({
              actionId: this.lastID,
              pointsEarned: finalPoints,
              creditsSpent: finalCredits,
              newCredits: user.crediti - finalCredits,
              newPoints: user.punti_classifica + finalPoints,
              rewardTier: rewardTier,
              tierMessage: rewardTier === 'loyalty' ? 'Ricompensa fedeltà (50%)' : rewardTier === 'initial' ? 'Prima volta (100%)' : 'Standard'
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

// ================================
// UPVOTE TRACKING SYSTEM
// ================================

// Record upvote and grant points/credits
const recordUpvote = (userId, contentId, contentType, pointsToGrant, creditsToGrant = 0) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if user already upvoted this content
      const existingVote = await new Promise((res, rej) => {
        db.get(
          'SELECT * FROM upvote_tracking WHERE user_id = ? AND content_id = ? AND content_type = ?',
          [userId, contentId, contentType],
          (err, row) => {
            if (err) rej(err);
            else res(row);
          }
        );
      });

      if (existingVote && existingVote.is_active) {
        return reject(new Error('Hai già votato questo contenuto'));
      }

      // Get user for balance check
      const user = await getUser(userId);

      db.serialize(() => {
        // Grant points
        db.run(
          'UPDATE users SET punti_classifica = punti_classifica + ? WHERE id_univoco = ?',
          [pointsToGrant, userId],
          (err) => {
            if (err) return reject(err);
          }
        );

        // Grant credits if applicable
        if (creditsToGrant > 0) {
          db.run(
            'UPDATE users SET crediti = crediti + ? WHERE id_univoco = ?',
            [creditsToGrant, userId],
            (err) => {
              if (err) return reject(err);
            }
          );
        }

        // Insert or reactivate upvote tracking record
        if (existingVote) {
          // Reactivate previous upvote
          db.run(
            'UPDATE upvote_tracking SET vote_type = ?, points_granted = ?, credits_granted = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['upvote', pointsToGrant, creditsToGrant, existingVote.id],
            function(err) {
              if (err) reject(err);
              else resolve({
                upvoteId: existingVote.id,
                pointsGranted: pointsToGrant,
                creditsGranted: creditsToGrant,
                newPoints: user.punti_classifica + pointsToGrant,
                newCredits: user.crediti + creditsToGrant
              });
            }
          );
        } else {
          // Insert new upvote record
          db.run(
            'INSERT INTO upvote_tracking (user_id, content_id, content_type, vote_type, points_granted, credits_granted, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [userId, contentId, contentType, 'upvote', pointsToGrant, creditsToGrant],
            function(err) {
              if (err) reject(err);
              else resolve({
                upvoteId: this.lastID,
                pointsGranted: pointsToGrant,
                creditsGranted: creditsToGrant,
                newPoints: user.punti_classifica + pointsToGrant,
                newCredits: user.crediti + creditsToGrant
              });
            }
          );
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Retract upvote and deduct previously granted points/credits
const retractUpvote = (userId, contentId, contentType) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Find active upvote record
      const upvoteRecord = await new Promise((res, rej) => {
        db.get(
          'SELECT * FROM upvote_tracking WHERE user_id = ? AND content_id = ? AND content_type = ? AND is_active = 1',
          [userId, contentId, contentType],
          (err, row) => {
            if (err) rej(err);
            else res(row);
          }
        );
      });

      if (!upvoteRecord) {
        return reject(new Error('Nessun upvote attivo trovato per questo contenuto'));
      }

      const pointsToDeduct = upvoteRecord.points_granted;
      const creditsToDeduct = upvoteRecord.credits_granted;

      // Get user for balance check
      const user = await getUser(userId);

      db.serialize(() => {
        // Deduct points (allow negative if necessary)
        db.run(
          'UPDATE users SET punti_classifica = punti_classifica - ? WHERE id_univoco = ?',
          [pointsToDeduct, userId],
          (err) => {
            if (err) return reject(err);
          }
        );

        // Deduct credits if applicable (prevent negative balance)
        if (creditsToDeduct > 0) {
          const newCredits = Math.max(0, user.crediti - creditsToDeduct);
          db.run(
            'UPDATE users SET crediti = ? WHERE id_univoco = ?',
            [newCredits, userId],
            (err) => {
              if (err) return reject(err);
            }
          );
        }

        // Mark upvote as inactive
        db.run(
          'UPDATE upvote_tracking SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [upvoteRecord.id],
          function(err) {
            if (err) reject(err);
            else resolve({
              upvoteId: upvoteRecord.id,
              pointsDeducted: pointsToDeduct,
              creditsDeducted: creditsToDeduct,
              newPoints: user.punti_classifica - pointsToDeduct,
              newCredits: Math.max(0, user.crediti - creditsToDeduct)
            });
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Get user's upvote history
const getUserUpvotes = (userId, limit = 20) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM upvote_tracking WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?',
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

// ================================
// SILENCE-ASSET TRADE FUNCTIONS
// ================================

const createTrade = (tableId, proposerId, receiverId, offer, request, isCounterOffer = false, parentTradeId = null) => {
  return new Promise((resolve, reject) => {
    // Expires in 60 seconds
    const expiresAt = new Date(Date.now() + 60000);

    const offeredProperties = offer.properties ? offer.properties.join(',') : '';
    const requestedProperties = request.properties ? request.properties.join(',') : '';

    db.run(
      `INSERT INTO trades (
        table_id, proposer_id, receiver_id,
        offered_properties, offered_currency,
        requested_properties, requested_currency,
        is_counter_offer, parent_trade_id, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tableId, proposerId, receiverId,
        offeredProperties, offer.currency || 0,
        requestedProperties, request.currency || 0,
        isCounterOffer ? 1 : 0, parentTradeId, expiresAt.toISOString()
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ tradeId: this.lastID, expiresAt });
      }
    );
  });
};

const getTrade = (tradeId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM trades WHERE id = ?', [tradeId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getActiveTrade = (playerId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM trades
       WHERE (proposer_id = ? OR receiver_id = ?)
       AND status = 'pending'
       ORDER BY id DESC LIMIT 1`,
      [playerId, playerId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updateTradeStatus = (tradeId, status) => {
  return new Promise((resolve, reject) => {
    const completedAt = status === 'accepted' || status === 'declined' || status === 'expired'
      ? new Date().toISOString()
      : null;

    db.run(
      'UPDATE trades SET status = ?, completed_at = ? WHERE id = ?',
      [status, completedAt, tradeId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

const validateTrade = async (tradeId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const trade = await getTrade(tradeId);
      if (!trade) {
        reject(new Error('Trade not found'));
        return;
      }

      // Parse properties
      const offeredProps = trade.offered_properties ? trade.offered_properties.split(',').filter(p => p) : [];
      const requestedProps = trade.requested_properties ? trade.requested_properties.split(',').filter(p => p) : [];

      // Validate proposer's offered properties
      for (const propId of offeredProps) {
        const property = await getProperty(parseInt(propId));
        if (!property) {
          reject(new Error(`Property ${propId} not found`));
          return;
        }
        if (property.owner_id !== trade.proposer_id) {
          reject(new Error(`Proposer does not own property ${propId}`));
          return;
        }
        if (property.is_mortgaged) {
          reject(new Error(`Cannot trade mortgaged property ${propId}`));
          return;
        }
      }

      // Validate receiver's requested properties
      for (const propId of requestedProps) {
        const property = await getProperty(parseInt(propId));
        if (!property) {
          reject(new Error(`Property ${propId} not found`));
          return;
        }
        if (property.owner_id !== trade.receiver_id) {
          reject(new Error(`Receiver does not own property ${propId}`));
          return;
        }
        if (property.is_mortgaged) {
          reject(new Error(`Cannot trade mortgaged property ${propId}`));
          return;
        }
      }

      // Validate currency balances
      const proposerState = await getPlayerState(trade.proposer_id);
      const receiverState = await getPlayerState(trade.receiver_id);

      if (proposerState.game_balance < trade.offered_currency) {
        reject(new Error('Proposer has insufficient currency'));
        return;
      }

      if (receiverState.game_balance < trade.requested_currency) {
        reject(new Error('Receiver has insufficient currency'));
        return;
      }

      resolve({ valid: true, trade, offeredProps, requestedProps });
    } catch (error) {
      reject(error);
    }
  });
};

const executeTrade = async (tradeId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate first
      const validation = await validateTrade(tradeId);
      const { trade, offeredProps, requestedProps } = validation;

      // Transfer properties from proposer to receiver
      for (const propId of offeredProps) {
        await updatePropertyOwner(parseInt(propId), trade.receiver_id);
      }

      // Transfer properties from receiver to proposer
      for (const propId of requestedProps) {
        await updatePropertyOwner(parseInt(propId), trade.proposer_id);
      }

      // Transfer currency from proposer to receiver
      if (trade.offered_currency > 0) {
        await new Promise((res, rej) => {
          db.run(
            'UPDATE game_state SET game_balance = game_balance - ? WHERE player_id = ?',
            [trade.offered_currency, trade.proposer_id],
            (err) => err ? rej(err) : res()
          );
        });
        await new Promise((res, rej) => {
          db.run(
            'UPDATE game_state SET game_balance = game_balance + ? WHERE player_id = ?',
            [trade.offered_currency, trade.receiver_id],
            (err) => err ? rej(err) : res()
          );
        });
      }

      // Transfer currency from receiver to proposer
      if (trade.requested_currency > 0) {
        await new Promise((res, rej) => {
          db.run(
            'UPDATE game_state SET game_balance = game_balance - ? WHERE player_id = ?',
            [trade.requested_currency, trade.receiver_id],
            (err) => err ? rej(err) : res()
          );
        });
        await new Promise((res, rej) => {
          db.run(
            'UPDATE game_state SET game_balance = game_balance + ? WHERE player_id = ?',
            [trade.requested_currency, trade.proposer_id],
            (err) => err ? rej(err) : res()
          );
        });
      }

      // Update trade status
      await updateTradeStatus(tradeId, 'accepted');

      resolve({
        success: true,
        offeredProps,
        requestedProps,
        offeredCurrency: trade.offered_currency,
        requestedCurrency: trade.requested_currency
      });
    } catch (error) {
      reject(error);
    }
  });
};

// ================================
// CARD SYSTEM FUNCTIONS
// ================================

const initializeCards = async () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM cards', async (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count === 0) {
        const cardsData = [
          // IMPREVISTI (Red Cards) - 16 cards
          { type: 'IMPREVISTI', title: 'Analisi di Mercato', description: 'Hai seguito l\'analisi di Rendite Digitali sul Blog. Vai avanti fino a Medium Article!', effect_type: 'move_to', target_position: 8, branding_text: 'Rendite Digitali - Blog Analysis' },
          { type: 'IMPREVISTI', title: 'Errore di Calcolo', description: 'Hai sbagliato i calcoli nel tuo portfolio. Paga 50 L alla Banca per risistemare.', effect_type: 'pay_bank', effect_value: 50, branding_text: 'Rendite Digitali - Risk Management' },
          { type: 'IMPREVISTI', title: 'Airdrop Vincente', description: 'Hai partecipato all\'Airdrop promosso da Rendite Digitali! Ricevi 100 L dalla Banca.', effect_type: 'receive_bank', effect_value: 100, branding_text: 'Rendite Digitali - Airdrop Campaign' },
          { type: 'IMPREVISTI', title: 'Tassa Burn', description: 'Il burn tax è aumentato. Paga 30 L alla Banca per ogni transazione recente.', effect_type: 'pay_bank', effect_value: 30, branding_text: 'Rendite Digitali - LUNC Burn Tax' },
          { type: 'IMPREVISTI', title: 'Strategia Vincente', description: 'Hai applicato la strategia di Rendite Digitali! Ricevi 80 L dalla Banca.', effect_type: 'receive_bank', effect_value: 80, branding_text: 'Rendite Digitali - Trading Strategy' },
          { type: 'IMPREVISTI', title: 'Validator Ricompensa', description: 'Il tuo Validator Node genera ricompense. Ogni giocatore ti paga 25 L!', effect_type: 'collect_all', effect_value: 25, branding_text: 'Rendite Digitali - Validator Rewards' },
          { type: 'IMPREVISTI', title: 'Vai in Transazione Sospesa', description: 'La tua transazione è stata bloccata per verifica. Vai direttamente in TRANSAZIONE SOSPESA.', effect_type: 'move_to', target_position: 9, branding_text: 'Rendite Digitali - Security Check' },
          { type: 'IMPREVISTI', title: 'Proposta Approvata', description: 'La tua proposta sul forum è stata approvata! Vai a Proposal 11242.', effect_type: 'move_to', target_position: 11, branding_text: 'Rendite Digitali - Community Governance' },
          { type: 'IMPREVISTI', title: 'Audit Fallito', description: 'Il tuo smart contract ha fallito l\'audit. Paga 70 L alla Banca per correzioni.', effect_type: 'pay_bank', effect_value: 70, branding_text: 'Rendite Digitali - Smart Contract Audit' },
          { type: 'IMPREVISTI', title: 'Rendita Passiva', description: 'Hai seguito le guide di Rendite Digitali! Ricevi 120 L dalla Banca.', effect_type: 'receive_bank', effect_value: 120, branding_text: 'Rendite Digitali - Passive Income' },
          { type: 'IMPREVISTI', title: 'Partnership Bonus', description: 'Rendite Digitali annuncia una partnership! Vai a RENDITE DIGITALI VIP.', effect_type: 'move_to', target_position: 19, branding_text: 'Rendite Digitali - VIP Partnership' },
          { type: 'IMPREVISTI', title: 'Penalità di Rete', description: 'La rete Terra è congestionata. Paga 40 L alla Banca per gas fees.', effect_type: 'pay_bank', effect_value: 40, branding_text: 'Rendite Digitali - Network Fees' },
          { type: 'IMPREVISTI', title: 'Bounty Completato', description: 'Hai completato il bounty di Rendite Digitali! Ricevi 90 L dalla Banca.', effect_type: 'receive_bank', effect_value: 90, branding_text: 'Rendite Digitali - Bug Bounty' },
          { type: 'IMPREVISTI', title: 'Donazione Forzata', description: 'Evento di beneficenza promosso da Rendite Digitali! Ogni giocatore ti dona 15 L.', effect_type: 'collect_all', effect_value: 15, branding_text: 'Rendite Digitali - Charity Event' },
          { type: 'IMPREVISTI', title: 'Hack Recuperato', description: 'Rendite Digitali ti ha aiutato a recuperare fondi rubati! Ricevi 150 L dalla Banca.', effect_type: 'receive_bank', effect_value: 150, branding_text: 'Rendite Digitali - Security Team' },
          { type: 'IMPREVISTI', title: 'Vai al VIA!', description: 'Torna all\'inizio! Vai a VIA! e ritira i tuoi 200 L.', effect_type: 'move_to', target_position: 0, branding_text: 'Rendite Digitali - Fresh Start' },

          // PROBABILITÀ (Blue Cards) - 16 cards
          { type: 'PROBABILITÀ', title: 'Staking Ricompensa', description: 'Il tuo staking pool genera profitti! Ricevi 110 L dalla Banca.', effect_type: 'receive_bank', effect_value: 110, branding_text: 'Rendite Digitali - Staking Rewards' },
          { type: 'PROBABILITÀ', title: 'Commissione Exchange', description: 'Binance applica commissioni extra. Paga 35 L alla Banca.', effect_type: 'pay_bank', effect_value: 35, branding_text: 'Rendite Digitali - Exchange Fees' },
          { type: 'PROBABILITÀ', title: 'Burn Party Success', description: 'Hai partecipato al Binance Burn Party! Vai a Binance Burn Party.', effect_type: 'move_to', target_position: 14, branding_text: 'Rendite Digitali - Burn Event' },
          { type: 'PROBABILITÀ', title: 'Tutorial Premium', description: 'Hai completato il tutorial premium di Rendite Digitali! Ricevi 75 L dalla Banca.', effect_type: 'receive_bank', effect_value: 75, branding_text: 'Rendite Digitali - Premium Tutorial' },
          { type: 'PROBABILITÀ', title: 'Tassa Imprevista', description: 'Tassa governativa sulle crypto. Paga 60 L alla Banca.', effect_type: 'pay_bank', effect_value: 60, branding_text: 'Rendite Digitali - Regulatory Compliance' },
          { type: 'PROBABILITÀ', title: 'Referral Bonus', description: 'Il tuo link referral di Rendite Digitali ha funzionato! Ogni giocatore ti paga 20 L!', effect_type: 'collect_all', effect_value: 20, branding_text: 'Rendite Digitali - Referral Program' },
          { type: 'PROBABILITÀ', title: 'Mainnet Upgrade', description: 'È uscito il Mainnet Upgrade! Vai a MAINNET UPGRADE.', effect_type: 'move_to', target_position: 20, branding_text: 'Rendite Digitali - Tech Update' },
          { type: 'PROBABILITÀ', title: 'Newsletter Reward', description: 'Hai letto la newsletter di Rendite Digitali! Ricevi 65 L dalla Banca.', effect_type: 'receive_bank', effect_value: 65, branding_text: 'Rendite Digitali - Newsletter Sub' },
          { type: 'PROBABILITÀ', title: 'Slippage Elevato', description: 'Lo slippage nel tuo trade è troppo alto. Paga 45 L alla Banca.', effect_type: 'pay_bank', effect_value: 45, branding_text: 'Rendite Digitali - Trading Loss' },
          { type: 'PROBABILITÀ', title: 'Social Campaign', description: 'Hai vinto la campagna social di Rendite Digitali! Vai a Twitter Raid.', effect_type: 'move_to', target_position: 5, branding_text: 'Rendite Digitali - Social Media' },
          { type: 'PROBABILITÀ', title: 'DCA Strategy', description: 'La tua strategia DCA ha funzionato! Ricevi 95 L dalla Banca.', effect_type: 'receive_bank', effect_value: 95, branding_text: 'Rendite Digitali - DCA Method' },
          { type: 'PROBABILITÀ', title: 'Liquidazione Evitata', description: 'Rendite Digitali ti ha avvisato in tempo! Paga 25 L alla Banca per chiudere la posizione.', effect_type: 'pay_bank', effect_value: 25, branding_text: 'Rendite Digitali - Risk Alert' },
          { type: 'PROBABILITÀ', title: 'Webinar Esclusivo', description: 'Hai partecipato al webinar VIP di Rendite Digitali! Ogni giocatore ti paga 30 L!', effect_type: 'collect_all', effect_value: 30, branding_text: 'Rendite Digitali - VIP Webinar' },
          { type: 'PROBABILITÀ', title: 'Vai a Terra Station', description: 'Delegare su Terra Station! Vai a Terra Station.', effect_type: 'move_to', target_position: 16, branding_text: 'Rendite Digitali - Delegation' },
          { type: 'PROBABILITÀ', title: 'Corso Completato', description: 'Hai finito il corso crypto di Rendite Digitali! Ricevi 130 L dalla Banca.', effect_type: 'receive_bank', effect_value: 130, branding_text: 'Rendite Digitali - Education' },
          { type: 'PROBABILITÀ', title: 'LUNC TO THE MOON', description: 'LUNC raggiunge nuovi massimi! Vai a LUNC TO THE MOON!', effect_type: 'move_to', target_position: 23, branding_text: 'Rendite Digitali - Bull Run' }
        ];

        try {
          for (const card of cardsData) {
            await new Promise((res, rej) => {
              db.run(
                `INSERT INTO cards (type, title, description, effect_type, effect_value, target_position, branding_text)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [card.type, card.title, card.description, card.effect_type, card.effect_value || null, card.target_position || null, card.branding_text],
                (err) => err ? rej(err) : res()
              );
            });
          }
          console.log('32 Cards initialized (16 IMPREVISTI + 16 PROBABILITÀ)');
          resolve();
        } catch (error) {
          reject(error);
        }
      } else {
        resolve();
      }
    });
  });
};

const getCards = (type = null) => {
  return new Promise((resolve, reject) => {
    const query = type ? 'SELECT * FROM cards WHERE type = ?' : 'SELECT * FROM cards';
    const params = type ? [type] : [];

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const drawCard = (type) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM cards WHERE type = ?', [type], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      if (rows.length === 0) {
        reject(new Error(`No cards found for type ${type}`));
        return;
      }

      // Random card selection
      const randomIndex = Math.floor(Math.random() * rows.length);
      resolve(rows[randomIndex]);
    });
  });
};

const getCard = (cardId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM cards WHERE id = ?', [cardId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// ================================
// END-GAME & BANKRUPTCY FUNCTIONS
// ================================

// Calculate total wealth for a player (Cash + Property Value + Building Value)
const calculatePlayerWealth = async (playerId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get player's cash balance
      const playerState = await getPlayerState(playerId);
      if (!playerState) {
        reject(new Error('Player not found'));
        return;
      }

      const cashBalance = playerState.game_balance;

      // Get all properties owned by player
      const properties = await new Promise((res, rej) => {
        db.all(
          'SELECT * FROM properties WHERE owner_id = ?',
          [playerId],
          (err, rows) => err ? rej(err) : res(rows)
        );
      });

      // Calculate property value and building value
      let propertyValue = 0;
      let buildingValue = 0;

      for (const prop of properties) {
        // Base property value (50% if mortgaged)
        if (prop.is_mortgaged) {
          propertyValue += Math.floor(prop.price * 0.5);
        } else {
          propertyValue += prop.price;
        }

        // Building value (houses/hotel)
        if (prop.level > 0) {
          buildingValue += prop.level * prop.house_price;
        }
      }

      const totalWealth = cashBalance + propertyValue + buildingValue;

      resolve({
        playerId,
        cashBalance,
        propertyValue,
        buildingValue,
        totalWealth,
        propertyCount: properties.length
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Set player debt and start bankruptcy timer
const setPlayerDebt = (playerId, debtAmount) => {
  return new Promise((resolve, reject) => {
    const timerStarted = new Date().toISOString();

    db.run(
      'UPDATE game_state SET debt_amount = ?, bankruptcy_timer_started = ? WHERE player_id = ?',
      [debtAmount, timerStarted, playerId],
      (err) => {
        if (err) reject(err);
        else resolve({ playerId, debtAmount, timerStarted });
      }
    );
  });
};

// Clear player debt
const clearPlayerDebt = (playerId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE game_state SET debt_amount = 0, bankruptcy_timer_started = NULL WHERE player_id = ?',
      [playerId],
      (err) => {
        if (err) reject(err);
        else resolve({ playerId });
      }
    );
  });
};

// Declare bankruptcy - mark player as bankrupt and liquidate assets
const declareBankruptcy = async (playerId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Mark player as bankrupt
      await new Promise((res, rej) => {
        db.run(
          'UPDATE game_state SET is_bankrupt = 1, debt_amount = 0, bankruptcy_timer_started = NULL WHERE player_id = ?',
          [playerId],
          (err) => err ? rej(err) : res()
        );
      });

      // Release all properties (set owner to NULL, clear buildings, clear mortgage)
      await new Promise((res, rej) => {
        db.run(
          'UPDATE properties SET owner_id = NULL, level = 0, is_mortgaged = 0, mortgage_value = NULL WHERE owner_id = ?',
          [playerId],
          (err) => err ? rej(err) : res()
        );
      });

      console.log(`💥 Player ${playerId} declared BANKRUPTCY`);

      resolve({ playerId, bankrupt: true });
    } catch (error) {
      reject(error);
    }
  });
};

// Calculate final ranking for all players at a table
const calculateFinalRanking = async (tableId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get all players at the table
      const players = await new Promise((res, rej) => {
        db.all(
          `SELECT gs.*, u.username
           FROM game_state gs
           LEFT JOIN users u ON gs.player_id = u.id_univoco
           WHERE gs.table_id = ?
           ORDER BY gs.is_bankrupt ASC`,
          [tableId],
          (err, rows) => err ? rej(err) : res(rows)
        );
      });

      // Calculate wealth for each player
      const rankings = [];
      for (const player of players) {
        const wealth = await calculatePlayerWealth(player.player_id);
        rankings.push({
          playerId: player.player_id,
          username: player.username,
          isBot: player.is_bot === 1,
          isBankrupt: player.is_bankrupt === 1,
          ...wealth
        });
      }

      // Sort by total wealth (DESC) - bankrupt players go last
      rankings.sort((a, b) => {
        if (a.isBankrupt && !b.isBankrupt) return 1;
        if (!a.isBankrupt && b.isBankrupt) return -1;
        return b.totalWealth - a.totalWealth;
      });

      // Assign ranks and match points
      const matchPoints = [5, 4, 3, 2, 1]; // 1st to 5th
      rankings.forEach((player, index) => {
        player.rank = index + 1;
        player.matchPoints = matchPoints[index] || 0;
      });

      resolve(rankings);
    } catch (error) {
      reject(error);
    }
  });
};

// Distribute prize pool or burn credits
const distributePrizePool = async (rankings, tableId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const prizeDistribution = [120, 60, 40, 20, 10]; // 1st to 5th
      const results = [];
      let totalBurned = 0;

      for (let i = 0; i < rankings.length && i < 5; i++) {
        const player = rankings[i];
        const creditsWon = prizeDistribution[i];

        if (player.isBot) {
          // BOT WINNER: BURN the credits
          totalBurned += creditsWon;
          results.push({
            playerId: player.playerId,
            username: player.username,
            rank: player.rank,
            creditsWon,
            burned: true,
            isBot: true
          });
        } else {
          // HUMAN WINNER: Add to crediti balance (staking balance)
          await new Promise((res, rej) => {
            db.run(
              'UPDATE users SET crediti = crediti + ? WHERE id_univoco = ?',
              [creditsWon, player.playerId],
              (err) => err ? rej(err) : res()
            );
          });

          results.push({
            playerId: player.playerId,
            username: player.username,
            rank: player.rank,
            creditsWon,
            burned: false,
            isBot: false
          });
        }
      }

      // Permanently burn the credits from ecosystem if any
      if (totalBurned > 0) {
        await burnCredits(totalBurned, `LUNOPOLY Match ${tableId} - Bot winnings`);
      }

      resolve({ results, totalBurned });
    } catch (error) {
      reject(error);
    }
  });
};

// Permanently burn credits from the ecosystem
const burnCredits = (amount, reason) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE global_stats SET total_burned_from_yield = total_burned_from_yield + ? WHERE id = 1',
      [amount],
      (err) => {
        if (err) reject(err);
        else {
          console.log(`🔥 BURNED ${amount} Credits: ${reason}`);
          resolve({ burned: amount, reason });
        }
      }
    );
  });
};

// Record match result to history
const recordMatchResult = (rankings, tableId, creditsBurned = 0) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (const player of rankings) {
        await new Promise((res, rej) => {
          db.run(
            `INSERT INTO match_history
            (table_id, player_id, username, is_bot, final_rank, total_wealth,
             cash_balance, property_value, building_value, match_points,
             credits_won, credits_burned)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              tableId,
              player.playerId,
              player.username,
              player.isBot ? 1 : 0,
              player.rank,
              player.totalWealth,
              player.cashBalance,
              player.propertyValue,
              player.buildingValue,
              player.matchPoints,
              player.creditsWon || 0,
              player.burned ? 1 : 0
            ],
            (err) => err ? rej(err) : res()
          );
        });
      }

      console.log(`📊 Match results recorded for table ${tableId}`);
      resolve({ tableId, playersRecorded: rankings.length });
    } catch (error) {
      reject(error);
    }
  });
};

// Update monthly leaderboard (ONLY for human players)
const updateMonthlyLeaderboard = (rankings) => {
  return new Promise(async (resolve, reject) => {
    try {
      const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

      for (const player of rankings) {
        // SKIP BOTS - only record human players
        if (player.isBot) continue;

        const matchPoints = player.matchPoints;
        const rank = player.rank;

        // Check if entry exists
        const existing = await new Promise((res, rej) => {
          db.get(
            'SELECT * FROM monthly_leaderboard WHERE player_id = ? AND month_year = ?',
            [player.playerId, monthYear],
            (err, row) => err ? rej(err) : res(row)
          );
        });

        if (existing) {
          // Update existing entry
          const updates = {
            first: rank === 1 ? 1 : 0,
            second: rank === 2 ? 1 : 0,
            third: rank === 3 ? 1 : 0
          };

          await new Promise((res, rej) => {
            db.run(
              `UPDATE monthly_leaderboard
               SET total_match_points = total_match_points + ?,
                   games_played = games_played + 1,
                   first_place = first_place + ?,
                   second_place = second_place + ?,
                   third_place = third_place + ?,
                   updated_at = CURRENT_TIMESTAMP
               WHERE player_id = ? AND month_year = ?`,
              [matchPoints, updates.first, updates.second, updates.third, player.playerId, monthYear],
              (err) => err ? rej(err) : res()
            );
          });
        } else {
          // Create new entry
          await new Promise((res, rej) => {
            db.run(
              `INSERT INTO monthly_leaderboard
              (player_id, username, total_match_points, games_played,
               first_place, second_place, third_place, month_year)
              VALUES (?, ?, ?, 1, ?, ?, ?, ?)`,
              [
                player.playerId,
                player.username,
                matchPoints,
                rank === 1 ? 1 : 0,
                rank === 2 ? 1 : 0,
                rank === 3 ? 1 : 0,
                monthYear
              ],
              (err) => err ? rej(err) : res()
            );
          });
        }
      }

      console.log(`🏆 Monthly leaderboard updated for ${monthYear}`);
      resolve({ monthYear, updated: true });
    } catch (error) {
      reject(error);
    }
  });
};

// Get monthly leaderboard
const getMonthlyLeaderboard = (limit = 10, monthYear = null) => {
  return new Promise((resolve, reject) => {
    const month = monthYear || new Date().toISOString().slice(0, 7);

    db.all(
      `SELECT * FROM monthly_leaderboard
       WHERE month_year = ?
       ORDER BY total_match_points DESC, games_played ASC
       LIMIT ?`,
      [month, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Check if only bots remain in a game
const checkOnlyBotsRemaining = (tableId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT
        COUNT(*) as total_players,
        SUM(CASE WHEN is_bot = 0 AND is_bankrupt = 0 THEN 1 ELSE 0 END) as active_humans
       FROM game_state
       WHERE table_id = ?`,
      [tableId],
      (err, row) => {
        if (err) reject(err);
        else resolve({
          totalPlayers: row.total_players,
          activeHumans: row.active_humans,
          onlyBotsRemaining: row.active_humans === 0 && row.total_players > 0
        });
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
  // Upvote tracking functions
  recordUpvote,
  retractUpvote,
  getUserUpvotes,
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
  finalizeAuction,
  // Trade functions (Silence-Asset system)
  createTrade,
  getTrade,
  getActiveTrade,
  updateTradeStatus,
  validateTrade,
  executeTrade,
  // Card system functions
  initializeCards,
  getCards,
  drawCard,
  getCard,
  // End-game & Bankruptcy functions
  calculatePlayerWealth,
  setPlayerDebt,
  clearPlayerDebt,
  declareBankruptcy,
  calculateFinalRanking,
  distributePrizePool,
  burnCredits,
  recordMatchResult,
  updateMonthlyLeaderboard,
  getMonthlyLeaderboard,
  checkOnlyBotsRemaining
};
