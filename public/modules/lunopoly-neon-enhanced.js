// ================================
// LUNOPOLY NEON ENHANCEMENTS
// Player tokens, LERP movement, notifications, countdown timer
// ================================

let playerTokens = new Map(); // Map<playerId, tokenElement>
let notificationLog = [];
let countdownTimer = null;
let countdownInterval = null;

// ================================
// PLAYER TOKEN SYSTEM
// ================================

const TOKEN_TYPES = {
    player1: { type: 'rocket', icon: '🚀' },
    player2: { type: 'coin', icon: '💰' },
    player3: { type: 'node', icon: '🔗' },
    player4: { type: 'chart', icon: '📈' }
};

function createPlayerToken(playerId, playerData) {
    // Remove existing token if present
    if (playerTokens.has(playerId)) {
        playerTokens.get(playerId).remove();
    }

    const token = document.createElement('div');
    const tokenType = TOKEN_TYPES[playerId] || TOKEN_TYPES.player1;

    token.className = `player-token ${tokenType.type}`;
    token.dataset.playerId = playerId;
    token.setAttribute('title', playerData.username || playerId);

    // Position token at starting position
    const startCell = document.querySelector('.board-cell[data-position="0"]');
    if (startCell) {
        const rect = startCell.getBoundingClientRect();
        const boardRect = document.getElementById('gameBoard').getBoundingClientRect();

        token.style.left = `${rect.left - boardRect.left + rect.width / 2 - 25}px`;
        token.style.top = `${rect.top - boardRect.top + rect.height / 2 - 25}px`;
    }

    document.getElementById('gameBoard').appendChild(token);
    playerTokens.set(playerId, token);

    return token;
}

function movePlayerToken(playerId, fromPosition, toPosition, duration = 800) {
    const token = playerTokens.get(playerId);
    if (!token) {
        console.warn(`Token not found for player ${playerId}`);
        return;
    }

    const targetCell = document.querySelector(`.board-cell[data-position="${toPosition}"]`);
    if (!targetCell) {
        console.warn(`Target cell not found: ${toPosition}`);
        return;
    }

    // Add moving class for smooth transition
    token.classList.add('moving');

    // Calculate target position
    const rect = targetCell.getBoundingClientRect();
    const boardRect = document.getElementById('gameBoard').getBoundingClientRect();

    // LERP animation using CSS transitions
    token.style.transition = `all ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
    token.style.left = `${rect.left - boardRect.left + rect.width / 2 - 25}px`;
    token.style.top = `${rect.top - boardRect.top + rect.height / 2 - 25}px`;

    // Remove moving class after animation
    setTimeout(() => {
        token.classList.remove('moving');
    }, duration);

    // Add notification
    addNotification(`Player moved from #${fromPosition} to #${toPosition}`);
}

// ================================
// CARD FLIP ANIMATION SYSTEM
// ================================

function drawCardWithAnimation(cardData) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'card-reveal-overlay';

    const cardType = cardData.type.toLowerCase(); // 'imprevisti' or 'probabilità'

    overlay.innerHTML = `
        <div class="card-reveal">
            <div class="card-flip">
                <div class="card-face ${cardType}">
                    <div class="card-title">${cardData.type}</div>
                    <div class="card-description">${cardData.description}</div>
                    <button class="card-close-btn" onclick="closeCardReveal()">CHIUDI</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Play sound effect if available
    if (window.app && window.app.playSound) {
        window.app.playSound('card-flip');
    }

    // Add notification
    addNotification(`Carta ${cardData.type} pescata: ${cardData.description}`);

    // Auto-close after 5 seconds
    setTimeout(() => {
        if (document.querySelector('.card-reveal-overlay')) {
            closeCardReveal();
        }
    }, 5000);
}

function closeCardReveal() {
    const overlay = document.querySelector('.card-reveal-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

// Add fadeOut animation to CSS
if (!document.querySelector('#fadeOut-animation')) {
    const style = document.createElement('style');
    style.id = 'fadeOut-animation';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ================================
// GLASSMORPHISM PLAYER SIDEBAR
// ================================

function createPlayerSidebar() {
    // Remove existing sidebar
    const existing = document.getElementById('playerSidebar');
    if (existing) existing.remove();

    const sidebar = document.createElement('div');
    sidebar.id = 'playerSidebar';
    sidebar.className = 'player-sidebar';

    const currentUser = window.app?.currentUser;
    if (!currentUser) return;

    const tokenType = TOKEN_TYPES.player1; // Use first player token for current user

    sidebar.innerHTML = `
        <div class="player-sidebar-header">
            <div class="player-sidebar-icon">${tokenType.icon}</div>
            <div class="player-sidebar-info">
                <h3>${currentUser.username}</h3>
                <div class="player-balance">
                    <span class="currency">L</span> <span id="sidebarBalance">1500</span>
                </div>
            </div>
        </div>
        <div class="property-inventory">
            <div class="property-inventory-title">🏛️ PROPRIETÀ</div>
            <div id="propertyInventoryList"></div>
        </div>
    `;

    document.body.appendChild(sidebar);
    updatePlayerSidebar();
}

function updatePlayerSidebar() {
    const balanceEl = document.getElementById('sidebarBalance');
    const inventoryEl = document.getElementById('propertyInventoryList');

    if (!balanceEl || !inventoryEl) return;

    // Update balance (get from game state or API)
    const currentBalance = window.app?.currentUser?.game_balance || 1500;
    balanceEl.textContent = currentBalance;

    // Update property inventory
    if (gameProperties && gameProperties.length > 0) {
        const ownedProperties = gameProperties.filter(p =>
            p.owner_id === window.app?.currentUser?.id_univoco
        );

        if (ownedProperties.length === 0) {
            inventoryEl.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">Nessuna proprietà</div>';
            return;
        }

        inventoryEl.innerHTML = ownedProperties.map(prop => {
            const groupClass = getPropertyGroupClass(prop.color_group);
            const levelText = prop.level > 0 ? ` (Liv. ${prop.level})` : '';

            return `
                <div class="property-item ${groupClass}">
                    <div class="property-name">${prop.name}${levelText}</div>
                    <div class="property-level">Affitto: ${prop.rent} L</div>
                </div>
            `;
        }).join('');
    }
}

function getPropertyGroupClass(colorGroup) {
    const groupMap = {
        'darkblue': 'vip',
        'red': 'vip',
        'lightblue': 'tech',
        'yellow': 'tech',
        'pink': 'proposal',
        'green': 'proposal',
        'brown': 'community',
        'orange': 'community'
    };
    return groupMap[colorGroup] || 'tech';
}

// ================================
// TYPEWRITER NOTIFICATION LOG
// ================================

function createNotificationLog() {
    // Remove existing log
    const existing = document.getElementById('notificationLog');
    if (existing) existing.remove();

    const log = document.createElement('div');
    log.id = 'notificationLog';
    log.className = 'notification-log';

    log.innerHTML = `
        <div class="notification-log-title">📡 GAME LOG</div>
        <div id="notificationItems"></div>
    `;

    document.body.appendChild(log);
}

function addNotification(message, options = {}) {
    const timestamp = new Date().toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const notification = {
        message,
        timestamp,
        id: Date.now() + Math.random()
    };

    notificationLog.unshift(notification);

    // Keep only last 10 notifications
    if (notificationLog.length > 10) {
        notificationLog = notificationLog.slice(0, 10);
    }

    renderNotifications();
}

function renderNotifications() {
    const container = document.getElementById('notificationItems');
    if (!container) return;

    container.innerHTML = notificationLog.map((notif, index) => `
        <div class="notification-item ${index === 0 ? 'typing' : ''}" style="animation-delay: ${index * 0.1}s">
            <span class="notification-timestamp">[${notif.timestamp}]</span>
            <span>${notif.message}</span>
        </div>
    `).join('');

    // Auto-scroll to top
    container.scrollTop = 0;
}

// ================================
// COUNTDOWN TIMER BAR (BLITZ MODE)
// ================================

function createCountdownTimer() {
    // Remove existing timer
    const existing = document.getElementById('countdownTimer');
    if (existing) existing.remove();

    const timer = document.createElement('div');
    timer.id = 'countdownTimer';
    timer.className = 'countdown-timer-container';

    timer.innerHTML = `
        <div class="countdown-label">⏱️ BLITZ TIMER</div>
        <div class="countdown-bar-wrapper">
            <div class="countdown-bar state-safe" id="countdownBar" style="width: 100%">
                <div class="countdown-time" id="countdownTime">10s</div>
            </div>
        </div>
    `;

    document.body.appendChild(timer);
}

function startCountdownTimer(durationSeconds = 10, onComplete) {
    createCountdownTimer();

    const bar = document.getElementById('countdownBar');
    const timeDisplay = document.getElementById('countdownTime');

    if (!bar || !timeDisplay) return;

    let remainingTime = durationSeconds;
    const startTime = Date.now();
    const endTime = startTime + (durationSeconds * 1000);

    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = elapsed / (durationSeconds * 1000);
        const remaining = Math.max(0, endTime - now);

        remainingTime = Math.ceil(remaining / 1000);

        // Update progress bar
        const widthPercent = Math.max(0, (1 - progress) * 100);
        bar.style.width = `${widthPercent}%`;

        // Update time display
        timeDisplay.textContent = `${remainingTime}s`;

        // Change color based on time remaining
        bar.className = 'countdown-bar';
        if (remainingTime > 6) {
            bar.classList.add('state-safe');
        } else if (remainingTime > 3) {
            bar.classList.add('state-warning');
        } else {
            bar.classList.add('state-danger');
        }

        // Timer complete
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            addNotification('⏱️ Time expired! Auto-action triggered.');

            if (onComplete) {
                onComplete();
            }

            // Hide timer after 2 seconds
            setTimeout(() => {
                const timerEl = document.getElementById('countdownTimer');
                if (timerEl) {
                    timerEl.style.animation = 'fadeOut 0.5s ease';
                    setTimeout(() => timerEl.remove(), 500);
                }
            }, 2000);
        }
    }, 100);

    return countdownInterval;
}

function stopCountdownTimer() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    const timerEl = document.getElementById('countdownTimer');
    if (timerEl) {
        timerEl.remove();
    }
}

// ================================
// INITIALIZATION
// ================================

function initializeNeonEnhancements() {
    console.log('🎨 Initializing LUNOPOLY Neon Enhancements...');

    // Create UI components
    createPlayerSidebar();
    createNotificationLog();

    // Add initial notification
    addNotification('🎮 Welcome to LUNOPOLY Neon Edition!');
    addNotification('System initialized and ready.');

    // Create player tokens for all players
    if (window.app?.currentUser) {
        createPlayerToken('player1', window.app.currentUser);
    }

    console.log('✅ Neon enhancements loaded');
}

// ================================
// SOCKET.IO EVENT LISTENERS
// ================================

if (window.app && window.app.socket) {
    // Player moved event
    window.app.socket.on('player:moved', (data) => {
        movePlayerToken(data.playerId, data.fromPosition, data.toPosition, 800);
        addNotification(`${data.username} moved to tile #${data.toPosition}`);
    });

    // Card drawn event
    window.app.socket.on('card:drawn', (data) => {
        drawCardWithAnimation(data.card);
    });

    // Turn timer started
    window.app.socket.on('turn:timer-start', (data) => {
        startCountdownTimer(data.duration || 10, () => {
            // Auto-roll dice when timer expires
            if (window.app.socket) {
                window.app.socket.emit('game:auto-roll');
            }
        });
    });

    // Turn completed
    window.app.socket.on('turn:completed', () => {
        stopCountdownTimer();
    });

    // Property purchased
    window.app.socket.on('property:purchased', (data) => {
        addNotification(`${data.username} purchased ${data.propertyName} for ${data.price}L`);
        updatePlayerSidebar();
    });

    // Rent paid
    window.app.socket.on('rent:paid', (data) => {
        addNotification(`${data.payer} paid ${data.amount}L rent to ${data.owner}`);
        updatePlayerSidebar();
    });

    // Player bankrupt
    window.app.socket.on('player:bankrupt', (data) => {
        addNotification(`💥 ${data.username} declared bankruptcy!`);
    });

    // Game ended
    window.app.socket.on('game:ended', (data) => {
        addNotification('🏆 Game ended!');
        stopCountdownTimer();
    });
}

// ================================
// EXPORTS
// ================================

window.lunoplyNeon = {
    createPlayerToken,
    movePlayerToken,
    drawCardWithAnimation,
    addNotification,
    startCountdownTimer,
    stopCountdownTimer,
    updatePlayerSidebar,
    initializeNeonEnhancements
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNeonEnhancements);
} else {
    initializeNeonEnhancements();
}
