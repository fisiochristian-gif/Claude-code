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

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.getLeaderboard(10);
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

      // Deduct 1 credit
      await db.updateCredits(socket.userId, -1);

      // Save message
      const savedMessage = await db.saveMessage(socket.userId, user.username, data.message);

      // Broadcast message to all clients
      io.emit('chat:message', {
        id: savedMessage.id,
        username: user.username,
        message: data.message,
        timestamp: savedMessage.timestamp
      });

      // Send updated credits to sender
      socket.emit('credits:updated', { crediti: user.crediti - 1 });

    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('chat:error', { message: 'Errore invio messaggio' });
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

    server.listen(PORT, () => {
      console.log(`🚀 LUNC HORIZON Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: lunc_horizon.db`);
      console.log(`🎮 Bots initialized: ${gameState.bots.length}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
