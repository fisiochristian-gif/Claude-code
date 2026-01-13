// ================================
// LUNOPOLY MODULE
// Game logic for 24-cell Monopoly board
// ================================

let gameProperties = [];
let playerPosition = 0;
let turnTimerInterval = null;
let turnTimerSeconds = 10;

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const rollDiceBtn = document.getElementById('rollDiceBtn');
const diceResult = document.getElementById('diceResult');
const playerPositionDisplay = document.getElementById('playerPosition');
const currentTurnDisplay = document.getElementById('currentTurn');
const turnTimerDisplay = document.getElementById('turnTimer');
const gameLogContent = document.getElementById('gameLogContent');

// ================================
// INITIALIZATION
// ================================

async function initializeLunopoly() {
    console.log('🎲 Initializing LUNOPOLY...');

    try {
        await loadProperties();
        renderBoard();
        setupGameEvents();
        startTurnTimer();
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

        if (property.position === playerPosition) {
            cell.classList.add('player-position');
        }

        if (property.owner_id) {
            cell.classList.add('owned');
        }

        cell.innerHTML = `
            <span class="cell-position">#${property.position}</span>
            <div class="cell-name">${property.name}</div>
            ${property.price > 0 ? `<div class="cell-price">${property.price}⚡</div>` : ''}
            ${property.owner_id ? '<div class="cell-owner">👤</div>' : ''}
        `;

        cell.addEventListener('click', () => showPropertyDetails(property));

        gameBoard.appendChild(cell);
    });
}

function showPropertyDetails(property) {
    if (property.price === 0) return;

    const details = `
        📍 ${property.name}
        💰 Prezzo: ${property.price} Crediti
        💸 Affitto: ${property.rent} Crediti
        ${property.owner_id ? '👤 Proprietà posseduta' : '✅ Disponibile'}
    `;

    alert(details);
}

// ================================
// GAME EVENTS
// ================================

function setupGameEvents() {
    rollDiceBtn.addEventListener('click', rollDice);
}

function rollDice() {
    if (!window.app.socket) {
        alert('Socket non connesso');
        return;
    }

    rollDiceBtn.disabled = true;
    diceResult.textContent = '🎲 Lancio...';

    window.app.socket.emit('game:roll');

    setTimeout(() => {
        rollDiceBtn.disabled = false;
    }, 2000);
}

function handleGameRoll(data) {
    console.log('🎲 Dice rolled:', data);

    // Update dice result
    diceResult.innerHTML = `
        <div style="display: flex; gap: 1rem; justify-content: center; align-items: center;">
            <div style="font-size: 2rem;">🎲 ${data.dice1}</div>
            <div style="font-size: 2rem;">🎲 ${data.dice2}</div>
            <div style="font-size: 1.5rem; color: #00ff00;">= ${data.total}</div>
        </div>
    `;

    // Update position if it's current user
    if (data.username === window.app.currentUser.username) {
        playerPosition = data.newPosition;
        playerPositionDisplay.textContent = data.newPosition;
        renderBoard();

        // Check if can buy property
        if (data.property && data.property.price > 0 && !data.property.owner_id) {
            setTimeout(() => {
                const buy = confirm(`Vuoi acquistare ${data.property.name} per ${data.property.price} Crediti?`);
                if (buy) {
                    buyProperty(data.newPosition);
                }
            }, 500);
        }
    }

    // Add to game log
    addLogEntry(`${data.username} ha lanciato ${data.dice1} + ${data.dice2} = ${data.total}. Nuova posizione: ${data.newPosition} (${data.property.name})`);

    // Reset turn timer
    resetTurnTimer();
}

function buyProperty(position) {
    if (!window.app.socket) return;

    window.app.socket.emit('game:buy', { position });
}

function handleGamePurchase(data) {
    console.log('💰 Property purchased:', data);

    addLogEntry(`${data.username} ha acquistato ${data.property} per ${data.price} Crediti!`);

    // Reload properties to update board
    loadProperties().then(() => renderBoard());
}

// ================================
// TURN TIMER (10 seconds auto-roll)
// ================================

function startTurnTimer() {
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
    }

    turnTimerSeconds = 10;
    turnTimerDisplay.textContent = `${turnTimerSeconds}s`;

    turnTimerInterval = setInterval(() => {
        turnTimerSeconds--;
        turnTimerDisplay.textContent = `${turnTimerSeconds}s`;

        if (turnTimerSeconds <= 0) {
            // Auto-roll (can be enhanced to include bots)
            resetTurnTimer();
        }
    }, 1000);
}

function resetTurnTimer() {
    turnTimerSeconds = 10;
    turnTimerDisplay.textContent = `${turnTimerSeconds}s`;
}

// ================================
// GAME LOG
// ================================

function addLogEntry(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

    gameLogContent.insertBefore(entry, gameLogContent.firstChild);

    // Keep only last 20 entries
    while (gameLogContent.children.length > 20) {
        gameLogContent.removeChild(gameLogContent.lastChild);
    }
}

// ================================
// EXPORTS
// ================================

window.initializeLunopoly = initializeLunopoly;
window.handleGameRoll = handleGameRoll;
window.handleGamePurchase = handleGamePurchase;
