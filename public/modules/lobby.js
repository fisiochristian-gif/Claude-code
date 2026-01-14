// ================================
// LOBBY & MATCHMAKING MODULE
// ================================

let currentTableId = null;
let countdownInterval = null;
let lobbyUpdateInterval = null;

async function initializeLobby() {
    console.log('🎮 Initializing Lobby...');

    setupLobbyButtons();
    loadLobbyStatus();

    // Poll lobby status every 2 seconds
    lobbyUpdateInterval = setInterval(loadLobbyStatus, 2000);

    // Listen for Socket.IO lobby events
    setupLobbySocketListeners();
}

function setupLobbyButtons() {
    const joinLobbyBtn = document.getElementById('joinLobbyBtn');
    const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');

    if (joinLobbyBtn) {
        joinLobbyBtn.addEventListener('click', handleJoinLobby);
    }

    if (leaveLobbyBtn) {
        leaveLobbyBtn.addEventListener('click', handleLeaveLobby);
    }
}

async function handleJoinLobby() {
    if (!window.app.currentUser) {
        alert('Devi essere autenticato per entrare nella lobby');
        return;
    }

    const joinBtn = document.getElementById('joinLobbyBtn');
    if (joinBtn) joinBtn.disabled = true;

    try {
        const response = await fetch(`${window.app.API_BASE}/api/lobby/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: window.app.currentUser.id_univoco })
        });

        const result = await response.json();

        if (!response.ok) {
            showLobbyToast(`❌ ${result.error}`, 'error');
            if (joinBtn) joinBtn.disabled = false;
            return;
        }

        currentTableId = result.tableId;

        // Update user credits
        window.app.currentUser.crediti -= 50;
        const creditsDisplay = document.getElementById('creditsDisplay');
        if (creditsDisplay) creditsDisplay.textContent = window.app.currentUser.crediti;

        showLobbyToast(`✅ ${result.message}`, 'success');

        // Show lobby overlay
        showLobbyOverlay();

        // Load lobby status
        await loadLobbyStatus();

    } catch (error) {
        console.error('Join lobby error:', error);
        showLobbyToast('❌ Errore durante il join', 'error');
        if (joinBtn) joinBtn.disabled = false;
    }
}

async function handleLeaveLobby() {
    if (!window.app.currentUser || !currentTableId) {
        return;
    }

    const confirmLeave = confirm('Vuoi davvero uscire dalla lobby? I tuoi 50 Crediti verranno rimborsati.');
    if (!confirmLeave) return;

    try {
        const response = await fetch(`${window.app.API_BASE}/api/lobby/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: window.app.currentUser.id_univoco })
        });

        const result = await response.json();

        if (!response.ok) {
            showLobbyToast(`❌ ${result.error}`, 'error');
            return;
        }

        // Update user credits
        window.app.currentUser.crediti += 50;
        const creditsDisplay = document.getElementById('creditsDisplay');
        if (creditsDisplay) creditsDisplay.textContent = window.app.currentUser.crediti;

        showLobbyToast(`✅ ${result.message}`, 'success');

        // Hide lobby overlay
        hideLobbyOverlay();
        currentTableId = null;

        // Re-enable join button
        const joinBtn = document.getElementById('joinLobbyBtn');
        if (joinBtn) joinBtn.disabled = false;

    } catch (error) {
        console.error('Leave lobby error:', error);
        showLobbyToast('❌ Errore durante l\'uscita', 'error');
    }
}

async function loadLobbyStatus() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/lobby/tables`);
        const tables = await response.json();

        updateLobbyDisplay(tables);

    } catch (error) {
        console.error('Load lobby status error:', error);
    }
}

function updateLobbyDisplay(tables) {
    const activeTables = tables.filter(t => t.status === 'waiting' || t.status === 'starting').length;
    const activeTablesDisplay = document.getElementById('activeTablesCount');
    if (activeTablesDisplay) {
        activeTablesDisplay.textContent = `${activeTables}/2`;
    }

    // Find user's table
    if (window.app.currentUser && currentTableId) {
        const userTable = tables.find(t => t.table_id === currentTableId);

        if (userTable) {
            const playerCountDisplay = document.getElementById('lobbyPlayerCount');
            if (playerCountDisplay) {
                playerCountDisplay.textContent = `${userTable.player_count}/5`;
            }

            // Update player list
            const playerListDiv = document.getElementById('lobbyPlayerList');
            if (playerListDiv && userTable.players) {
                playerListDiv.innerHTML = userTable.players.map((player, index) => `
                    <div class="lobby-player-item ${player.isBot ? 'bot-player' : 'human-player'}">
                        <span class="player-number">${index + 1}.</span>
                        <span class="player-name">${player.username}</span>
                        ${player.isBot ? '<span class="bot-badge">BOT</span>' : ''}
                        ${player.buyInPaid ? '<span class="paid-badge">✅</span>' : '<span class="pending-badge">⏳</span>'}
                    </div>
                `).join('');
            }

            // Update countdown
            if (userTable.countdown_started_at) {
                updateCountdownDisplay(userTable.countdown_started_at);
            }

            // If game started, redirect to game
            if (userTable.status === 'active') {
                showLobbyToast('🎮 Partita iniziata!', 'success');
                setTimeout(() => {
                    hideLobbyOverlay();
                    // The game will load automatically
                }, 2000);
            }
        }
    }
}

function updateCountdownDisplay(startedAt) {
    const countdownDisplay = document.getElementById('lobbyCountdown');
    if (!countdownDisplay) return;

    // Clear existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const COUNTDOWN_DURATION = 5 * 60 * 1000; // 5 minutes
    const startTime = new Date(startedAt).getTime();

    countdownInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = COUNTDOWN_DURATION - elapsed;

        if (remaining <= 0) {
            countdownDisplay.textContent = '00:00';
            clearInterval(countdownInterval);
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        countdownDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function showLobbyOverlay() {
    const overlay = document.getElementById('lobbyOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLobbyOverlay() {
    const overlay = document.getElementById('lobbyOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }

    // Clear countdown interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function setupLobbySocketListeners() {
    if (!window.socket) return;

    // Lobby update
    window.socket.on('lobby:update', (data) => {
        console.log('📢 Lobby update:', data);
        loadLobbyStatus();
    });

    // Countdown started
    window.socket.on('lobby:countdown-started', (data) => {
        console.log('⏱️ Countdown started:', data);
        if (data.tableId === currentTableId) {
            updateCountdownDisplay(data.startedAt);
        }
    });

    // Bots added
    window.socket.on('lobby:bots-added', (data) => {
        console.log('🤖 Bots added:', data);
        if (data.tableId === currentTableId) {
            showLobbyToast(`🤖 ${data.botsAdded} bot aggiunti al tavolo!`, 'info');
            loadLobbyStatus();
        }
    });

    // Game started
    window.socket.on('game:started', (data) => {
        console.log('🎮 Game started:', data);
        if (data.tableId === currentTableId) {
            showLobbyToast('🎮 Partita iniziata!', 'success');
            setTimeout(() => {
                hideLobbyOverlay();
                // Reload game to show new state
                if (typeof initializeLunopoly === 'function') {
                    initializeLunopoly();
                }
            }, 2000);
        }
    });
}

function showLobbyToast(message, type = 'info') {
    // Reuse the toast system from mission.js if available
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        alert(message);
    }
}

// Cleanup on page change
function cleanupLobby() {
    if (lobbyUpdateInterval) {
        clearInterval(lobbyUpdateInterval);
        lobbyUpdateInterval = null;
    }

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Export functions
window.initializeLobby = initializeLobby;
window.cleanupLobby = cleanupLobby;
window.handleJoinLobby = handleJoinLobby;
window.handleLeaveLobby = handleLeaveLobby;
