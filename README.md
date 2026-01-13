# 🚀 LUNC HORIZON dApp

**LUNC HORIZON** è una dApp (Decentralized Application) unificata che integra tre moduli principali:
1. **LUNOPOLY** - Gioco tipo Monopoly con tabellone a 24 caselle
2. **SOCIAL WALL** - Chat in tempo reale (1 Credito per messaggio)
3. **BLOG** - Feed integrato da renditedigitali.blogspot.com

---

## 📋 Caratteristiche

### ✨ LUNOPOLY (Gioco)
- Tabellone a **24 caselle** stile Monopoly
- **4 Bot Conservatori** che giocano automaticamente
- Timer automatico di **10 secondi** per ogni turno
- Sistema di **acquisto proprietà** e pagamento affitti
- Sistema di **trattative** tra giocatori
- Log eventi in tempo reale

### 💬 SOCIAL WALL (Chat)
- Chat in **tempo reale** con Socket.io
- Ogni messaggio costa **1 Credito LUNC**
- Storico messaggi persistente
- Notifiche in tempo reale

### 📰 BLOG
- Integrazione con feed RSS di **renditedigitali.blogspot.com**
- Visualizzazione ultimi post
- Link diretti agli articoli

### 🎯 Sistema Generale
- **ID Univoco** per ogni utente
- Sistema di **Crediti LUNC**
- **Classifica** dei top players
- Tema **Cyberpunk Dark/Gold**
- Design responsive

---

## 🛠️ Tecnologie Utilizzate

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Web framework
- **Socket.io** - Real-time communication
- **SQLite3** - Database embedded
- **Axios** - HTTP client per il feed del blog

### Frontend
- **HTML5/CSS3** - Struttura e stile
- **Vanilla JavaScript** - Logica client-side
- **Socket.io Client** - Comunicazione real-time
- **Google Fonts** (Orbitron, Rajdhani) - Typography

---

## 📦 Installazione

### Prerequisiti
- **Node.js** v16 o superiore
- **npm** o **yarn**

### Step di installazione

1. **Clone del repository**
```bash
git clone <repository-url>
cd Claude-code
```

2. **Installazione dipendenze**
```bash
npm install
```

3. **Avvio del server**
```bash
npm start
```

4. **Accesso all'applicazione**
Apri il browser su: **http://localhost:3000**

---

## 🎮 Come Usare

### 1. Login
- Inserisci un **username** univoco
- Il sistema genera automaticamente un **ID Univoco**
- Ricevi **100 Crediti** iniziali

### 2. Navigazione
Usa la **sidebar** per spostarti tra i moduli:
- **🎲 LUNOPOLY** - Gioca al tabellone
- **💬 SOCIAL WALL** - Chatta con altri utenti
- **📰 BLOG** - Leggi gli ultimi articoli
- **🏆 CLASSIFICA** - Visualizza la leaderboard

### 3. LUNOPOLY
- Clicca **"LANCIA DADI"** per muoverti sul tabellone
- Quando atterri su una proprietà libera, puoi **acquistarla**
- Paga l'**affitto** quando atterri su proprietà altrui
- Timer automatico di **10 secondi** per ogni turno

### 4. SOCIAL WALL
- Scrivi un messaggio nel campo di testo
- Ogni messaggio costa **1 Credito**
- Premi **INVIO** o clicca **"INVIA"** per inviare

### 5. BLOG
- Visualizza automaticamente gli ultimi post
- Clicca **"Leggi di più"** per aprire l'articolo completo

---

## 📂 Struttura del Progetto

```
Claude-code/
├── server.js              # Server principale (Express + Socket.io)
├── database.js            # Database layer (SQLite)
├── package.json           # Dipendenze e scripts
├── public/                # Frontend
│   ├── index.html         # Pagina principale
│   ├── styles.css         # Stili Cyberpunk
│   ├── app.js             # Logica principale frontend
│   └── modules/           # Moduli separati
│       ├── lunopoly.js    # Logica gioco LUNOPOLY
│       ├── social.js      # Logica Social Wall
│       └── blog.js        # Logica Blog feed
└── lunc_horizon.db        # Database SQLite (generato automaticamente)
```

---

## 🗄️ Database Schema

### Tabella `users`
```sql
- id_univoco (TEXT PRIMARY KEY)
- username (TEXT UNIQUE)
- crediti (INTEGER DEFAULT 100)
- created_at (DATETIME)
- last_login (DATETIME)
```

### Tabella `properties`
```sql
- id (INTEGER PRIMARY KEY)
- position (INTEGER UNIQUE)
- name (TEXT)
- owner_id (TEXT)
- price (INTEGER)
- rent (INTEGER)
- level (INTEGER DEFAULT 0)
- color_group (TEXT)
```

### Tabella `game_state`
```sql
- id (INTEGER PRIMARY KEY)
- player_id (TEXT)
- position (INTEGER DEFAULT 0)
- in_jail (BOOLEAN DEFAULT 0)
- jail_turns (INTEGER DEFAULT 0)
- is_bot (BOOLEAN DEFAULT 0)
```

### Tabella `messages`
```sql
- id (INTEGER PRIMARY KEY)
- user_id (TEXT)
- username (TEXT)
- message (TEXT)
- timestamp (DATETIME)
```

---

## 🎨 Design Theme

### Colori Cyberpunk
- **Primary Dark**: `#0a0e27`
- **Secondary Dark**: `#1a1f3a`
- **Accent Gold**: `#ffd700`
- **Accent Gold Dark**: `#ffaa00`
- **Accent Cyan**: `#00ffff`
- **Success Green**: `#00ff00`
- **Error Red**: `#ff0000`

### Tipografia
- **Orbitron** - Titoli e headings
- **Rajdhani** - Body text

---

## 🔧 Configurazione

### Porta del Server
Modifica la porta in `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Database
Il database SQLite viene creato automaticamente al primo avvio in `lunc_horizon.db`.

---

## 📡 API Endpoints

### REST API
```
GET  /api/health                    # Health check
POST /api/auth/login                # Login/Registrazione
GET  /api/user/:id                  # Dettagli utente
GET  /api/leaderboard               # Top 10 giocatori
GET  /api/properties                # Lista proprietà LUNOPOLY
GET  /api/blog/feed                 # Proxy feed blog
```

### Socket.IO Events

#### Client → Server
```
user:join          # Utente si connette
chat:message       # Invia messaggio (costa 1 credito)
chat:history       # Richiede storico messaggi
game:roll          # Lancia i dadi
game:buy           # Acquista proprietà
```

#### Server → Client
```
user:joined        # Notifica nuovo utente
credits:updated    # Aggiornamento crediti
chat:message       # Nuovo messaggio
chat:history       # Storico messaggi
chat:error         # Errore chat
game:rolled        # Risultato lancio dadi
game:purchased     # Proprietà acquistata
game:error         # Errore gioco
```

---

## 🚀 Deployment

### Sviluppo
```bash
npm run dev  # Con nodemon per auto-reload
```

### Produzione
```bash
npm start
```

### Deploy su Cloud
Compatibile con:
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean**
- **AWS**

---

## 📝 Glossario

- **ID Univoco**: Identificatore univoco generato per ogni utente
- **Crediti**: Valuta virtuale del sistema (LUNC)
- **Classifica**: Ranking dei giocatori per numero di Crediti
- **Bot Conservatori**: 4 bot automatici che giocano a LUNOPOLY

---

## 🐛 Troubleshooting

### Il server non si avvia
- Verifica che la porta 3000 sia libera
- Controlla che Node.js sia installato: `node -v`

### Database non si crea
- Verifica i permessi di scrittura nella directory
- Elimina `lunc_horizon.db` e riavvia

### Socket.io non connette
- Controlla la console del browser per errori
- Verifica che il firewall non blocchi WebSocket

---

## 👥 Autori

- **LUNC HORIZON Team**

---

## 📄 Licenza

MIT License - Vedi file LICENSE per dettagli

---

## 🌐 Links

- **Blog**: [renditedigitali.blogspot.com](https://renditedigitali.blogspot.com)
- **Repository**: [GitHub](https://github.com/your-repo)

---

**Sviluppato con 💛 per la community LUNC**