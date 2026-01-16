// ================================
// AREA LUNOPOLY MODULE
// Complete Game Interface with Action Buttons
// ================================

let gameProperties = [];
let playerPosition = 0;
let turnTimerInterval = null;
let turnTimerSeconds = 10;
let currentTurn = 'player';
let selectedProperty = null;
let gameBalance = 1500; // Initial game balance (L currency)

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const rollDiceBtn = document.getElementById('rollDiceBtn');
const buyBtn = document.getElementById('buyBtn');
const auctionBtn = document.getElementById('auctionBtn');
const tradeBtn = document.getElementById('tradeBtn');
const endTurnBtn = document.getElementById('endTurnBtn');
const diceResult = document.getElementById('diceResult');
const playerPositionDisplay = document.getElementById('playerPosition');
const currentTurnDisplay = document.getElementById('currentTurn');
const turnTimerDisplay = document.getElementById('turnTimer');
const gameLogContent = document.getElementById('gameLogContent');

// ================================
// INITIALIZATION
// ================================

async function initializeLunopoly() {
    console.log('🎲 Initializing AREA LUNOPOLY...');

    try {
        await loadProperties();
        renderBoard();
        setupGameEvents();
        startTurnTimer();
        updateTurnDisplay();
    } catch (error) {
        console.error('LUNOPOLY initialization error:', error);
    }
}

async function loadProperties() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/properties`);
        gameProperties = await response.json();
        console.log('✅ Properties loaded:', gameProperties.length);
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// ================================
// BOARD RENDERING
// ================================

function renderBoard() {
    if (gameProperties.length === 0) {
        gameBoard.innerHTML = '<div class="loading">Caricamento tabellone...</div>';
        return;
    }

    gameBoard.innerHTML = '';

    gameProperties.forEach((property, index) => {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.position = property.position;

        // Highlight player position
        if (property.position === playerPosition) {
            cell.classList.add('player-position');
        }

        // Show ownership
        if (property.owner_id) {
            cell.classList.add('owned');
        }

        // Special cells styling
        if (property.name === 'PARTENZA' || property.name === 'VIA!') {
            cell.classList.add('special-start');
        } else if (property.name.includes('PRIGIONE')) {
            cell.classList.add('special-jail');
        } else if (property.name.includes('TASSA')) {
            cell.classList.add('special-tax');
        }

        cell.innerHTML = `
            <span class="cell-position">#${property.position}</span>
            <div class="cell-name">${property.name}</div>
            ${property.price > 0 ? `<div class="cell-price">${property.price} L</div>` : ''}
            ${property.owner_id ? '<div class="cell-owner">👤</div>' : ''}
            ${property.position === playerPosition ? '<div class="player-marker">🎮</div>' : ''}
        `;

        cell.addEventListener('click', () => selectProperty(property));

        gameBoard.appendChild(cell);
    });
}

function selectProperty(property) {
    selectedProperty = property;

    // Remove previous selection
    document.querySelectorAll('.board-cell').forEach(cell => {
        cell.classList.remove('selected');
    });

    // Highlight selected cell
    const selectedCell = document.querySelector(`[data-position="${property.position}"]`);
    if (selectedCell) {
        selectedCell.classList.add('selected');
    }

    showPropertyDetails(property);
    updateActionButtons();
}

function showPropertyDetails(property) {
    if (property.price === 0) {
        addGameLog(`📍 ${property.name} - Casella speciale`);
        return;
    }

    const details = `
        📍 ${property.name}
        💰 Prezzo: ${property.price} L
        💸 Affitto: ${property.rent} L/turno
        ${property.owner_id ? '👤 Proprietà posseduta' : '✅ Disponibile per acquisto'}
    `;

    addGameLog(details);
}

// ================================
// GAME EVENTS
// ================================

function setupGameEvents() {
    if (rollDiceBtn) {
        rollDiceBtn.addEventListener('click', rollDice);
    }

    if (buyBtn) {
        buyBtn.addEventListener('click', buyProperty);
    }

    if (auctionBtn) {
        auctionBtn.addEventListener('click', startAuction);
    }

    if (tradeBtn) {
        tradeBtn.addEventListener('click', openTradeDialog);
    }

    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', endTurn);
    }

    // Socket events
    if (window.app && window.app.socket) {
        window.app.socket.on('game:rolled', handleGameRoll);
        window.app.socket.on('game:purchased', handleGamePurchase);
        window.app.socket.on('game:turn', handleTurnChange);
    }
}

function rollDice() {
    if (!window.app.currentUser) {
        addGameLog('❌ Devi essere autenticato per giocare');
        return;
    }

    if (currentTurn !== 'player') {
        addGameLog('⏳ Aspetta il tuo turno');
        return;
    }

    // Disable button during roll
    rollDiceBtn.disabled = true;

    // Emit roll event
    if (window.app.socket) {
        window.app.socket.emit('game:roll', {
            userId: window.app.currentUser.id_univoco
        });
    }

    // Re-enable after 1 second
    setTimeout(() => {
        rollDiceBtn.disabled = false;
    }, 1000);
}

function buyProperty() {
    if (!selectedProperty) {
        addGameLog('❌ Seleziona una proprietà prima');
        return;
    }

    if (selectedProperty.owner_id) {
        addGameLog('❌ Proprietà già posseduta');
        return;
    }

    if (selectedProperty.price === 0) {
        addGameLog('❌ Questa casella non è acquistabile');
        return;
    }

    if (!window.app.currentUser) {
        addGameLog('❌ Devi essere autenticato');
        return;
    }

    // NOTE: Game balance validation should be done server-side
    // This is a simplified client-side check
    const confirmMsg = `Acquistare "${selectedProperty.name}" per ${selectedProperty.price} L?`;
    if (!confirm(confirmMsg)) return;

    // Emit purchase event
    if (window.app.socket) {
        window.app.socket.emit('game:purchase', {
            userId: window.app.currentUser.id_univoco,
            propertyId: selectedProperty.id
        });
    }
}

function startAuction() {
    if (!selectedProperty) {
        addGameLog('❌ Seleziona una proprietà prima');
        return;
    }

    addGameLog('🔨 Sistema d\'asta in fase di sviluppo');
    alert('⚠️ Funzionalità ASTA in arrivo nella prossima versione!');
}

function openTradeDialog() {
    addGameLog('🤝 Sistema di scambio in fase di sviluppo');
    alert('⚠️ Funzionalità SCAMBIA in arrivo nella prossima versione!');
}

function endTurn() {
    if (currentTurn !== 'player') {
        addGameLog('⏳ Non è il tuo turno');
        return;
    }

    currentTurn = 'bot';
    addGameLog('✅ Turno terminato. Tocca ai bot...');
    updateTurnDisplay();

    // Simulate bot turns (in real implementation, this would be server-side)
    setTimeout(() => {
        simulateBotTurns();
    }, 2000);
}

// ================================
// SOCKET HANDLERS
// ================================

function handleGameRoll(data) {
    console.log('🎲 Roll received:', data);

    const diceValue = data.diceRoll;
    playerPosition = data.newPosition;

    // Show dice result
    if (diceResult) {
        diceResult.textContent = `🎲 Hai lanciato: ${diceValue}`;
        diceResult.style.display = 'flex';
    }

    // Update position
    if (playerPositionDisplay) {
        playerPositionDisplay.textContent = playerPosition;
    }

    addGameLog(`🎲 Hai lanciato ${diceValue}. Nuova posizione: ${playerPosition}`);

    // Re-render board
    renderBoard();

    // Auto-select landed property
    const landedProperty = gameProperties.find(p => p.position === playerPosition);
    if (landedProperty) {
        selectProperty(landedProperty);
    }
}

function handleGamePurchase(data) {
    console.log('💰 Purchase received:', data);

    addGameLog(`✅ ${data.username} ha acquistato ${data.propertyName} per ${data.price} L`);

    // Reload properties to update ownership
    loadProperties().then(() => {
        renderBoard();
    });
}

function handleTurnChange(data) {
    currentTurn = data.currentTurn;
    updateTurnDisplay();
}

// ================================
// BOT SIMULATION
// ================================

function simulateBotTurns() {
    const bots = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];
    let botIndex = 0;

    const botTurnInterval = setInterval(() => {
        if (botIndex >= bots.length) {
            clearInterval(botTurnInterval);
            currentTurn = 'player';
            updateTurnDisplay();
            addGameLog('✅ Tocca a te!');
            return;
        }

        const botName = bots[botIndex];
        const diceRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;

        addGameLog(`🤖 ${botName} lancia i dadi: ${diceRoll}`);

        // Bot conservative behavior: 30% chance to buy if affordable
        if (Math.random() < 0.3) {
            const affordableProps = gameProperties.filter(p =>
                p.price > 0 && p.price < 500 && !p.owner_id
            );

            if (affordableProps.length > 0) {
                const randomProp = affordableProps[Math.floor(Math.random() * affordableProps.length)];
                addGameLog(`🤖 ${botName} acquista ${randomProp.name}`);
            }
        }

        botIndex++;
    }, 1500);
}

// ================================
// TURN TIMER
// ================================

function startTurnTimer() {
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
    }

    turnTimerSeconds = 10;

    turnTimerInterval = setInterval(() => {
        turnTimerSeconds--;

        if (turnTimerDisplay) {
            turnTimerDisplay.textContent = `${turnTimerSeconds}s`;
        }

        if (turnTimerSeconds <= 0) {
            // Auto end turn
            if (currentTurn === 'player') {
                endTurn();
            }
            turnTimerSeconds = 10;
        }
    }, 1000);
}

function updateTurnDisplay() {
    if (currentTurnDisplay) {
        if (currentTurn === 'player') {
            currentTurnDisplay.textContent = '🎮 TUO TURNO';
            currentTurnDisplay.style.color = '#00ffff';
        } else {
            currentTurnDisplay.textContent = '🤖 TURNO BOT';
            currentTurnDisplay.style.color = '#ffa500';
        }
    }

    updateActionButtons();
}

function updateActionButtons() {
    const isPlayerTurn = currentTurn === 'player';

    if (rollDiceBtn) rollDiceBtn.disabled = !isPlayerTurn;
    if (buyBtn) buyBtn.disabled = !isPlayerTurn || !selectedProperty || selectedProperty.owner_id;
    if (auctionBtn) auctionBtn.disabled = !isPlayerTurn;
    if (tradeBtn) tradeBtn.disabled = !isPlayerTurn;
    if (endTurnBtn) endTurnBtn.disabled = !isPlayerTurn;
}

// ================================
// GAME LOG
// ================================

function addGameLog(message) {
    if (!gameLogContent) return;

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;

    gameLogContent.prepend(logEntry);

    // Limit to 50 entries
    while (gameLogContent.children.length > 50) {
        gameLogContent.removeChild(gameLogContent.lastChild);
    }
}

// ================================
// EXPORTS
// ================================

window.initializeLunopoly = initializeLunopoly;
window.handleGameRoll = handleGameRoll;
window.handleGamePurchase = handleGamePurchase;
