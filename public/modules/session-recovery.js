// ================================
// SESSION RECOVERY MODULE
// Handles reconnection and session persistence
// ================================

let reconnectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
let heartbeatTimer = null;

// ================================
// INITIALIZATION
// ================================

function initializeSessionRecovery() {
  console.log('🔄 Session Recovery module initialized');

  // Check for existing session on page load
  const savedSession = localStorage.getItem('lunc_session_token');
  const savedUser = localStorage.getItem('luncHorizonUser');

  if (savedSession && savedUser) {
    attemptReconnection(savedSession, JSON.parse(savedUser));
  }

  // Start heartbeat if we have a session
  if (savedSession) {
    startHeartbeat(savedSession);
  }

  // Listen for reconnection events from server
  setupReconnectionListeners();
}

// ================================
// SESSION STORAGE
// ================================

function saveSession(sessionToken, user) {
  localStorage.setItem('lunc_session_token', sessionToken);
  localStorage.setItem('luncHorizonUser', JSON.stringify(user));
  console.log('💾 Session saved');
}

function clearSession() {
  localStorage.removeItem('lunc_session_token');
  console.log('🗑️ Session cleared');
}

// ================================
// RECONNECTION LOGIC
// ================================

async function attemptReconnection(sessionToken, user) {
  try {
    console.log(`🔄 Attempting reconnection (attempt ${reconnectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);

    showReconnectionUI('Riconnessione in corso...');

    const response = await fetch(`${window.app.API_BASE}/api/session/reconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        userId: user.id_univoco,
        tableId: user.currentTableId || null
      })
    });

    if (!response.ok) {
      throw new Error('Sessione non valida');
    }

    const data = await response.json();

    console.log('✅ Reconnection successful!', data);

    // Update user data
    window.app.currentUser = data.user;

    // If reconnecting to a game, restore game state
    if (data.gameSnapshot) {
      restoreGameState(data.gameSnapshot);
    }

    // Rejoin via socket
    if (window.app.socket) {
      window.app.socket.emit('user:join', {
        ...data.user,
        sessionToken
      });
    }

    hideReconnectionUI();
    showReconnectionSuccess();

    reconnectionAttempts = 0;

  } catch (error) {
    console.error('Reconnection error:', error);
    reconnectionAttempts++;

    if (reconnectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      // Retry with exponential backoff
      const delay = Math.pow(2, reconnectionAttempts) * 1000;
      setTimeout(() => {
        attemptReconnection(sessionToken, user);
      }, delay);
    } else {
      // Max attempts reached
      showReconnectionFailed();
      clearSession();
    }
  }
}

// ================================
// GAME STATE RESTORATION
// ================================

function restoreGameState(snapshot) {
  console.log('🎮 Restoring game state:', snapshot);

  // Update player position
  if (snapshot.playerState) {
    updatePlayerUI(snapshot.playerState);
  }

  // Restore all players on board
  if (snapshot.allPlayers) {
    snapshot.allPlayers.forEach(player => {
      updatePlayerToken(player);
    });
  }

  // Restore properties
  if (snapshot.properties) {
    updatePropertiesUI(snapshot.properties);
  }

  // Restore active timers
  if (snapshot.activeTimers && snapshot.activeTimers.length > 0) {
    snapshot.activeTimers.forEach(timer => {
      showActiveTimer(timer);
    });
  }

  // Show reconnection notification
  showNotification('🔄 Benvenuto! Sei stato riconnesso alla partita.', 'success');
}

function updatePlayerUI(playerState) {
  // Update balance display
  const balanceDisplay = document.getElementById('gameBalanceDisplay');
  if (balanceDisplay) {
    balanceDisplay.textContent = `${playerState.game_balance} L`;
  }

  // Update position
  if (window.movePlayerTo) {
    window.movePlayerTo(window.app.currentUser.id_univoco, playerState.position);
  }
}

function updatePlayerToken(player) {
  if (window.updatePlayerPosition) {
    window.updatePlayerPosition(player.player_id, player.position);
  }
}

function updatePropertiesUI(properties) {
  // Update property ownership indicators
  properties.forEach(prop => {
    if (window.updatePropertyOwnership) {
      window.updatePropertyOwnership(prop.id, prop.owner_id);
    }
  });
}

function showActiveTimer(timer) {
  const now = new Date();
  const expiresAt = new Date(timer.expires_at);
  const remainingMs = expiresAt.getTime() - now.getTime();

  if (remainingMs > 0) {
    console.log(`⏰ Syncing timer: ${timer.timer_type} (${Math.floor(remainingMs / 1000)}s remaining)`);

    // Emit timer sync event
    if (window.app.socket) {
      window.app.socket.emit('timer:sync', {
        timerId: timer.id,
        timerType: timer.timer_type,
        remainingMs
      });
    }
  }
}

// ================================
// HEARTBEAT SYSTEM
// ================================

function startHeartbeat(sessionToken) {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  heartbeatTimer = setInterval(async () => {
    try {
      await fetch(`${window.app.API_BASE}/api/session/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, HEARTBEAT_INTERVAL);

  console.log('💓 Heartbeat started');
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.log('💓 Heartbeat stopped');
  }
}

// ================================
// UI NOTIFICATIONS
// ================================

function showReconnectionUI(message) {
  let overlay = document.getElementById('reconnectionOverlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'reconnectionOverlay';
    overlay.className = 'reconnection-overlay';
    overlay.innerHTML = `
      <div class="reconnection-card">
        <div class="reconnection-spinner"></div>
        <div class="reconnection-message">${message}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector('.reconnection-message').textContent = message;
    overlay.style.display = 'flex';
  }
}

function hideReconnectionUI() {
  const overlay = document.getElementById('reconnectionOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showReconnectionSuccess() {
  showNotification('✅ Riconnessione completata!', 'success');
}

function showReconnectionFailed() {
  showNotification('❌ Riconnessione fallita. Effettua nuovamente il login.', 'error');
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// ================================
// SOCKET EVENT LISTENERS
// ================================

function setupReconnectionListeners() {
  if (window.app && window.app.socket) {
    // Listen for session reconnected event
    window.app.socket.on('session:reconnected', (data) => {
      console.log('📡 Session reconnected:', data);

      if (data.snapshot) {
        restoreGameState(data.snapshot);
      }

      showNotification(data.message || 'Riconnessione completata!', 'success');
    });

    // Listen for player reconnected (other players)
    window.app.socket.on('player:reconnected', (data) => {
      console.log('📡 Player reconnected:', data);
      showNotification(`${data.username} si è riconnesso`, 'info');
    });

    // Handle disconnect
    window.app.socket.on('disconnect', () => {
      console.log('📡 Socket disconnected');
      showNotification('Connessione persa. Tentativo di riconnessione...', 'warning');

      // Attempt to reconnect automatically
      const sessionToken = localStorage.getItem('lunc_session_token');
      const savedUser = localStorage.getItem('luncHorizonUser');

      if (sessionToken && savedUser) {
        setTimeout(() => {
          attemptReconnection(sessionToken, JSON.parse(savedUser));
        }, 2000);
      }
    });

    // Handle reconnect (socket.io automatic reconnection)
    window.app.socket.on('reconnect', () => {
      console.log('📡 Socket reconnected');
      const sessionToken = localStorage.getItem('lunc_session_token');
      const savedUser = localStorage.getItem('luncHorizonUser');

      if (sessionToken && savedUser) {
        attemptReconnection(sessionToken, JSON.parse(savedUser));
      }
    });
  }
}

// ================================
// EXPORTS
// ================================

window.sessionRecovery = {
  initialize: initializeSessionRecovery,
  saveSession,
  clearSession,
  startHeartbeat,
  stopHeartbeat
};

// Auto-initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSessionRecovery);
} else {
  initializeSessionRecovery();
}
