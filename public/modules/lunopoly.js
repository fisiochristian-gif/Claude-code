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

        // Initialize neon enhancements if available
        if (window.lunoplyNeon) {
            window.lunoplyNeon.initializeNeonEnhancements();
        }
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

    // Add center board branding
    const centerBoard = document.createElement('div');
    centerBoard.className = 'board-center';
    centerBoard.innerHTML = `
        <div class="lunopoly-logo">LUNOPOLY</div>
        <div class="powered-by">Powered by</div>
        <div class="rendite-digitali">Rendite Digitali</div>
        <div class="card-decks">
            <div class="card-deck imprevisti" onclick="drawCard('IMPREVISTI')">
                <div class="deck-label">IMPREVISTI</div>
                <div class="deck-icon">🔴</div>
            </div>
            <div class="card-deck probabilita" onclick="drawCard('PROBABILITÀ')">
                <div class="deck-label">PROBABILITÀ</div>
                <div class="deck-icon">🔵</div>
            </div>
        </div>
    `;
    gameBoard.appendChild(centerBoard);

    // Render board cells with color groups
    gameProperties.forEach((property, index) => {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.position = property.position;
        cell.dataset.colorGroup = property.color_group;

        if (property.position === playerPosition) {
            cell.classList.add('player-position');
        }

        if (property.owner_id) {
            cell.classList.add('owned');
        }

        // Add color bar for property groups
        let colorBar = '';
        if (property.color_group && property.color_group !== 'special') {
            const colorMap = {
                'brown': '#8B4513',
                'lightblue': '#87CEEB',
                'orange': '#FFA500',
                'red': '#FF4444',
                'purple': '#9B59B6',
                'gold': '#FFD700'
            };
            const color = colorMap[property.color_group] || '#CCCCCC';
            colorBar = `<div class="color-bar" style="background: ${color};"></div>`;
        }

        // Calculate rent based on level
        const baseRent = property.rent;
        const level = property.level || 0;
        const displayRent = level > 0 ? baseRent * Math.pow(2, level) : baseRent;

        // Level indicators (houses/hotel)
        let levelIndicator = '';
        if (level > 0 && level < 5) {
            levelIndicator = `<div class="level-indicator">${'🏠'.repeat(level)}</div>`;
        } else if (level === 5) {
            levelIndicator = `<div class="level-indicator">🏨</div>`;
        }

        cell.innerHTML = `
            ${colorBar}
            <span class="cell-position">#${property.position}</span>
            <div class="cell-name">${property.name}</div>
            ${property.price > 0 ? `<div class="cell-price">💰 ${property.price} L</div>` : ''}
            ${property.price > 0 ? `<div class="cell-rent">💸 ${displayRent} L/turno</div>` : ''}
            ${levelIndicator}
            ${property.owner_id ? '<div class="cell-owner">👤 Posseduta</div>' : ''}
            ${property.is_mortgaged ? '<div class="cell-mortgaged">⚠️ Ipotecata</div>' : ''}
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
// CARD SYSTEM WITH 3D FLIP ANIMATION
// ================================

async function drawCard(cardType) {
    if (!window.app.currentUser) {
        alert('Devi essere autenticato per pescare una carta');
        return;
    }

    try {
        const response = await fetch(`${window.app.API_BASE}/api/cards/draw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableId: 1,
                playerId: window.app.currentUser.id_univoco,
                cardType
            })
        });

        const result = await response.json();

        if (result.success) {
            // Use neon animation if available, otherwise use default
            if (window.lunoplyNeon && window.lunoplyNeon.drawCardWithAnimation) {
                window.lunoplyNeon.drawCardWithAnimation(result.card);
            } else {
                showCardWithFlipAnimation(result.card);
            }
        } else {
            alert('Errore durante il pescaggio della carta');
        }

    } catch (error) {
        console.error('Draw card error:', error);
        alert('Errore durante il pescaggio della carta');
    }
}

function showCardWithFlipAnimation(card) {
    // Create card overlay
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = `
        <div class="card-3d-container">
            <div class="card-flipper">
                <div class="card-front ${card.type === 'IMPREVISTI' ? 'card-red' : 'card-blue'}">
                    <div class="card-type-label">${card.type}</div>
                    <div class="card-icon">${card.type === 'IMPREVISTI' ? '🔴' : '🔵'}</div>
                </div>
                <div class="card-back ${card.type === 'IMPREVISTI' ? 'card-red' : 'card-blue'}">
                    <div class="card-title">${card.title}</div>
                    <div class="card-description">${card.description}</div>
                    <div class="card-branding">${card.branding_text}</div>
                    <button class="apply-card-btn" onclick="applyCardEffect(${card.id})">Applica Effetto</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Trigger flip animation after short delay
    setTimeout(() => {
        const flipper = overlay.querySelector('.card-flipper');
        flipper.classList.add('flipped');
    }, 300);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    // Store current card
    window.currentCard = card;
}

async function applyCardEffect(cardId) {
    if (!window.app.currentUser) return;

    try {
        const response = await fetch(`${window.app.API_BASE}/api/cards/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tableId: 1,
                playerId: window.app.currentUser.id_univoco,
                cardId
            })
        });

        const result = await response.json();

        if (result.success) {
            // Show effect result
            let message = '';
            switch (result.effect) {
                case 'move_to':
                    message = `Ti sei spostato alla posizione ${result.newPosition}!`;
                    playerPosition = result.newPosition;
                    playerPositionDisplay.textContent = result.newPosition;
                    renderBoard();
                    break;
                case 'pay_bank':
                    message = `Hai pagato ${result.amountPaid} L alla Banca!`;
                    break;
                case 'receive_bank':
                    message = `Hai ricevuto ${result.amountReceived} L dalla Banca!`;
                    break;
                case 'collect_all':
                    message = `Ogni giocatore deve pagarti ${result.collectAmount} L!`;
                    break;
            }

            addLogEntry(message);
            alert(message);

            // Close card overlay
            const overlay = document.querySelector('.card-overlay');
            if (overlay) overlay.remove();

            // Reload properties to update board
            await loadProperties();
            renderBoard();
        }

    } catch (error) {
        console.error('Apply card effect error:', error);
        alert('Errore durante l\'applicazione dell\'effetto');
    }
}

// ================================
// EXPORTS
// ================================

window.initializeLunopoly = initializeLunopoly;
window.handleGameRoll = handleGameRoll;
window.handleGamePurchase = handleGamePurchase;
window.drawCard = drawCard;
window.applyCardEffect = applyCardEffect;
