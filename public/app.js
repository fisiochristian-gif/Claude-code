// ================================
// LUNC HORIZON - Main Application
// Hub-Based Navigation System
// ================================

const API_BASE = window.location.origin;
let socket = null;
let currentUser = null;
let currentPage = 'hub';

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const homeBtn = document.getElementById('homeBtn');

// User Display Elements
const idDisplay = document.getElementById('idDisplay');
const creditsDisplay = document.getElementById('creditsDisplay');
const puntiDisplay = document.getElementById('puntiDisplay');
const capitalDisplay = document.getElementById('capitalDisplay');
const hubUsername = document.getElementById('hubUsername');
const connectionStatus = document.getElementById('connectionStatus');

// Page Containers
const hubScreen = document.getElementById('hubScreen');
const stakingPage = document.getElementById('stakingPage');
const gameCenterPage = document.getElementById('gameCenterPage');
const socialRewardsPage = document.getElementById('socialRewardsPage');
const rdInsightsPage = document.getElementById('rdInsightsPage');
const socialPage = document.getElementById('socialPage');
const missionPage = document.getElementById('missionPage');
const manualPage = document.getElementById('manualPage');

// Hub Cards (will be dynamically generated)
let hubCards = [];

// Tabs
const tabButtons = document.querySelectorAll('.tab-button');

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkExistingSession();
});

function initializeApp() {
    console.log('🚀 LUNC HORIZON - Hub-Based Navigation Initialized');
}

function setupEventListeners() {
    // Login
    loginBtn.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Home Button
    homeBtn.addEventListener('click', () => {
        switchPage('hub');
    });

    // Help Button
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            switchPage('manual');
        });
    }

    // Tab Navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            const parentContainer = button.closest('.page-content');
            if (parentContainer && tabName) {
                switchTab(parentContainer, tabName);
            }
        });
    });
}

// ================================
// AUTHENTICATION
// ================================

async function handleLogin() {
    const username = usernameInput.value.trim();

    if (!username) {
        showError(loginError, 'Inserisci un username valido');
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>CONNESSIONE...</span>';

        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            throw new Error('Errore di connessione');
        }

        const user = await response.json();
        currentUser = user;

        // Save user and session token to localStorage
        localStorage.setItem('luncHorizonUser', JSON.stringify(user));

        if (user.sessionToken) {
            localStorage.setItem('lunc_session_token', user.sessionToken);

            // Start session heartbeat
            if (window.sessionRecovery) {
                window.sessionRecovery.startHeartbeat(user.sessionToken);
            }
        }

        // Initialize Socket.IO
        initializeSocket();

        // Show main app
        showMainApp();

    } catch (error) {
        console.error('Login error:', error);
        showError(loginError, 'Errore durante il login. Riprova.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>CONNETTI</span>';
    }
}

function handleLogout() {
    if (socket) {
        socket.disconnect();
    }

    currentUser = null;
    localStorage.removeItem('luncHorizonUser');

    // Clear session and stop heartbeat
    if (window.sessionRecovery) {
        window.sessionRecovery.clearSession();
        window.sessionRecovery.stopHeartbeat();
    }

    loginScreen.classList.add('active');
    mainApp.classList.remove('active');

    usernameInput.value = '';
    currentPage = 'hub';
}

function checkExistingSession() {
    const savedUser = localStorage.getItem('luncHorizonUser');

    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            initializeSocket();
            showMainApp();
        } catch (error) {
            console.error('Session restore error:', error);
            localStorage.removeItem('luncHorizonUser');
        }
    }
}

function showMainApp() {
    loginScreen.classList.remove('active');
    mainApp.classList.add('active');

    updateUserDisplay();

    // Show Hub by default
    switchPage('hub');

    // Initialize RD Station Hub
    if (typeof initializeRDStationHub === 'function') {
        initializeRDStationHub();
    }
}

function updateUserDisplay() {
    if (currentUser) {
        // Header stats
        if (idDisplay) {
            const shortId = currentUser.id_univoco.substring(0, 8);
            idDisplay.textContent = shortId;
        }
        if (creditsDisplay) {
            creditsDisplay.textContent = currentUser.crediti || 0;
        }
        if (puntiDisplay) {
            puntiDisplay.textContent = currentUser.punti_classifica || 0;
        }
        if (capitalDisplay) {
            const capital = currentUser.total_deposited_lunc || 0;
            capitalDisplay.textContent = formatNumberDisplay(capital);
        }

        // Hub username
        if (hubUsername) {
            hubUsername.textContent = currentUser.username;
        }
    }
}

function formatNumberDisplay(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toLocaleString('it-IT');
}

// ================================
// SOCKET.IO
// ================================

function initializeSocket() {
    socket = io(API_BASE);

    socket.on('connect', () => {
        console.log('✅ Socket connected');
        if (connectionStatus) {
            connectionStatus.style.background = '#00ff00';
        }

        // Join with user data
        socket.emit('user:join', currentUser);
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        if (connectionStatus) {
            connectionStatus.style.background = '#ff0000';
        }
    });

    socket.on('credits:updated', (data) => {
        if (currentUser) {
            currentUser.crediti = data.crediti;
            if (creditsDisplay) {
                creditsDisplay.textContent = data.crediti;
            }

            // Update points if provided
            if (data.punti_classifica !== undefined) {
                currentUser.punti_classifica = data.punti_classifica;
                if (puntiDisplay) {
                    puntiDisplay.textContent = data.punti_classifica;
                }
            }

            localStorage.setItem('luncHorizonUser', JSON.stringify(currentUser));
        }
    });

    socket.on('user:joined', (data) => {
        console.log(`👤 ${data.username} si è unito (Total: ${data.totalPlayers})`);
    });

    // Game events
    socket.on('game:rolled', (data) => {
        if (typeof handleGameRoll === 'function') {
            handleGameRoll(data);
        }
    });

    socket.on('game:purchased', (data) => {
        if (typeof handleGamePurchase === 'function') {
            handleGamePurchase(data);
        }
    });

    socket.on('game:error', (data) => {
        console.error('Game error:', data.message);
        alert(data.message);
    });

    // Chat events
    socket.on('chat:message', (data) => {
        if (typeof handleChatMessage === 'function') {
            handleChatMessage(data);
        }
    });

    socket.on('chat:history', (data) => {
        if (typeof loadChatHistory === 'function') {
            loadChatHistory(data);
        }
    });

    socket.on('chat:error', (data) => {
        alert(data.message);
    });
}

// ================================
// HUB-BASED NAVIGATION
// ================================

function switchPage(pageName) {
    console.log(`🔄 Switching to page: ${pageName}`);

    // Hide all pages
    const pages = [hubScreen, stakingPage, gameCenterPage, socialRewardsPage, rdInsightsPage, socialPage, missionPage, manualPage];
    pages.forEach(page => {
        if (page) {
            page.classList.remove('active');
        }
    });

    // Show target page
    currentPage = pageName;

    switch(pageName) {
        case 'hub':
            if (hubScreen) hubScreen.classList.add('active');
            // Refresh hub data
            if (typeof refreshRDStationHub === 'function') {
                refreshRDStationHub();
            }
            break;

        case 'staking':
        case 'dashboard':
            if (stakingPage) stakingPage.classList.add('active');
            // Initialize dashboard tab by default
            switchTab(stakingPage, 'dashboard');
            if (typeof initializeDashboard === 'function') {
                initializeDashboard();
            }
            break;

        case 'game-center':
        case 'lobby':
            if (gameCenterPage) gameCenterPage.classList.add('active');
            // Initialize game and lobby
            if (typeof initializeLunopoly === 'function') {
                initializeLunopoly();
            }
            if (typeof initializeLobby === 'function') {
                initializeLobby();
            }
            break;

        case 'social-rewards':
        case 'social-tasks':
            if (socialRewardsPage) socialRewardsPage.classList.add('active');
            // Initialize social tasks module
            if (typeof initializeSocialTasks === 'function') {
                initializeSocialTasks();
            }
            break;

        case 'rd-insights':
            if (rdInsightsPage) rdInsightsPage.classList.add('active');
            break;

        case 'social':
            if (socialPage) socialPage.classList.add('active');
            // Initialize social module
            if (typeof initializeSocial === 'function') {
                initializeSocial();
            }
            break;

        case 'mission':
            if (missionPage) missionPage.classList.add('active');
            // Initialize Mission Control (Blog + Social-to-Earn + Leaderboard)
            if (typeof initializeMissionControl === 'function') {
                initializeMissionControl();
            }
            break;

        case 'manual':
            if (manualPage) manualPage.classList.add('active');
            // Render Station Manual
            if (window.stationManual && typeof window.stationManual.render === 'function') {
                window.stationManual.render();
            }
            break;
    }
}

function switchTab(container, tabName) {
    console.log(`📑 Switching to tab: ${tabName}`);

    // Update tab buttons
    const tabs = container.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update tab content
    const contents = container.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    const targetContent = container.querySelector(`#${tabName}Tab`);
    if (targetContent) {
        targetContent.classList.add('active');

        // Initialize module-specific functionality
        if (tabName === 'dashboard' && typeof initializeDashboard === 'function') {
            initializeDashboard();
        } else if (tabName === 'game') {
            if (typeof initializeLunopoly === 'function') {
                initializeLunopoly();
            }
            if (typeof initializeLobby === 'function') {
                initializeLobby();
            }
        } else if (tabName === 'leaderboard') {
            loadLeaderboard();
        } else if (tabName === 'socialearn' && typeof initializeSocialEarn === 'function') {
            initializeSocialEarn();
        } else if (tabName === 'blog' && typeof loadBlogFeed === 'function') {
            loadBlogFeed();
        }
    }
}

// ================================
// LEADERBOARD
// ================================

async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/leaderboard`);
        const leaderboard = await response.json();

        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        leaderboard.forEach((entry, index) => {
            const tr = document.createElement('tr');
            const rankClass = index === 0 ? 'rank-1' : '';

            tr.innerHTML = `
                <td class="${rankClass}">#${index + 1}</td>
                <td class="${rankClass}">${entry.username}</td>
                <td class="${rankClass}">${entry.punti_classifica} Punti</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Leaderboard error:', error);
    }
}

// ================================
// UTILITIES
// ================================

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
        element.classList.remove('show');
    }, 3000);
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Navigation helper function for other modules
function navigateTo(pageName) {
    switchPage(pageName);
}

// Export for module access
window.app = {
    socket,
    currentUser,
    API_BASE,
    formatTimestamp,
    formatNumberDisplay,
    switchPage,
    switchTab,
    navigateTo,
    updateUserDisplay
};
