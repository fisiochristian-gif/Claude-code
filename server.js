const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Game state
const gameState = {
  players: new Map(),
  bots: [],
  currentTurn: 0,
  timerActive: false,
  turnTimer: null
};

// Initialize 24 properties for LUNOPOLY
const initializeProperties = async () => {
  const properties = await db.getProperties();
  if (properties.length === 0) {
    const propertyData = [
      { position: 0, name: 'VIA! (Ritira 200 L)', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 1, name: 'Newsletter Sub', price: 60, rent: 6, color_group: 'brown', house_price: 50 },
      { position: 2, name: 'IMPREVISTI', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 3, name: 'Community Forum', price: 60, rent: 6, color_group: 'brown', house_price: 50 },
      { position: 4, name: 'Tassa sul Burn', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 5, name: 'Twitter Raid', price: 100, rent: 10, color_group: 'lightblue', house_price: 50 },
      { position: 6, name: 'Reddit Upvote', price: 100, rent: 10, color_group: 'lightblue', house_price: 50 },
      { position: 7, name: 'PROBABILITÀ', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 8, name: 'Medium Article', price: 120, rent: 12, color_group: 'lightblue', house_price: 50 },
      { position: 9, name: 'TRANSAZIONE SOSPESA', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 10, name: 'LUNC Burn Tax', price: 140, rent: 14, color_group: 'orange', house_price: 100 },
      { position: 11, name: 'Proposal 11242', price: 140, rent: 14, color_group: 'orange', house_price: 100 },
      { position: 12, name: 'IMPREVISTI', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 13, name: 'Staking Pool Alpha', price: 160, rent: 16, color_group: 'orange', house_price: 100 },
      { position: 14, name: 'Binance Burn Party', price: 180, rent: 18, color_group: 'red', house_price: 100 },
      { position: 15, name: 'PROBABILITÀ', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 16, name: 'Terra Station', price: 180, rent: 18, color_group: 'red', house_price: 100 },
      { position: 17, name: 'Validator Node', price: 200, rent: 20, color_group: 'red', house_price: 100 },
      { position: 18, name: 'SOSTA GRATUITA', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 19, name: 'RENDITE DIGITALI VIP', price: 220, rent: 22, color_group: 'purple', house_price: 150 },
      { position: 20, name: 'MAINNET UPGRADE', price: 240, rent: 24, color_group: 'purple', house_price: 150 },
      { position: 21, name: 'IMPREVISTI', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 22, name: 'VAI IN TRANSAZIONE SOSPESA', price: 0, rent: 0, color_group: 'special', house_price: 0 },
      { position: 23, name: 'LUNC TO THE MOON', price: 260, rent: 26, color_group: 'gold', house_price: 150 }
    ];

    for (const prop of propertyData) {
      await db.db.run(
        'INSERT INTO properties (position, name, price, rent, color_group, house_price) VALUES (?, ?, ?, ?, ?, ?)',
        [prop.position, prop.name, prop.price, prop.rent, prop.color_group, prop.house_price]
      );
    }
    console.log('Properties initialized');
  }
};

// Initialize 4 Conservative Bots
const initializeBots = async () => {
  const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];

  for (let i = 0; i < 4; i++) {
    const botId = `bot_${crypto.randomBytes(8).toString('hex')}`;
    try {
      const existingBot = await db.getUserByUsername(botNames[i]);
      if (!existingBot) {
        await db.createUser(botId, botNames[i]);
        await db.createPlayerState(botId, true);
      }
      gameState.bots.push({ id: botId, name: botNames[i], position: 0 });
    } catch (err) {
      console.error(`Error creating bot ${botNames[i]}:`, err);
    }
  }
  console.log('Bots initialized:', gameState.bots.length);
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// User registration/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username richiesto' });
    }

    let user = await db.getUserByUsername(username);

    if (!user) {
      const idUnivoco = crypto.randomBytes(16).toString('hex');
      user = await db.createUser(idUnivoco, username);
      await db.createPlayerState(idUnivoco, false);
    }

    res.json(user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// Get user info
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero utente' });
  }
});

// Get leaderboard (points-based for Social-to-Earn)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.getLeaderboardByPoints(10);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero classifica' });
  }
});

// Get properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await db.getProperties();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero proprietà' });
  }
});

// ================================
// ECONOMIC ENDPOINTS
// ================================

// Deposit LUNC and mint Crediti
app.post('/api/deposit', async (req, res) => {
  try {
    const { userId, amountLUNC, txHash } = req.body;

    if (!userId || !amountLUNC) {
      return res.status(400).json({ error: 'userId e amountLUNC richiesti' });
    }

    if (amountLUNC < 100000) {
      return res.status(400).json({ error: 'Deposito minimo: 100,000 LUNC' });
    }

    // Check if amount is multiple of 100,000
    if (amountLUNC % 100000 !== 0) {
      return res.status(400).json({ error: 'Il deposito deve essere in multipli di 100,000 LUNC' });
    }

    const result = await db.depositLUNC(userId, amountLUNC, txHash);

    // Broadcast to all clients
    io.emit('deposit:completed', {
      userId,
      amountLUNC,
      creditiMinted: result.creditiMinted
    });

    res.json({
      success: true,
      message: `Deposito completato! ${result.creditiMinted} Crediti mintati`,
      ...result
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message || 'Errore durante il deposito' });
  }
});

// Get global statistics
app.get('/api/stats/global', async (req, res) => {
  try {
    const stats = await db.getGlobalStats();
    res.json(stats);
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({ error: 'Errore recupero statistiche globali' });
  }
});

// Get user deposits
app.get('/api/deposits/:userId', async (req, res) => {
  try {
    const deposits = await db.getUserDeposits(req.params.userId);
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero depositi' });
  }
});

// Distribute APR (Admin endpoint - should be protected in production)
app.post('/api/apr/distribute', async (req, res) => {
  try {
    const { totalAPR, notes } = req.body;

    if (!totalAPR || totalAPR <= 0) {
      return res.status(400).json({ error: 'totalAPR deve essere maggiore di 0' });
    }

    const result = await db.distributeAPR(totalAPR, notes);

    // Broadcast APR distribution to all clients
    io.emit('apr:distributed', result);

    res.json({
      success: true,
      message: 'Distribuzione APR completata',
      ...result
    });

  } catch (error) {
    console.error('APR distribution error:', error);
    res.status(500).json({ error: 'Errore distribuzione APR' });
  }
});

// Update APR fund (Simulated staking rewards)
app.post('/api/apr/update', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'amount deve essere maggiore di 0' });
    }

    await db.updateAPRFund(amount);

    res.json({
      success: true,
      message: 'APR fund aggiornato',
      amountAdded: amount
    });

  } catch (error) {
    console.error('APR update error:', error);
    res.status(500).json({ error: 'Errore aggiornamento APR' });
  }
});

// Get recent APR distributions
app.get('/api/apr/distributions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const distributions = await db.getRecentDistributions(limit);
    res.json(distributions);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero distribuzioni' });
  }
});

// ================================
// SOCIAL-TO-EARN ENDPOINTS
// ================================

// Verify and record social action
app.post('/api/social/verify-action', async (req, res) => {
  try {
    const { userId, actionType, link } = req.body;

    if (!userId || !actionType) {
      return res.status(400).json({ error: 'userId e actionType richiesti' });
    }

    // Check if action exists
    if (!db.SOCIAL_REWARDS[actionType]) {
      return res.status(400).json({ error: 'Tipo di azione non valido' });
    }

    const result = await db.recordSocialAction(userId, actionType, link);

    // Broadcast to all clients
    io.emit('social:action', {
      userId,
      actionType,
      pointsEarned: result.pointsEarned
    });

    res.json({
      success: true,
      message: `Azione completata! +${result.pointsEarned} Punti`,
      ...result
    });

  } catch (error) {
    console.error('Social action error:', error);
    res.status(400).json({ error: error.message || 'Errore durante la verifica dell\'azione' });
  }
});

// Get user's social actions history
app.get('/api/social/actions/:userId', async (req, res) => {
  try {
    const actions = await db.getUserSocialActions(req.params.userId);
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero azioni social' });
  }
});

// Get leaderboard by points (Social-to-Earn)
app.get('/api/social/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await db.getLeaderboardByPoints(limit);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero classifica punti' });
  }
});

// Get available social rewards
app.get('/api/social/rewards', (req, res) => {
  res.json(db.SOCIAL_REWARDS);
});

// Manual points reset (admin endpoint)
app.post('/api/social/reset-points', async (req, res) => {
  try {
    const result = await db.resetAllPoints();

    // Broadcast reset to all clients
    io.emit('social:points-reset', result);

    res.json({
      success: true,
      message: 'Reset punti completato',
      ...result
    });

  } catch (error) {
    console.error('Points reset error:', error);
    res.status(500).json({ error: 'Errore reset punti' });
  }
});

// Check monthly reset status
app.get('/api/social/reset-status', async (req, res) => {
  try {
    const status = await db.checkMonthlyReset();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Errore verifica reset' });
  }
});

// ================================
// UPVOTE TRACKING ENDPOINTS
// ================================

// Record upvote and grant points/credits
app.post('/api/social/upvote', async (req, res) => {
  try {
    const { userId, contentId, contentType, points, credits } = req.body;

    if (!userId || !contentId || !contentType || !points) {
      return res.status(400).json({ error: 'userId, contentId, contentType e points richiesti' });
    }

    const result = await db.recordUpvote(userId, contentId, contentType, points, credits || 0);

    // Broadcast upvote event to all clients
    io.emit('social:upvote-granted', {
      userId,
      contentId,
      contentType,
      pointsGranted: result.pointsGranted,
      creditsGranted: result.creditsGranted
    });

    res.json({
      success: true,
      message: 'Upvote registrato con successo',
      ...result
    });

  } catch (error) {
    console.error('Upvote error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Retract upvote and deduct points/credits
app.post('/api/social/retract-upvote', async (req, res) => {
  try {
    const { userId, contentId, contentType } = req.body;

    if (!userId || !contentId || !contentType) {
      return res.status(400).json({ error: 'userId, contentId e contentType richiesti' });
    }

    const result = await db.retractUpvote(userId, contentId, contentType);

    // Broadcast retraction event to all clients
    io.emit('social:upvote-retracted', {
      userId,
      contentId,
      contentType,
      pointsDeducted: result.pointsDeducted,
      creditsDeducted: result.creditsDeducted
    });

    res.json({
      success: true,
      message: 'Upvote ritratto con successo',
      ...result
    });

  } catch (error) {
    console.error('Retract upvote error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's upvote history
app.get('/api/social/upvotes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const upvotes = await db.getUserUpvotes(userId, 50);
    res.json(upvotes);
  } catch (error) {
    console.error('Get upvotes error:', error);
    res.status(500).json({ error: 'Errore recupero upvotes' });
  }
});

// Get blog feed (proxy to avoid CORS)
app.get('/api/blog/feed', async (req, res) => {
  try {
    const response = await axios.get('https://renditedigitali.blogspot.com/feeds/posts/default?alt=json');
    res.json(response.data);
  } catch (error) {
    console.error('Blog feed error:', error);
    res.status(500).json({ error: 'Errore recupero feed blog' });
  }
});

// ================================
// LOBBY & MATCHMAKING ENDPOINTS
// ================================

// Matchmaking state
const lobbyState = {
  countdownTimers: new Map(), // tableId -> timer
  botFillTimers: new Map()     // tableId -> timer
};

// Get all game tables status
app.get('/api/lobby/tables', async (req, res) => {
  try {
    const tables = await db.getAllGameTables();
    const tablesWithPlayers = await Promise.all(
      tables.map(async (table) => {
        const players = await db.getTablePlayers(table.table_id);
        return {
          ...table,
          players: players.map(p => ({
            id: p.player_id,
            username: p.username,
            isBot: p.is_bot === 1,
            buyInPaid: p.buy_in_paid === 1
          }))
        };
      })
    );
    res.json(tablesWithPlayers);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Errore recupero tavoli' });
  }
});

// Join game lobby
app.post('/api/lobby/join', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId richiesto' });
    }

    // Find available table
    const tables = await db.getAllGameTables();
    let targetTable = null;

    for (const table of tables) {
      if (table.status === 'waiting') {
        const players = await db.getTablePlayers(table.table_id);
        if (players.length < table.max_players) {
          targetTable = table;
          break;
        }
      }
    }

    if (!targetTable) {
      return res.status(400).json({ error: 'Nessun tavolo disponibile' });
    }

    // Check if user has enough credits
    const user = await db.getUser(userId);
    if (!user || user.crediti < 50) {
      return res.status(400).json({ error: 'Crediti insufficienti (richiesti: 50)' });
    }

    // Join table
    await db.joinGameTable(userId, targetTable.table_id, false);

    // Process buy-in
    await db.processBuyIn(userId, targetTable.table_id);

    // Get updated player count
    const players = await db.getTablePlayers(targetTable.table_id);
    const playerCount = players.length;

    // Update table player count
    await db.updateGameTableStatus(targetTable.table_id, 'waiting', {
      playerCount
    });

    // Start countdown if this is the first player
    if (playerCount === 1) {
      startTableCountdown(targetTable.table_id);
    }

    // If 5 human players, start game immediately
    if (playerCount === 5) {
      clearTableCountdown(targetTable.table_id);
      await startGame(targetTable.table_id);
    }

    // Broadcast lobby update
    io.emit('lobby:update', {
      tableId: targetTable.table_id,
      playerCount,
      status: playerCount === 5 ? 'starting' : 'waiting'
    });

    res.json({
      success: true,
      tableId: targetTable.table_id,
      playerCount,
      message: 'Join effettuato! 50 Crediti dedotti.'
    });

  } catch (error) {
    console.error('Join lobby error:', error);
    res.status(500).json({ error: error.message || 'Errore durante il join' });
  }
});

// Leave lobby (only works if game hasn't started)
app.post('/api/lobby/leave', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId richiesto' });
    }

    // Get user's current table
    const playerState = await db.getPlayerState(userId);
    if (!playerState) {
      return res.status(400).json({ error: 'Non sei in un tavolo' });
    }

    const table = await db.getGameTable(playerState.table_id);
    if (table.status !== 'waiting') {
      return res.status(400).json({ error: 'Il gioco è già iniziato, non puoi uscire' });
    }

    // Refund credits
    await db.updateCredits(userId, 50);
    await db.recordTransaction(userId, 'refund', 50, playerState.table_id, 'LUNOPOLY Buy-in refund');

    // Remove from table
    await db.leaveGameTable(userId);

    // Update table
    const players = await db.getTablePlayers(playerState.table_id);
    const playerCount = players.length;

    await db.updateGameTableStatus(playerState.table_id, 'waiting', {
      playerCount,
      prizePool: table.prize_pool - 50
    });

    // If no players left, clear countdown
    if (playerCount === 0) {
      clearTableCountdown(playerState.table_id);
    }

    // Broadcast lobby update
    io.emit('lobby:update', {
      tableId: playerState.table_id,
      playerCount,
      status: 'waiting'
    });

    res.json({
      success: true,
      message: 'Sei uscito dal tavolo. 50 Crediti rimborsati.'
    });

  } catch (error) {
    console.error('Leave lobby error:', error);
    res.status(500).json({ error: error.message || 'Errore durante l\'uscita' });
  }
});

// Countdown management
function startTableCountdown(tableId) {
  const COUNTDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

  // Clear existing timer if any
  clearTableCountdown(tableId);

  const countdownStartedAt = new Date().toISOString();

  // Update table
  db.updateGameTableStatus(tableId, 'waiting', {
    countdownStartedAt
  });

  // Set countdown timer
  const timer = setTimeout(async () => {
    await fillRemainingSlots(tableId);
  }, COUNTDOWN_DURATION);

  lobbyState.countdownTimers.set(tableId, timer);

  console.log(`⏱️ Countdown started for table ${tableId} - 5 minutes`);

  // Broadcast countdown start
  io.emit('lobby:countdown-started', {
    tableId,
    duration: COUNTDOWN_DURATION,
    startedAt: countdownStartedAt
  });
}

function clearTableCountdown(tableId) {
  const timer = lobbyState.countdownTimers.get(tableId);
  if (timer) {
    clearTimeout(timer);
    lobbyState.countdownTimers.delete(tableId);
    console.log(`⏱️ Countdown cleared for table ${tableId}`);
  }
}

async function fillRemainingSlots(tableId) {
  try {
    const players = await db.getTablePlayers(tableId);
    const humanPlayers = players.filter(p => !p.is_bot);
    const availableSlots = 5 - humanPlayers.length;

    console.log(`🤖 Filling ${availableSlots} slots with bots for table ${tableId}`);

    // Add bots to fill remaining slots
    const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];
    let botsAdded = 0;

    for (let i = 0; i < availableSlots && i < gameState.bots.length; i++) {
      const bot = gameState.bots[i];
      try {
        await db.joinGameTable(bot.id, tableId, true);
        botsAdded++;
        console.log(`✅ Bot ${bot.name} joined table ${tableId}`);
      } catch (error) {
        console.error(`Failed to add bot ${bot.name}:`, error);
      }
    }

    // Update table player count
    const updatedPlayers = await db.getTablePlayers(tableId);
    await db.updateGameTableStatus(tableId, 'waiting', {
      playerCount: updatedPlayers.length
    });

    // Broadcast lobby update
    io.emit('lobby:bots-added', {
      tableId,
      botsAdded,
      totalPlayers: updatedPlayers.length
    });

    // Start the game
    await startGame(tableId);

  } catch (error) {
    console.error('Fill remaining slots error:', error);
  }
}

async function startGame(tableId) {
  try {
    const gameStartedAt = new Date().toISOString();

    await db.updateGameTableStatus(tableId, 'active', {
      gameStartedAt
    });

    console.log(`🎮 Game started for table ${tableId}`);

    // Broadcast game start
    const players = await db.getTablePlayers(tableId);
    io.emit('game:started', {
      tableId,
      players: players.map(p => ({
        id: p.player_id,
        username: p.username,
        isBot: p.is_bot === 1,
        gameBalance: p.game_balance
      })),
      startedAt: gameStartedAt
    });

  } catch (error) {
    console.error('Start game error:', error);
  }
}

// ================================
// BLITZ TURN ENGINE SYSTEM
// ================================

// Turn state management per table
const turnState = new Map(); // tableId -> { currentPlayerId, phase, timer, startTime }

// Turn phases: 'decision' (10s) | 'construction' (5m) | 'auction' (30s)

// Initialize turn for a table
function initializeTurn(tableId, playerId) {
  turnState.set(tableId, {
    currentPlayerId: playerId,
    phase: 'decision',
    timer: null,
    startTime: Date.now(),
    actionTaken: false
  });

  // Start 10s decision timer
  const timer = setTimeout(() => {
    handleDecisionTimeout(tableId);
  }, 10000);

  turnState.get(tableId).timer = timer;

  // Broadcast turn start
  io.emit('turn:start', {
    tableId,
    playerId,
    phase: 'decision',
    duration: 10000
  });

  console.log(`⏱️ Turn started for player ${playerId} on table ${tableId}`);
}

// Handle decision phase timeout (auto dice roll)
async function handleDecisionTimeout(tableId) {
  const state = turnState.get(tableId);
  if (!state || state.actionTaken) return;

  console.log(`⚠️ Decision timeout for table ${tableId} - Auto rolling dice`);

  // Auto roll dice
  const diceRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;

  io.emit('turn:auto-action', {
    tableId,
    action: 'dice_roll',
    value: diceRoll,
    playerId: state.currentPlayerId
  });

  // Move to construction phase
  startConstructionPhase(tableId);
}

// Start construction phase (5 minutes)
function startConstructionPhase(tableId) {
  const state = turnState.get(tableId);
  if (!state) return;

  // Clear decision timer
  if (state.timer) {
    clearTimeout(state.timer);
  }

  state.phase = 'construction';
  state.startTime = Date.now();

  // Start 5m construction timer
  const timer = setTimeout(() => {
    handleConstructionTimeout(tableId);
  }, 300000); // 5 minutes

  state.timer = timer;

  io.emit('construction:start', {
    tableId,
    playerId: state.currentPlayerId,
    duration: 300000
  });

  console.log(`🏗️ Construction phase started for table ${tableId}`);
}

// Handle construction phase timeout
function handleConstructionTimeout(tableId) {
  console.log(`⚠️ Construction timeout for table ${tableId} - Auto ending turn`);

  io.emit('turn:auto-end', {
    tableId
  });

  endTurn(tableId);
}

// End turn and move to next player
async function endTurn(tableId) {
  const state = turnState.get(tableId);
  if (!state) return;

  // Clear any active timer
  if (state.timer) {
    clearTimeout(state.timer);
  }

  // Get next player
  const players = await db.getTablePlayers(tableId);
  const currentIndex = players.findIndex(p => p.player_id === state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];

  // Remove turn state
  turnState.delete(tableId);

  io.emit('turn:end', {
    tableId,
    nextPlayerId: nextPlayer.player_id
  });

  // Initialize next turn
  setTimeout(() => {
    initializeTurn(tableId, nextPlayer.player_id);
  }, 2000);
}

// ================================
// TURN ENGINE API ENDPOINTS
// ================================

// Player takes action (dice roll, trade, etc)
app.post('/api/turn/action', async (req, res) => {
  try {
    const { tableId, playerId, action } = req.body;

    const state = turnState.get(tableId);
    if (!state) {
      return res.status(400).json({ error: 'No active turn for this table' });
    }

    if (state.currentPlayerId !== playerId) {
      return res.status(400).json({ error: 'Not your turn' });
    }

    if (state.phase !== 'decision') {
      return res.status(400).json({ error: 'Decision phase has ended' });
    }

    state.actionTaken = true;

    // Handle action (dice roll, trade, etc)
    res.json({ success: true, message: `Action ${action} registered` });

    // Move to construction phase
    startConstructionPhase(tableId);

  } catch (error) {
    console.error('Turn action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End turn manually
app.post('/api/turn/end', async (req, res) => {
  try {
    const { tableId, playerId } = req.body;

    const state = turnState.get(tableId);
    if (!state) {
      return res.status(400).json({ error: 'No active turn' });
    }

    if (state.currentPlayerId !== playerId) {
      return res.status(400).json({ error: 'Not your turn' });
    }

    await endTurn(tableId);

    res.json({ success: true, message: 'Turn ended' });

  } catch (error) {
    console.error('End turn error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ================================
// CONSTRUCTION & MORTGAGE ENDPOINTS
// ================================

// Upgrade property (build house/hotel)
app.post('/api/property/upgrade', async (req, res) => {
  try {
    const { propertyId, playerId } = req.body;

    const property = await db.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.owner_id !== playerId) {
      return res.status(403).json({ error: 'You do not own this property' });
    }

    const result = await db.upgradePropertyLevel(propertyId);

    // Deduct cost from player balance (simplified - should use game_balance)
    // This would be properly implemented with full game state management

    io.emit('property:upgraded', {
      propertyId,
      newLevel: result.newLevel,
      cost: result.upgradeCost
    });

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mortgage property
app.post('/api/property/mortgage', async (req, res) => {
  try {
    const { propertyId, playerId } = req.body;

    const property = await db.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.owner_id !== playerId) {
      return res.status(403).json({ error: 'You do not own this property' });
    }

    const result = await db.mortgageProperty(propertyId);

    io.emit('property:mortgaged', {
      propertyId,
      mortgageValue: result.mortgageValue
    });

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Mortgage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unmortgage property
app.post('/api/property/unmortgage', async (req, res) => {
  try {
    const { propertyId, playerId } = req.body;

    const property = await db.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.owner_id !== playerId) {
      return res.status(403).json({ error: 'You do not own this property' });
    }

    const result = await db.unmortgageProperty(propertyId);

    io.emit('property:unmortgaged', {
      propertyId,
      cost: result.unmortgageCost
    });

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Unmortgage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================
// AUCTION SYSTEM ENDPOINTS
// ================================

// Start auction for unowned property
app.post('/api/auction/start', async (req, res) => {
  try {
    const { tableId, propertyId } = req.body;

    const property = await db.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.owner_id) {
      return res.status(400).json({ error: 'Property already owned' });
    }

    const result = await db.createAuction(tableId, propertyId, 1);

    // Start 30s auction timer
    setTimeout(async () => {
      await finalizeAuctionAuto(result.auctionId);
    }, 30000);

    io.emit('auction:start', {
      tableId,
      auctionId: result.auctionId,
      propertyId,
      property: property.name,
      duration: 30000
    });

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Start auction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Place bid
app.post('/api/auction/bid', async (req, res) => {
  try {
    const { auctionId, playerId, bidAmount } = req.body;

    const result = await db.placeBid(auctionId, playerId, bidAmount);

    io.emit('auction:bid', {
      auctionId,
      playerId,
      bidAmount,
      newEndsAt: result.newEndsAt
    });

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Bid error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Finalize auction automatically
async function finalizeAuctionAuto(auctionId) {
  try {
    const result = await db.finalizeAuction(auctionId);

    io.emit('auction:end', {
      auctionId,
      winnerId: result.winnerId,
      finalBid: result.finalBid,
      propertyId: result.propertyId
    });

    console.log(`🔨 Auction ${auctionId} finalized. Winner: ${result.winnerId || 'None'}`);

  } catch (error) {
    console.error('Finalize auction error:', error);
  }
}

// ================================
// SILENCE-ASSET TRADE SYSTEM
// ================================

// Trade state management per table
const tradeState = new Map(); // playerId -> { tradeAttempts, currentTrade, timer }

// Track trade attempts per player per turn
function initializeTradeTracking(playerId) {
  if (!tradeState.has(playerId)) {
    tradeState.set(playerId, {
      tradeAttempts: 0,
      currentTrade: null,
      timer: null
    });
  }
}

// Increment trade attempts for a player
function incrementTradeAttempts(playerId) {
  const state = tradeState.get(playerId);
  if (state) {
    state.tradeAttempts++;
    return state.tradeAttempts;
  }
  return 0;
}

// Reset trade attempts when turn ends
function resetTradeAttempts(playerId) {
  const state = tradeState.get(playerId);
  if (state) {
    state.tradeAttempts = 0;
  }
}

// Start 60s auto-accept timer for a trade
function startTradeTimer(tradeId, tableId) {
  const timer = setTimeout(async () => {
    await handleTradeTimeout(tradeId, tableId);
  }, 60000); // 60 seconds

  return timer;
}

// Handle trade timeout - AUTO-ACCEPT for original proposals only
async function handleTradeTimeout(tradeId, tableId) {
  try {
    const trade = await db.getTrade(tradeId);

    if (!trade || trade.status !== 'pending') {
      return; // Trade already handled
    }

    // SILENCE-ASSET RULE: Only auto-accept original proposals, not counter-offers
    if (trade.is_counter_offer) {
      // Counter-offers expire without action
      await db.updateTradeStatus(tradeId, 'expired');

      io.to(`table_${tableId}`).emit('trade:expired', {
        tradeId,
        reason: 'Counter-offer expired (no response)'
      });

      console.log(`⏱️ Counter-offer ${tradeId} expired`);
    } else {
      // Original proposals auto-accept on timeout
      console.log(`⚠️ Trade ${tradeId} timeout - AUTO-ACCEPTING`);

      try {
        const result = await db.executeTrade(tradeId);

        io.to(`table_${tableId}`).emit('trade:auto-accepted', {
          tradeId,
          result,
          proposerId: trade.proposer_id,
          receiverId: trade.receiver_id
        });

        console.log(`✅ Trade ${tradeId} AUTO-ACCEPTED due to silence`);
      } catch (error) {
        console.error('Auto-accept failed:', error);
        await db.updateTradeStatus(tradeId, 'failed');

        io.to(`table_${tableId}`).emit('trade:failed', {
          tradeId,
          error: error.message
        });
      }
    }
  } catch (error) {
    console.error('Handle trade timeout error:', error);
  }
}

// Clear trade timer
function clearTradeTimer(playerId) {
  const state = tradeState.get(playerId);
  if (state && state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

// ================================
// TRADE API ENDPOINTS
// ================================

// Propose a trade
app.post('/api/trade/propose', async (req, res) => {
  try {
    const { tableId, proposerId, receiverId, offer, request } = req.body;

    // Initialize trade tracking
    initializeTradeTracking(proposerId);

    // Check trade attempts limit (max 3 per turn)
    const attempts = tradeState.get(proposerId).tradeAttempts;
    if (attempts >= 3) {
      return res.status(400).json({
        error: 'Maximum 3 trade attempts reached. You must roll the dice.',
        forceRoll: true
      });
    }

    // Validate offer and request
    if (!offer || !request) {
      return res.status(400).json({ error: 'Invalid trade proposal' });
    }

    // Create trade in database
    const result = await db.createTrade(tableId, proposerId, receiverId, offer, request, false, null);

    // Increment trade attempts
    incrementTradeAttempts(proposerId);

    // Start 60s timer for auto-accept
    const timer = startTradeTimer(result.tradeId, tableId);
    tradeState.get(proposerId).timer = timer;
    tradeState.get(proposerId).currentTrade = result.tradeId;

    // Broadcast to table
    io.to(`table_${tableId}`).emit('trade:proposed', {
      tradeId: result.tradeId,
      proposerId,
      receiverId,
      offer,
      request,
      expiresAt: result.expiresAt,
      attemptsUsed: tradeState.get(proposerId).tradeAttempts
    });

    // Send notification to receiver
    io.emit('trade:notification', {
      receiverId,
      tradeId: result.tradeId,
      proposerId,
      message: 'You have a new trade proposal!'
    });

    res.json({
      success: true,
      tradeId: result.tradeId,
      expiresAt: result.expiresAt,
      attemptsRemaining: 3 - tradeState.get(proposerId).tradeAttempts
    });

  } catch (error) {
    console.error('Propose trade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept a trade
app.post('/api/trade/accept', async (req, res) => {
  try {
    const { tradeId, receiverId } = req.body;

    const trade = await db.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.receiver_id !== receiverId) {
      return res.status(403).json({ error: 'Not authorized to accept this trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Trade is no longer pending' });
    }

    // Clear timer
    clearTradeTimer(trade.proposer_id);

    // Execute trade
    const result = await db.executeTrade(tradeId);

    io.to(`table_${trade.table_id}`).emit('trade:accepted', {
      tradeId,
      result,
      proposerId: trade.proposer_id,
      receiverId: trade.receiver_id
    });

    res.json({ success: true, result });

  } catch (error) {
    console.error('Accept trade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Decline a trade
app.post('/api/trade/decline', async (req, res) => {
  try {
    const { tradeId, receiverId } = req.body;

    const trade = await db.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.receiver_id !== receiverId) {
      return res.status(403).json({ error: 'Not authorized to decline this trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Trade is no longer pending' });
    }

    // Clear timer
    clearTradeTimer(trade.proposer_id);

    // Update status
    await db.updateTradeStatus(tradeId, 'declined');

    io.to(`table_${trade.table_id}`).emit('trade:declined', {
      tradeId,
      proposerId: trade.proposer_id,
      receiverId: trade.receiver_id
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Decline trade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Counter-offer (ONE-SHOT only)
app.post('/api/trade/counter', async (req, res) => {
  try {
    const { tradeId, receiverId, counterOffer, counterRequest } = req.body;

    const parentTrade = await db.getTrade(tradeId);
    if (!parentTrade) {
      return res.status(404).json({ error: 'Original trade not found' });
    }

    if (parentTrade.receiver_id !== receiverId) {
      return res.status(403).json({ error: 'Not authorized to counter this trade' });
    }

    if (parentTrade.status !== 'pending') {
      return res.status(400).json({ error: 'Original trade is no longer pending' });
    }

    // Check if counter-offer already exists for this trade
    const existingCounter = await new Promise((resolve, reject) => {
      db.db.get(
        'SELECT * FROM trades WHERE parent_trade_id = ? AND is_counter_offer = 1',
        [tradeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingCounter) {
      return res.status(400).json({
        error: 'Only ONE counter-offer allowed per trade sequence'
      });
    }

    // Clear original timer
    clearTradeTimer(parentTrade.proposer_id);

    // Update original trade status
    await db.updateTradeStatus(tradeId, 'countered');

    // Create counter-offer (roles reversed)
    const result = await db.createTrade(
      parentTrade.table_id,
      receiverId, // Receiver becomes proposer
      parentTrade.proposer_id, // Original proposer becomes receiver
      counterOffer,
      counterRequest,
      true, // is_counter_offer = true
      tradeId // parent_trade_id
    );

    // Start 60s timer (but it will expire, not auto-accept)
    const timer = startTradeTimer(result.tradeId, parentTrade.table_id);

    initializeTradeTracking(receiverId);
    tradeState.get(receiverId).timer = timer;
    tradeState.get(receiverId).currentTrade = result.tradeId;

    io.to(`table_${parentTrade.table_id}`).emit('trade:counter-offered', {
      originalTradeId: tradeId,
      counterTradeId: result.tradeId,
      proposerId: receiverId,
      receiverId: parentTrade.proposer_id,
      counterOffer,
      counterRequest,
      expiresAt: result.expiresAt
    });

    res.json({
      success: true,
      counterTradeId: result.tradeId,
      expiresAt: result.expiresAt
    });

  } catch (error) {
    console.error('Counter-offer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active trade for a player
app.get('/api/trade/active/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const trade = await db.getActiveTrade(playerId);

    if (!trade) {
      return res.json({ trade: null });
    }

    res.json({ trade });

  } catch (error) {
    console.error('Get active trade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================
// CARD SYSTEM ENDPOINTS
// ================================

// Draw a card (IMPREVISTI or PROBABILITÀ)
app.post('/api/cards/draw', async (req, res) => {
  try {
    const { tableId, playerId, cardType } = req.body;

    if (!cardType || (cardType !== 'IMPREVISTI' && cardType !== 'PROBABILITÀ')) {
      return res.status(400).json({ error: 'Invalid card type' });
    }

    // Draw random card
    const card = await db.drawCard(cardType);

    // Broadcast card draw to table
    io.to(`table_${tableId}`).emit('card:drawn', {
      tableId,
      playerId,
      card
    });

    res.json({
      success: true,
      card
    });

  } catch (error) {
    console.error('Draw card error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply card effect
app.post('/api/cards/apply', async (req, res) => {
  try {
    const { tableId, playerId, cardId } = req.body;

    const card = await db.getCard(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const playerState = await db.getPlayerState(playerId);
    if (!playerState) {
      return res.status(404).json({ error: 'Player not found' });
    }

    let result = { success: true, effect: card.effect_type };

    switch (card.effect_type) {
      case 'move_to':
        // Move player to target position
        await db.updatePlayerPosition(playerId, card.target_position);
        result.newPosition = card.target_position;
        break;

      case 'pay_bank':
        // Deduct L from player
        await db.db.run(
          'UPDATE game_state SET game_balance = game_balance - ? WHERE player_id = ?',
          [card.effect_value, playerId]
        );
        result.amountPaid = card.effect_value;
        break;

      case 'receive_bank':
        // Add L to player
        await db.db.run(
          'UPDATE game_state SET game_balance = game_balance + ? WHERE player_id = ?',
          [card.effect_value, playerId]
        );
        result.amountReceived = card.effect_value;
        break;

      case 'collect_all':
        // Collect from all players (handled by client/socket for now)
        result.collectAmount = card.effect_value;
        result.requiresPlayerInteraction = true;
        break;

      default:
        return res.status(400).json({ error: 'Unknown effect type' });
    }

    // Broadcast effect application
    io.to(`table_${tableId}`).emit('card:effect-applied', {
      tableId,
      playerId,
      card,
      result
    });

    res.json(result);

  } catch (error) {
    console.error('Apply card effect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all cards (for debugging/admin)
app.get('/api/cards', async (req, res) => {
  try {
    const { type } = req.query;
    const cards = await db.getCards(type || null);
    res.json(cards);
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================
// END-GAME & BANKRUPTCY ENDPOINTS
// ================================

// Debt liquidation timers per player
const debtTimers = new Map(); // playerId -> timer

// Set player debt and start 60s liquidation timer
app.post('/api/game/debt', async (req, res) => {
  try {
    const { playerId, debtAmount, tableId } = req.body;

    // Set debt in database
    await db.setPlayerDebt(playerId, debtAmount);

    // Clear any existing timer
    if (debtTimers.has(playerId)) {
      clearTimeout(debtTimers.get(playerId));
    }

    // Start 60s liquidation timer
    const timer = setTimeout(async () => {
      await handleDebtTimeout(playerId, tableId);
    }, 60000); // 60 seconds

    debtTimers.set(playerId, timer);

    // Broadcast debt warning to table
    io.to(`table_${tableId}`).emit('debt:warning', {
      playerId,
      debtAmount,
      timeLimit: 60000
    });

    res.json({ success: true, playerId, debtAmount, timeLimit: 60000 });

  } catch (error) {
    console.error('Set debt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle debt timeout - check if bankruptcy needed
async function handleDebtTimeout(playerId, tableId) {
  try {
    console.log(`⏰ Debt timeout for player ${playerId}`);

    // Calculate total assets
    const wealth = await db.calculatePlayerWealth(playerId);
    const playerState = await db.getPlayerState(playerId);

    // Check if Total Assets < Debt
    if (wealth.totalWealth < playerState.debt_amount) {
      // AUTOMATIC BANKRUPTCY
      console.log(`💥 AUTOMATIC BANKRUPTCY triggered for ${playerId}`);
      await db.declareBankruptcy(playerId);

      io.to(`table_${tableId}`).emit('player:bankrupt', {
        playerId,
        reason: 'debt_timeout',
        automatic: true
      });

      // Check if only bots remain
      await checkGameEnd(tableId);
    } else {
      // Player has enough assets but didn't liquidate - force liquidation
      console.log(`⚠️ Player ${playerId} has assets but failed to settle debt`);

      io.to(`table_${tableId}`).emit('debt:force-liquidation', {
        playerId,
        totalAssets: wealth.totalWealth,
        debt: playerState.debt_amount
      });
    }

    debtTimers.delete(playerId);
  } catch (error) {
    console.error('Handle debt timeout error:', error);
  }
}

// Clear player debt
app.post('/api/game/clear-debt', async (req, res) => {
  try {
    const { playerId } = req.body;

    // Clear debt timer
    if (debtTimers.has(playerId)) {
      clearTimeout(debtTimers.get(playerId));
      debtTimers.delete(playerId);
    }

    // Clear debt in database
    await db.clearPlayerDebt(playerId);

    res.json({ success: true, playerId });

  } catch (error) {
    console.error('Clear debt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual bankruptcy declaration
app.post('/api/game/bankruptcy', async (req, res) => {
  try {
    const { playerId, tableId } = req.body;

    // Clear any debt timer
    if (debtTimers.has(playerId)) {
      clearTimeout(debtTimers.get(playerId));
      debtTimers.delete(playerId);
    }

    // Declare bankruptcy
    await db.declareBankruptcy(playerId);

    io.to(`table_${tableId}`).emit('player:bankrupt', {
      playerId,
      reason: 'manual',
      automatic: false
    });

    // Check if only bots remain or game should end
    await checkGameEnd(tableId);

    res.json({ success: true, playerId, bankrupt: true });

  } catch (error) {
    console.error('Bankruptcy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if game should end (only bots remaining)
async function checkGameEnd(tableId) {
  try {
    const status = await db.checkOnlyBotsRemaining(tableId);

    if (status.onlyBotsRemaining) {
      console.log(`🚨 ALL HUMANS GONE at table ${tableId} - AUTO-CLOSING GAME`);

      // End game immediately with bot-only ranking
      await endGame(tableId, true); // true = bots only (burn all credits)
    }
  } catch (error) {
    console.error('Check game end error:', error);
  }
}

// End game and finalize results
app.post('/api/game/end', async (req, res) => {
  try {
    const { tableId } = req.body;

    const result = await endGame(tableId, false);

    res.json({ success: true, ...result });

  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({ error: error.message });
  }
});

// End game logic
async function endGame(tableId, botsOnly = false) {
  try {
    console.log(`🏁 ENDING GAME for table ${tableId} (bots only: ${botsOnly})`);

    // Calculate final rankings
    const rankings = await db.calculateFinalRanking(tableId);

    console.log('Final Rankings:', rankings);

    let prizeResult;
    let totalBurned = 0;

    if (botsOnly) {
      // BURN ALL 250 CREDITS - no prize distribution
      totalBurned = 250;
      await db.burnCredits(250, `Table ${tableId} - Game closed (only bots remaining)`);

      prizeResult = {
        results: rankings.map(r => ({ ...r, creditsWon: 0, burned: true })),
        totalBurned: 250
      };
    } else {
      // Normal prize distribution (bots get burned, humans get credits)
      prizeResult = await db.distributePrizePool(rankings, tableId);
      totalBurned = prizeResult.totalBurned;

      // Add creditsWon to rankings
      rankings.forEach((player, index) => {
        const result = prizeResult.results.find(r => r.playerId === player.playerId);
        if (result) {
          player.creditsWon = result.creditsWon;
          player.burned = result.burned;
        }
      });
    }

    // Record match history
    await db.recordMatchResult(rankings, tableId, totalBurned);

    // Update monthly leaderboard (ONLY humans)
    await db.updateMonthlyLeaderboard(rankings);

    // Update table status to 'completed'
    await db.updateGameTableStatus(tableId, 'completed', {
      gameEndedAt: new Date().toISOString()
    });

    // Broadcast final results to all players
    io.to(`table_${tableId}`).emit('game:ended', {
      tableId,
      rankings,
      totalBurned,
      botsOnly,
      prizeDistribution: prizeResult.results
    });

    console.log(`✅ Game ended for table ${tableId}. ${totalBurned} credits burned.`);

    return {
      tableId,
      rankings,
      totalBurned,
      botsOnly
    };
  } catch (error) {
    console.error('End game error:', error);
    throw error;
  }
}

// Get player wealth
app.get('/api/game/wealth/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const wealth = await db.calculatePlayerWealth(playerId);

    res.json(wealth);

  } catch (error) {
    console.error('Get wealth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get monthly leaderboard
app.get('/api/leaderboard/monthly', async (req, res) => {
  try {
    const { limit, month } = req.query;

    const leaderboard = await db.getMonthlyLeaderboard(
      parseInt(limit) || 10,
      month || null
    );

    res.json(leaderboard);

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins
  socket.on('user:join', async (userData) => {
    try {
      const user = await db.getUser(userData.id_univoco);
      if (user) {
        socket.userId = user.id_univoco;
        socket.username = user.username;
        gameState.players.set(socket.id, user);

        io.emit('user:joined', {
          username: user.username,
          totalPlayers: gameState.players.size
        });
      }
    } catch (error) {
      console.error('User join error:', error);
    }
  });

  // Chat message (costs 1 credit)
  socket.on('chat:message', async (data) => {
    try {
      const user = await db.getUser(socket.userId);

      if (!user) {
        socket.emit('chat:error', { message: 'Utente non trovato' });
        return;
      }

      if (user.crediti < 1) {
        socket.emit('chat:error', { message: 'Crediti insufficienti (richiesto: 1 Credito)' });
        return;
      }

      // Record social action (Social-to-Earn: +10 points, costs 1 credit)
      const socialResult = await db.recordSocialAction(socket.userId, 'social_wall_message', null);

      // Save message
      const savedMessage = await db.saveMessage(socket.userId, user.username, data.message);

      // Broadcast message to all clients
      io.emit('chat:message', {
        id: savedMessage.id,
        username: user.username,
        message: data.message,
        timestamp: savedMessage.timestamp,
        pointsEarned: socialResult.pointsEarned
      });

      // Send updated credits and points to sender
      socket.emit('credits:updated', {
        crediti: socialResult.newCredits,
        punti_classifica: socialResult.newPoints
      });

      // Broadcast social action
      io.emit('social:action', {
        userId: socket.userId,
        username: user.username,
        actionType: 'social_wall_message',
        pointsEarned: socialResult.pointsEarned
      });

    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('chat:error', { message: error.message || 'Errore invio messaggio' });
    }
  });

  // Get chat history
  socket.on('chat:history', async () => {
    try {
      const messages = await db.getRecentMessages(50);
      socket.emit('chat:history', messages);
    } catch (error) {
      console.error('Chat history error:', error);
    }
  });

  // Game: Roll dice
  socket.on('game:roll', async () => {
    try {
      const user = await db.getUser(socket.userId);
      if (!user) return;

      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;

      const playerState = await db.getPlayerState(socket.userId);
      const newPosition = (playerState.position + total) % 24;

      await db.updatePlayerPosition(socket.userId, newPosition);

      const property = await db.getProperty(newPosition);

      io.emit('game:rolled', {
        username: user.username,
        dice1,
        dice2,
        total,
        newPosition,
        property
      });

    } catch (error) {
      console.error('Game roll error:', error);
    }
  });

  // Game: Buy property
  socket.on('game:buy', async (data) => {
    try {
      const user = await db.getUser(socket.userId);
      const property = await db.getProperty(data.position);

      if (!property || property.price === 0) {
        socket.emit('game:error', { message: 'Proprietà non disponibile' });
        return;
      }

      if (property.owner_id) {
        socket.emit('game:error', { message: 'Proprietà già posseduta' });
        return;
      }

      if (user.crediti < property.price) {
        socket.emit('game:error', { message: 'Crediti insufficienti' });
        return;
      }

      await db.updateCredits(socket.userId, -property.price);
      await db.updatePropertyOwner(data.position, socket.userId);

      io.emit('game:purchased', {
        username: user.username,
        property: property.name,
        price: property.price
      });

      socket.emit('credits:updated', { crediti: user.crediti - property.price });

    } catch (error) {
      console.error('Game buy error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameState.players.delete(socket.id);
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    await db.initializeDatabase();
    await initializeProperties();
    await db.initializeCards();
    await initializeBots();

    // Check for monthly reset on startup
    const resetStatus = await db.checkMonthlyReset();
    if (resetStatus.resetPerformed) {
      console.log('📊 Monthly points reset performed:', resetStatus.usersReset, 'users');
    } else if (resetStatus.daysRemaining) {
      console.log(`📊 Next monthly reset in ${resetStatus.daysRemaining} days`);
    }

    // Check for monthly reset every 24 hours
    setInterval(async () => {
      try {
        const status = await db.checkMonthlyReset();
        if (status.resetPerformed) {
          console.log('📊 Automatic monthly points reset performed');
          io.emit('social:points-reset', status);
        }
      } catch (error) {
        console.error('Monthly reset check error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    server.listen(PORT, () => {
      console.log(`🚀 LUNC HORIZON Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: lunc_horizon.db`);
      console.log(`🎮 Bots initialized: ${gameState.bots.length}`);
      console.log(`🎯 Social-to-Earn: ACTIVE`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
