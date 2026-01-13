// ================================
// DASHBOARD MODULE
// Economic overview and LUNC deposits
// ================================

// DOM Elements
const userCapitalDisplay = document.getElementById('userCapitalDisplay');
const userCreditsDisplayDash = document.getElementById('userCreditsDisplay');
const depositAmountInput = document.getElementById('depositAmountInput');
const depositBtn = document.getElementById('depositBtn');
const depositStatus = document.getElementById('depositStatus');

// Global Stats Elements
const globalStakingPool = document.getElementById('globalStakingPool');
const fondoPremi = document.getElementById('fondoPremi');
const totalBurned = document.getElementById('totalBurned');
const currentAPR = document.getElementById('currentAPR');

// Header Capital Display
const capitalDisplay = document.getElementById('capitalDisplay');

let dashboardInitialized = false;
let globalStats = null;

// ================================
// INITIALIZATION
// ================================

async function initializeDashboard() {
    console.log('📊 Initializing DASHBOARD...');

    if (!dashboardInitialized) {
        setupDashboardEvents();
        await loadGlobalStats();
        updateUserStats();

        // Auto-refresh global stats every 10 seconds
        setInterval(loadGlobalStats, 10000);

        dashboardInitialized = true;
    } else {
        // Just update stats when revisiting
        updateUserStats();
        await loadGlobalStats();
    }
}

function setupDashboardEvents() {
    depositBtn.addEventListener('click', handleDeposit);

    depositAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleDeposit();
        }
    });
}

// ================================
// USER STATS
// ================================

function updateUserStats() {
    if (!window.app.currentUser) return;

    const capital = window.app.currentUser.total_deposited_lunc || 0;
    const crediti = window.app.currentUser.crediti || 0;

    // Update dashboard cards
    userCapitalDisplay.textContent = formatNumber(capital);
    userCreditsDisplayDash.textContent = formatNumber(crediti);

    // Update header
    capitalDisplay.textContent = formatNumber(capital);
}

// ================================
// GLOBAL STATS
// ================================

async function loadGlobalStats() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/stats/global`);
        if (!response.ok) throw new Error('Failed to load stats');

        globalStats = await response.json();

        // Update global stats display
        globalStakingPool.textContent = formatNumber(globalStats.total_staking_pool || 0);
        fondoPremi.textContent = formatNumber(globalStats.fondo_premi || 0);
        totalBurned.textContent = formatNumber(globalStats.total_burned_from_yield || 0);
        currentAPR.textContent = (globalStats.current_apr_rate || 5.0).toFixed(1);

        console.log('✅ Global stats loaded');

    } catch (error) {
        console.error('Error loading global stats:', error);
    }
}

// ================================
// DEPOSIT LUNC
// ================================

async function handleDeposit() {
    const amount = parseInt(depositAmountInput.value);

    if (!amount || isNaN(amount)) {
        showDepositStatus('Inserisci un importo valido', 'error');
        return;
    }

    if (amount < 100000) {
        showDepositStatus('Deposito minimo: 100,000 LUNC', 'error');
        return;
    }

    if (amount % 100000 !== 0) {
        showDepositStatus('Il deposito deve essere in multipli di 100,000 LUNC', 'error');
        return;
    }

    if (!window.app.currentUser) {
        showDepositStatus('Utente non autenticato', 'error');
        return;
    }

    try {
        depositBtn.disabled = true;
        depositBtn.innerHTML = '<span>PROCESSANDO...</span>';

        const response = await fetch(`${window.app.API_BASE}/api/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.app.currentUser.id_univoco,
                amountLUNC: amount,
                txHash: `sim_${Date.now()}` // Simulated transaction hash
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Errore durante il deposito');
        }

        // Update local user data
        window.app.currentUser.total_deposited_lunc = (window.app.currentUser.total_deposited_lunc || 0) + amount;
        window.app.currentUser.crediti += result.creditiMinted;

        // Save to localStorage
        localStorage.setItem('luncHorizonUser', JSON.stringify(window.app.currentUser));

        // Update displays
        updateUserStats();
        await loadGlobalStats();

        // Show success message
        showDepositStatus(
            `✅ Deposito completato! ${formatNumber(result.creditiMinted)} Crediti mintati`,
            'success'
        );

        // Update credits display in header
        document.getElementById('creditsDisplay').textContent = window.app.currentUser.crediti;

        // Clear input
        depositAmountInput.value = '';

    } catch (error) {
        console.error('Deposit error:', error);
        showDepositStatus(error.message || 'Errore durante il deposito', 'error');
    } finally {
        depositBtn.disabled = false;
        depositBtn.innerHTML = '<span>DEPOSITA LUNC</span>';
    }
}

function showDepositStatus(message, type) {
    depositStatus.textContent = message;
    depositStatus.className = `status-message show ${type}`;

    setTimeout(() => {
        depositStatus.classList.remove('show');
    }, 5000);
}

// ================================
// SOCKET.IO EVENTS
// ================================

// Listen for global deposit events
if (window.app && window.app.socket) {
    window.app.socket.on('deposit:completed', (data) => {
        console.log('💰 New deposit detected:', data);
        // Reload global stats when someone deposits
        loadGlobalStats();
    });

    window.app.socket.on('apr:distributed', (data) => {
        console.log('📊 APR distributed:', data);
        // Reload global stats when APR is distributed
        loadGlobalStats();

        // Show notification
        alert(`APR Distribuito!\n\nTotale: ${formatNumber(data.totalAPR)} LUNC\n🏆 Fondo Premi: ${formatNumber(data.fondoPremi)}\n🔥 Burn: ${formatNumber(data.burnAmount)}\n⚙️ Sviluppo: ${formatNumber(data.sviluppo)}\n👤 Creator: ${formatNumber(data.creator)}`);
    });
}

// ================================
// UTILITIES
// ================================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toLocaleString('it-IT');
}

// ================================
// EXPORTS
// ================================

window.initializeDashboard = initializeDashboard;
window.loadGlobalStats = loadGlobalStats;
