// ================================
// STAKING SETUP & ONBOARDING
// User strategy configuration system
// ================================

let stakingSetupInitialized = false;
let calculationInterval = null;

// Predefined Staking Tiers
const STAKING_TIERS = {
    bronze: {
        name: 'Bronze Cadet',
        amount: 100000,
        icon: '🥉',
        color: '#CD7F32',
        description: 'Entry-level strategy for new commanders'
    },
    silver: {
        name: 'Silver Lieutenant',
        amount: 500000,
        icon: '🥈',
        color: '#C0C0C0',
        description: 'Intermediate strategy with solid returns'
    },
    gold: {
        name: 'Gold Commander',
        amount: 1000000,
        icon: '🥇',
        color: '#FFD700',
        description: 'Advanced strategy for experienced commanders'
    },
    whale: {
        name: 'Whale Admiral',
        amount: 5000000,
        icon: '🐋',
        color: '#00FFFF',
        description: 'Elite strategy for maximum yield'
    }
};

// ================================
// INITIALIZATION
// ================================

function initializeStakingSetup() {
    if (stakingSetupInitialized) return;

    console.log('💎 Initializing Staking Setup...');

    renderStakingSetupForm();
    setupStakingListeners();
    checkExistingStrategy();

    stakingSetupInitialized = true;
}

// ================================
// SETUP FORM RENDERING
// ================================

function renderStakingSetupForm() {
    const setupContainer = document.getElementById('stakingSetupContainer');
    if (!setupContainer) {
        console.warn('Staking setup container not found');
        return;
    }

    setupContainer.innerHTML = `
        <div class="staking-setup-panel">
            <!-- Header -->
            <div class="setup-header">
                <h2 class="setup-title">
                    <span class="setup-icon">🚀</span>
                    Setup Your Strategy
                </h2>
                <p class="setup-subtitle">
                    Configure your LUNC staking simulation to activate daily credit minting
                </p>
            </div>

            <!-- Tier Selection -->
            <div class="tier-selection">
                <h3 class="section-title">Choose Your Tier</h3>
                <div class="tier-grid">
                    ${renderTierCards()}
                </div>
            </div>

            <!-- Custom Amount -->
            <div class="custom-amount-section">
                <h3 class="section-title">Or Enter Custom Amount</h3>
                <div class="custom-input-group">
                    <div class="input-with-icon">
                        <span class="input-icon">🌕</span>
                        <input
                            type="number"
                            id="customLuncInput"
                            class="lunc-input"
                            placeholder="Enter LUNC amount"
                            min="100000"
                            step="100000"
                        >
                        <span class="input-suffix">LUNC</span>
                    </div>
                    <p class="input-note">
                        Minimum: 100,000 LUNC (multiples of 100,000)
                    </p>
                </div>
            </div>

            <!-- Real-Time Calculator -->
            <div class="yield-calculator" id="yieldCalculator">
                <div class="calculator-header">
                    <h3 class="calculator-title">
                        <span class="calc-icon">📊</span>
                        Yield Projection
                    </h3>
                    <span class="calc-badge">Real-Time</span>
                </div>

                <div class="calculator-results" id="calculatorResults">
                    <div class="calc-placeholder">
                        <span class="placeholder-icon">💡</span>
                        <p>Select a tier or enter an amount to see your yield projection</p>
                    </div>
                </div>
            </div>

            <!-- Disclaimer -->
            <div class="strategy-disclaimer">
                <div class="disclaimer-icon">⚠️</div>
                <div class="disclaimer-content">
                    <p class="disclaimer-title">Strategy Simulation</p>
                    <p class="disclaimer-text">
                        This simulation is provided by <strong>Rendite Digitali</strong> for educational
                        and strategic planning purposes. Credits are dApp currency for gaming and social
                        features. <strong>This is not financial advice.</strong>
                    </p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="setup-actions">
                <button
                    id="verifyAndSaveBtn"
                    class="setup-button primary"
                    disabled
                >
                    <span class="btn-icon">✓</span>
                    <span class="btn-text">Verify & Activate Strategy</span>
                </button>
                <button
                    id="resetSetupBtn"
                    class="setup-button secondary"
                >
                    <span class="btn-icon">↺</span>
                    <span class="btn-text">Reset</span>
                </button>
            </div>
        </div>

        <!-- Minting Status (Hidden until activated) -->
        <div class="minting-status-panel" id="mintingStatusPanel" style="display: none;">
            <div class="status-header">
                <div class="status-indicator active">
                    <span class="indicator-dot"></span>
                    <span class="indicator-text">Minting Active</span>
                </div>
                <h3 class="status-title">Your Strategy is Live</h3>
            </div>

            <div class="status-grid">
                <div class="status-card">
                    <div class="status-icon">💰</div>
                    <div class="status-info">
                        <span class="status-label">Staked Amount</span>
                        <span class="status-value" id="stakedAmountDisplay">0</span>
                        <span class="status-unit">LUNC</span>
                    </div>
                </div>

                <div class="status-card">
                    <div class="status-icon">⚡</div>
                    <div class="status-info">
                        <span class="status-label">Daily Yield</span>
                        <span class="status-value" id="dailyYieldDisplay">0</span>
                        <span class="status-unit">Credits/day</span>
                    </div>
                </div>

                <div class="status-card">
                    <div class="status-icon">📅</div>
                    <div class="status-info">
                        <span class="status-label">Monthly Yield</span>
                        <span class="status-value" id="monthlyYieldDisplay">0</span>
                        <span class="status-unit">Credits/month</span>
                    </div>
                </div>
            </div>

            <!-- Countdown to Next Drop -->
            <div class="countdown-section">
                <h4 class="countdown-title">Next Credit Drop In:</h4>
                <div class="countdown-display" id="countdownDisplay">
                    <div class="countdown-item">
                        <span class="countdown-value" id="hoursLeft">00</span>
                        <span class="countdown-label">Hours</span>
                    </div>
                    <span class="countdown-separator">:</span>
                    <div class="countdown-item">
                        <span class="countdown-value" id="minutesLeft">00</span>
                        <span class="countdown-label">Minutes</span>
                    </div>
                    <span class="countdown-separator">:</span>
                    <div class="countdown-item">
                        <span class="countdown-value" id="secondsLeft">00</span>
                        <span class="countdown-label">Seconds</span>
                    </div>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="minting-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="mintingProgressFill" style="width: 0%"></div>
                </div>
                <p class="progress-text">
                    <span id="mintingProgressText">0%</span> until next yield
                </p>
            </div>

            <!-- Modify Strategy Button -->
            <div class="status-actions">
                <button id="modifyStrategyBtn" class="setup-button secondary">
                    <span class="btn-icon">⚙️</span>
                    <span class="btn-text">Modify Strategy</span>
                </button>
            </div>
        </div>
    `;
}

function renderTierCards() {
    return Object.keys(STAKING_TIERS).map(tierKey => {
        const tier = STAKING_TIERS[tierKey];
        return `
            <div class="tier-card" data-tier="${tierKey}" data-amount="${tier.amount}">
                <div class="tier-icon">${tier.icon}</div>
                <h4 class="tier-name" style="color: ${tier.color}">${tier.name}</h4>
                <div class="tier-amount">
                    ${formatNumber(tier.amount)} <span class="tier-unit">LUNC</span>
                </div>
                <p class="tier-description">${tier.description}</p>
                <div class="tier-badge">Recommended</div>
            </div>
        `;
    }).join('');
}

// ================================
// EVENT LISTENERS
// ================================

function setupStakingListeners() {
    // Tier card selection
    const tierCards = document.querySelectorAll('.tier-card');
    tierCards.forEach(card => {
        card.addEventListener('click', () => selectTier(card));
    });

    // Custom input
    const customInput = document.getElementById('customLuncInput');
    if (customInput) {
        customInput.addEventListener('input', handleCustomInput);
        customInput.addEventListener('change', validateCustomInput);
    }

    // Verify & Save button
    const verifyBtn = document.getElementById('verifyAndSaveBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyAndSaveStrategy);
    }

    // Reset button
    const resetBtn = document.getElementById('resetSetupBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSetup);
    }

    // Modify strategy button
    const modifyBtn = document.getElementById('modifyStrategyBtn');
    if (modifyBtn) {
        modifyBtn.addEventListener('click', showSetupForm);
    }
}

// ================================
// TIER SELECTION
// ================================

function selectTier(card) {
    // Deselect all
    document.querySelectorAll('.tier-card').forEach(c => {
        c.classList.remove('selected');
    });

    // Select this one
    card.classList.add('selected');

    // Get amount
    const amount = parseInt(card.getAttribute('data-amount'));

    // Clear custom input
    const customInput = document.getElementById('customLuncInput');
    if (customInput) {
        customInput.value = '';
    }

    // Calculate and display
    calculateYield(amount);

    // Enable verify button
    enableVerifyButton();
}

// ================================
// CUSTOM INPUT HANDLING
// ================================

function handleCustomInput(e) {
    const amount = parseInt(e.target.value) || 0;

    // Deselect tier cards
    document.querySelectorAll('.tier-card').forEach(c => {
        c.classList.remove('selected');
    });

    // Calculate if valid
    if (amount >= 100000) {
        calculateYield(amount);
        enableVerifyButton();
    } else {
        showCalculatorPlaceholder();
        disableVerifyButton();
    }
}

function validateCustomInput(e) {
    let amount = parseInt(e.target.value) || 0;

    // Round to nearest 100,000
    if (amount > 0) {
        amount = Math.round(amount / 100000) * 100000;
        e.target.value = amount;
    }

    // Check minimum
    if (amount > 0 && amount < 100000) {
        showNotification('Minimum staking amount is 100,000 LUNC', 'warning');
        e.target.value = 100000;
        amount = 100000;
    }

    if (amount >= 100000) {
        calculateYield(amount);
    }
}

// ================================
// YIELD CALCULATOR
// ================================

function calculateYield(luncAmount) {
    // 80% APR minting rule
    const APR = 0.80;
    const CREDITS_PER_100K = 1500; // 100,000 LUNC = 1,500 Credits minted instantly

    // Calculate yields
    const dailyRate = APR / 365;
    const monthlyRate = APR / 12;

    // Credits minted per LUNC
    const creditsPerLunc = CREDITS_PER_100K / 100000;

    const dailyYield = luncAmount * dailyRate * creditsPerLunc;
    const monthlyYield = luncAmount * monthlyRate * creditsPerLunc;
    const yearlyYield = luncAmount * APR * creditsPerLunc;

    // Initial mint (instant)
    const initialMint = (luncAmount / 100000) * CREDITS_PER_100K;

    // Display results
    displayCalculatorResults({
        luncAmount,
        initialMint,
        dailyYield,
        monthlyYield,
        yearlyYield
    });
}

function displayCalculatorResults(results) {
    const resultsContainer = document.getElementById('calculatorResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
        <div class="calc-result-grid">
            <!-- Initial Mint -->
            <div class="calc-result-card instant">
                <div class="calc-result-header">
                    <span class="calc-result-icon">⚡</span>
                    <span class="calc-result-title">Instant Mint</span>
                </div>
                <div class="calc-result-value">${formatNumber(results.initialMint.toFixed(0))}</div>
                <div class="calc-result-label">Credits (now)</div>
            </div>

            <!-- Daily Yield -->
            <div class="calc-result-card daily">
                <div class="calc-result-header">
                    <span class="calc-result-icon">📅</span>
                    <span class="calc-result-title">Daily Yield</span>
                </div>
                <div class="calc-result-value">${results.dailyYield.toFixed(2)}</div>
                <div class="calc-result-label">Credits/day</div>
            </div>

            <!-- Monthly Yield -->
            <div class="calc-result-card monthly">
                <div class="calc-result-header">
                    <span class="calc-result-icon">📆</span>
                    <span class="calc-result-title">Monthly Yield</span>
                </div>
                <div class="calc-result-value">${formatNumber(results.monthlyYield.toFixed(0))}</div>
                <div class="calc-result-label">Credits/month</div>
            </div>

            <!-- Yearly Yield -->
            <div class="calc-result-card yearly">
                <div class="calc-result-header">
                    <span class="calc-result-icon">📊</span>
                    <span class="calc-result-title">Yearly Yield</span>
                </div>
                <div class="calc-result-value">${formatNumber(results.yearlyYield.toFixed(0))}</div>
                <div class="calc-result-label">Credits/year</div>
            </div>
        </div>

        <!-- Summary -->
        <div class="calc-summary">
            <p class="summary-text">
                Based on the <strong>80% APR minting rule</strong>, staking
                <strong>${formatNumber(results.luncAmount)} LUNC</strong> will mint
                <strong>${formatNumber(results.initialMint.toFixed(0))} Credits instantly</strong>
                and generate <strong>${results.dailyYield.toFixed(2)} Credits per day</strong>.
            </p>
        </div>
    `;
}

function showCalculatorPlaceholder() {
    const resultsContainer = document.getElementById('calculatorResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
        <div class="calc-placeholder">
            <span class="placeholder-icon">💡</span>
            <p>Select a tier or enter an amount to see your yield projection</p>
        </div>
    `;
}

// ================================
// VERIFY & SAVE STRATEGY
// ================================

async function verifyAndSaveStrategy() {
    const verifyBtn = document.getElementById('verifyAndSaveBtn');
    if (!verifyBtn) return;

    // Get selected amount
    const selectedTier = document.querySelector('.tier-card.selected');
    const customInput = document.getElementById('customLuncInput');

    let luncAmount = 0;

    if (selectedTier) {
        luncAmount = parseInt(selectedTier.getAttribute('data-amount'));
    } else if (customInput && customInput.value) {
        luncAmount = parseInt(customInput.value);
    }

    if (luncAmount < 100000) {
        showNotification('Please select a tier or enter a valid amount', 'error');
        return;
    }

    // Disable button and show loading
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Verifying...</span>';

    try {
        const userId = window.app?.currentUser?.id_univoco;
        if (!userId) {
            throw new Error('User not logged in');
        }

        // Save to backend
        const response = await fetch(`${window.app.API_BASE}/api/staking/setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                luncAmount
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save strategy');
        }

        const result = await response.json();

        // Update user data
        if (window.app.currentUser) {
            window.app.currentUser.total_deposited_lunc = luncAmount;
            window.app.currentUser.crediti = result.newCredits;
            window.app.currentUser.next_minting_timestamp = result.nextMintingTimestamp;
        }

        // Show success notification
        showNotification(
            `✅ Strategy activated! ${result.initialMint} Credits minted instantly.`,
            'success'
        );

        // Send system message
        sendSystemMessage(
            'Your first strategy yield has arrived! Welcome to The RD Station.',
            'success'
        );

        // Hide setup form, show status panel
        showMintingStatus();

        // Start countdown
        startMintingCountdown(result.nextMintingTimestamp);

    } catch (error) {
        console.error('Error saving strategy:', error);
        showNotification('Failed to activate strategy. Please try again.', 'error');

        // Re-enable button
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Verify & Activate Strategy</span>';
    }
}

// ================================
// MINTING STATUS DISPLAY
// ================================

function showMintingStatus() {
    const setupPanel = document.querySelector('.staking-setup-panel');
    const statusPanel = document.getElementById('mintingStatusPanel');

    if (setupPanel) setupPanel.style.display = 'none';
    if (statusPanel) statusPanel.style.display = 'block';

    // Update status displays
    updateMintingStatusDisplays();
}

function showSetupForm() {
    const setupPanel = document.querySelector('.staking-setup-panel');
    const statusPanel = document.getElementById('mintingStatusPanel');

    if (setupPanel) setupPanel.style.display = 'block';
    if (statusPanel) statusPanel.style.display = 'none';

    // Pre-fill with current amount
    if (window.app?.currentUser?.total_deposited_lunc) {
        const customInput = document.getElementById('customLuncInput');
        if (customInput) {
            customInput.value = window.app.currentUser.total_deposited_lunc;
            calculateYield(window.app.currentUser.total_deposited_lunc);
            enableVerifyButton();
        }
    }
}

function updateMintingStatusDisplays() {
    if (!window.app?.currentUser) return;

    const user = window.app.currentUser;
    const luncAmount = user.total_deposited_lunc || 0;

    // Calculate yields
    const APR = 0.80;
    const CREDITS_PER_100K = 1500;
    const creditsPerLunc = CREDITS_PER_100K / 100000;
    const dailyRate = APR / 365;
    const monthlyRate = APR / 12;

    const dailyYield = luncAmount * dailyRate * creditsPerLunc;
    const monthlyYield = luncAmount * monthlyRate * creditsPerLunc;

    // Update displays
    const stakedAmountDisplay = document.getElementById('stakedAmountDisplay');
    const dailyYieldDisplay = document.getElementById('dailyYieldDisplay');
    const monthlyYieldDisplay = document.getElementById('monthlyYieldDisplay');

    if (stakedAmountDisplay) {
        stakedAmountDisplay.textContent = formatNumber(luncAmount);
    }
    if (dailyYieldDisplay) {
        dailyYieldDisplay.textContent = dailyYield.toFixed(2);
    }
    if (monthlyYieldDisplay) {
        monthlyYieldDisplay.textContent = formatNumber(monthlyYield.toFixed(0));
    }
}

// ================================
// COUNTDOWN TIMER
// ================================

let countdownInterval = null;

function startMintingCountdown(nextMintingTimestamp) {
    // Clear existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // Update immediately
    updateCountdown(nextMintingTimestamp);

    // Update every second
    countdownInterval = setInterval(() => {
        updateCountdown(nextMintingTimestamp);
    }, 1000);
}

function updateCountdown(nextMintingTimestamp) {
    const now = Date.now();
    const target = new Date(nextMintingTimestamp).getTime();
    const diff = target - now;

    if (diff <= 0) {
        // Minting time reached
        displayCountdownComplete();
        clearInterval(countdownInterval);

        // Trigger minting check (backend should handle this)
        checkForNewMinting();
        return;
    }

    // Calculate time remaining
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Update displays
    const hoursEl = document.getElementById('hoursLeft');
    const minutesEl = document.getElementById('minutesLeft');
    const secondsEl = document.getElementById('secondsLeft');

    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

    // Update progress bar
    const totalDuration = 24 * 60 * 60 * 1000; // 24 hours in ms
    const elapsed = totalDuration - diff;
    const progress = (elapsed / totalDuration) * 100;

    const progressFill = document.getElementById('mintingProgressFill');
    const progressText = document.getElementById('mintingProgressText');

    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    if (progressText) {
        progressText.textContent = `${progress.toFixed(1)}%`;
    }
}

function displayCountdownComplete() {
    const hoursEl = document.getElementById('hoursLeft');
    const minutesEl = document.getElementById('minutesLeft');
    const secondsEl = document.getElementById('secondsLeft');

    if (hoursEl) hoursEl.textContent = '00';
    if (minutesEl) minutesEl.textContent = '00';
    if (secondsEl) secondsEl.textContent = '00';

    const progressFill = document.getElementById('mintingProgressFill');
    const progressText = document.getElementById('mintingProgressText');

    if (progressFill) {
        progressFill.style.width = '100%';
    }
    if (progressText) {
        progressText.textContent = '100%';
    }

    showNotification('🎉 Daily yield minted! Credits added to your balance.', 'success');
}

async function checkForNewMinting() {
    try {
        const userId = window.app?.currentUser?.id_univoco;
        if (!userId) return;

        const response = await fetch(`${window.app.API_BASE}/api/staking/check-minting/${userId}`);
        if (response.ok) {
            const result = await response.json();

            if (result.minted) {
                // Update user credits
                if (window.app.currentUser) {
                    window.app.currentUser.crediti = result.newCredits;
                    window.app.currentUser.next_minting_timestamp = result.nextMintingTimestamp;
                }

                // Restart countdown
                startMintingCountdown(result.nextMintingTimestamp);

                // Update displays
                if (window.app.updateUserDisplay) {
                    window.app.updateUserDisplay();
                }
            }
        }
    } catch (error) {
        console.error('Error checking for new minting:', error);
    }
}

// ================================
// CHECK EXISTING STRATEGY
// ================================

async function checkExistingStrategy() {
    if (!window.app?.currentUser) return;

    const user = window.app.currentUser;

    // Check if user has staking balance
    if (user.total_deposited_lunc && user.total_deposited_lunc >= 100000) {
        // User has active strategy
        showMintingStatus();

        // Start countdown if next minting timestamp exists
        if (user.next_minting_timestamp) {
            startMintingCountdown(user.next_minting_timestamp);
        }
    } else {
        // Show setup form
        showSetupForm();
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function enableVerifyButton() {
    const verifyBtn = document.getElementById('verifyAndSaveBtn');
    if (verifyBtn) {
        verifyBtn.disabled = false;
    }
}

function disableVerifyButton() {
    const verifyBtn = document.getElementById('verifyAndSaveBtn');
    if (verifyBtn) {
        verifyBtn.disabled = true;
    }
}

function resetSetup() {
    // Deselect tiers
    document.querySelectorAll('.tier-card').forEach(c => {
        c.classList.remove('selected');
    });

    // Clear custom input
    const customInput = document.getElementById('customLuncInput');
    if (customInput) {
        customInput.value = '';
    }

    // Show placeholder
    showCalculatorPlaceholder();

    // Disable verify button
    disableVerifyButton();
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showNotification(message, type = 'info') {
    if (window.createBrandedNotification) {
        const notification = window.createBrandedNotification(type, message);
        console.log(`[${notification.icon}] ${notification.message}`);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Also show in UI if notification system exists
    if (window.lunoplyNeon && window.lunoplyNeon.addNotification) {
        window.lunoplyNeon.addNotification(message);
    }
}

function sendSystemMessage(message, type) {
    // Send system message to user's inbox
    if (window.app && window.app.socket) {
        window.app.socket.emit('system:message', {
            userId: window.app.currentUser?.id_univoco,
            subject: 'Strategy Activated',
            message,
            type
        });
    }
}

// ================================
// CLEANUP
// ================================

function cleanupStakingSetup() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    stakingSetupInitialized = false;
}

// ================================
// EXPORTS
// ================================

window.stakingSetup = {
    initialize: initializeStakingSetup,
    cleanup: cleanupStakingSetup,
    checkExisting: checkExistingStrategy,
    showStatus: showMintingStatus,
    showForm: showSetupForm
};

// Auto-initialize when staking page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for app to be ready
        setTimeout(initializeStakingSetup, 500);
    });
} else {
    setTimeout(initializeStakingSetup, 500);
}
