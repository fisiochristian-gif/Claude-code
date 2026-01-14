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
      { position: 0, name: 'START', price: 0, rent: 0, color_group: 'special' },
      { position: 1, name: 'Via Roma', price: 60, rent: 6, color_group: 'brown' },
      { position: 2, name: 'Carta Comunità', price: 0, rent: 0, color_group: 'special' },
      { position: 3, name: 'Via Napoli', price: 60, rent: 6, color_group: 'brown' },
      { position: 4, name: 'Tassa', price: 0, rent: 0, color_group: 'special' },
      { position: 5, name: 'Stazione Nord', price: 100, rent: 25, color_group: 'station' },
      { position: 6, name: 'Via Milano', price: 100, rent: 10, color_group: 'lightblue' },
      { position: 7, name: 'Probabilità', price: 0, rent: 0, color_group: 'special' },
      { position: 8, name: 'Via Torino', price: 100, rent: 10, color_group: 'lightblue' },
      { position: 9, name: 'Via Firenze', price: 120, rent: 12, color_group: 'lightblue' },
      { position: 10, name: 'Prigione', price: 0, rent: 0, color_group: 'special' },
      { position: 11, name: 'Via Venezia', price: 140, rent: 14, color_group: 'pink' },
      { position: 12, name: 'Società Elettrica', price: 75, rent: 0, color_group: 'utility' },
      { position: 13, name: 'Via Genova', price: 140, rent: 14, color_group: 'pink' },
      { position: 14, name: 'Via Bologna', price: 160, rent: 16, color_group: 'pink' },
      { position: 15, name: 'Stazione Sud', price: 100, rent: 25, color_group: 'station' },
      { position: 16, name: 'Via Palermo', price: 180, rent: 18, color_group: 'orange' },
      { position: 17, name: 'Carta Comunità', price: 0, rent: 0, color_group: 'special' },
      { position: 18, name: 'Via Bari', price: 180, rent: 18, color_group: 'orange' },
      { position: 19, name: 'Via Catania', price: 200, rent: 20, color_group: 'orange' },
      { position: 20, name: 'Parcheggio Gratuito', price: 0, rent: 0, color_group: 'special' },
      { position: 21, name: 'Via Verona', price: 220, rent: 22, color_group: 'red' },
      { position: 22, name: 'Probabilità', price: 0, rent: 0, color_group: 'special' },
      { position: 23, name: 'Via Parma', price: 240, rent: 24, color_group: 'red' }
    ];

    for (const prop of propertyData) {
      await db.db.run(
        'INSERT INTO properties (position, name, price, rent, color_group) VALUES (?, ?, ?, ?, ?)',
        [prop.position, prop.name, prop.price, prop.rent, prop.color_group]
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
