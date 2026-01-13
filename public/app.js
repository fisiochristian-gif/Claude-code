// ================================
// LUNC HORIZON - Main Application
// ================================

const API_BASE = window.location.origin;
let socket = null;
let currentUser = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// User Display Elements
const userIdDisplay = document.getElementById('userIdDisplay');
const usernameDisplay = document.getElementById('usernameDisplay');
const creditsDisplay = document.getElementById('creditsDisplay');
const connectionStatus = document.getElementById('connectionStatus');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const modules = document.querySelectorAll('.module');

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkExistingSession();
});

function initializeApp() {
    console.log('🚀 LUNC HORIZON - Initializing...');
}

function setupEventListeners() {
    // Login
    loginBtn.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const module = item.dataset.module;
            switchModule(module);
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

        // Save to localStorage
        localStorage.setItem('luncHorizonUser', JSON.stringify(user));

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

    loginScreen.classList.add('active');
    mainApp.classList.remove('active');

    usernameInput.value = '';
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
    loadLeaderboard();

    // Initialize first module (DASHBOARD)
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
}

function updateUserDisplay() {
    if (currentUser) {
        usernameDisplay.textContent = currentUser.username;
        creditsDisplay.textContent = currentUser.crediti || 0;

        // Update points display
        const puntiDisplay = document.getElementById('puntiDisplay');
        if (puntiDisplay) {
            puntiDisplay.textContent = currentUser.punti_classifica || 0;
        }

        // Update capital display
        const capital = currentUser.total_deposited_lunc || 0;
        const capitalDisplayElement = document.getElementById('capitalDisplay');
        if (capitalDisplayElement) {
            capitalDisplayElement.textContent = formatNumberDisplay(capital);
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
        connectionStatus.style.background = '#00ff00';

        // Join with user data
        socket.emit('user:join', currentUser);
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        connectionStatus.style.background = '#ff0000';
    });

    socket.on('credits:updated', (data) => {
        if (currentUser) {
            currentUser.crediti = data.crediti;
            creditsDisplay.textContent = data.crediti;

            // Update points if provided
            if (data.punti_classifica !== undefined) {
                currentUser.punti_classifica = data.punti_classifica;
                const puntiDisplay = document.getElementById('puntiDisplay');
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
// NAVIGATION
// ================================

function switchModule(moduleName) {
    // Update nav items
    navItems.forEach(item => {
        if (item.dataset.module === moduleName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update modules
    modules.forEach(module => {
        module.classList.remove('active');
    });

    const targetModule = document.getElementById(`${moduleName}Module`);
    if (targetModule) {
        targetModule.classList.add('active');

        // Initialize module-specific functionality
        if (moduleName === 'dashboard' && typeof initializeDashboard === 'function') {
            initializeDashboard();
        } else if (moduleName === 'lunopoly' && typeof initializeLunopoly === 'function') {
            initializeLunopoly();
        } else if (moduleName === 'social' && typeof initializeSocial === 'function') {
            initializeSocial();
        } else if (moduleName === 'socialearn' && typeof initializeSocialEarn === 'function') {
            initializeSocialEarn();
        } else if (moduleName === 'blog' && typeof loadBlogFeed === 'function') {
            loadBlogFeed();
        } else if (moduleName === 'leaderboard') {
            loadLeaderboard();
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

// Export for module access
window.app = {
    socket,
    currentUser,
    API_BASE,
    formatTimestamp
};
