// ================================
// THE RD STATION - HUB MODULE
// Central navigation hub for all platform features
// ================================

let hubInitialized = false;

// ================================
// HUB INITIALIZATION
// ================================

function initializeHub() {
    if (hubInitialized) return;

    console.log('🏠 Initializing RD Station Hub...');

    renderHubHome();
    setupHubNavigation();
    updateUserProfile();
    checkSystemMessages();

    hubInitialized = true;
}

// ================================
// HUB HOME PAGE RENDERING
// ================================

function renderHubHome() {
    const hubContainer = document.getElementById('rdStationHubContainer');
    if (!hubContainer) {
        console.warn('Hub container not found');
        return;
    }

    hubContainer.innerHTML = `
        <div class="rd-station-hub">
            <!-- Hero Header -->
            <div class="hub-hero">
                <div class="hub-hero-content">
                    <h1 class="hub-title">Welcome to The RD Station</h1>
                    <p class="hub-subtitle">Your Gateway to Blockchain Gaming, Staking & Social Rewards</p>
                </div>
            </div>

            <!-- Main Navigation Cards -->
            <div class="hub-cards-grid">
                <!-- Card A: Staking Hub -->
                <div class="hub-card staking-hub" onclick="navigateToStakingHub()">
                    <div class="hub-card-icon">💎</div>
                    <h2 class="hub-card-title">STAKING HUB</h2>
                    <p class="hub-card-description">
                        Stake your LUNC and earn daily credits through our 80% APR minting system
                    </p>
                    <div class="hub-card-stats">
                        <div class="stat-item">
                            <span class="stat-label">Your Stake:</span>
                            <span class="stat-value" id="userStakeAmount">0 LUNC</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Daily Yield:</span>
                            <span class="stat-value" id="userDailyYield">0 Credits</span>
                        </div>
                    </div>
                    <button class="hub-card-button">Enter Staking Hub →</button>
                </div>

                <!-- Card B: Social Rewards -->
                <div class="hub-card social-rewards" onclick="navigateToSocialRewards()">
                    <div class="hub-card-icon">🎯</div>
                    <h2 class="hub-card-title">SOCIAL REWARDS</h2>
                    <p class="hub-card-description">
                        Complete social tasks to earn credits and ranking points
                    </p>
                    <div class="hub-card-stats">
                        <div class="stat-item">
                            <span class="stat-label">Available Tasks:</span>
                            <span class="stat-value" id="availableTasks">9</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Your Points:</span>
                            <span class="stat-value" id="userRankingPoints">0</span>
                        </div>
                    </div>
                    <button class="hub-card-button">View Social Tasks →</button>
                </div>

                <!-- Card C: Game Center -->
                <div class="hub-card game-center" onclick="navigateToGameCenter()">
                    <div class="hub-card-icon">🎮</div>
                    <h2 class="hub-card-title">GAME CENTER</h2>
                    <p class="hub-card-description">
                        Play Luncopoly Blitz and compete for prizes
                    </p>
                    <div class="hub-card-stats">
                        <div class="stat-item">
                            <span class="stat-label">Entry Fee:</span>
                            <span class="stat-value">50 Credits</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Prize Pool:</span>
                            <span class="stat-value">250 Credits</span>
                        </div>
                    </div>
                    <button class="hub-card-button">Enter Game Center →</button>
                </div>

                <!-- Card D: RD Insights -->
                <div class="hub-card rd-insights" onclick="navigateToRDInsights()">
                    <div class="hub-card-icon">📰</div>
                    <h2 class="hub-card-title">RD INSIGHTS</h2>
                    <p class="hub-card-description">
                        Latest articles and updates from Rendite Digitali
                    </p>
                    <div class="hub-card-stats">
                        <div class="stat-item">
                            <span class="stat-label">Latest Posts:</span>
                            <span class="stat-value" id="latestPostsCount">...</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Read & Earn:</span>
                            <span class="stat-value">Up to 50 pts</span>
                        </div>
                    </div>
                    <button class="hub-card-button">Read Insights →</button>
                </div>
            </div>

            <!-- Quick Stats Bar -->
            <div class="hub-quick-stats">
                <div class="quick-stat-item">
                    <span class="quick-stat-icon">💰</span>
                    <div class="quick-stat-info">
                        <span class="quick-stat-label">Total Credits</span>
                        <span class="quick-stat-value" id="hubTotalCredits">0</span>
                    </div>
                </div>
                <div class="quick-stat-item">
                    <span class="quick-stat-icon">🏆</span>
                    <div class="quick-stat-info">
                        <span class="quick-stat-label">Match Points</span>
                        <span class="quick-stat-value" id="hubMatchPoints">0</span>
                    </div>
                </div>
                <div class="quick-stat-item">
                    <span class="quick-stat-icon">⚡</span>
                    <div class="quick-stat-info">
                        <span class="quick-stat-label">Active Streak</span>
                        <span class="quick-stat-value" id="hubActiveStreak">0 days</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load dynamic data
    loadHubData();
}

// ================================
// DATA LOADING
// ================================

async function loadHubData() {
    if (!window.app || !window.app.currentUser) return;

    try {
        const userId = window.app.currentUser.id_univoco;

        // Update user credits
        const creditsDisplay = document.getElementById('hubTotalCredits');
        if (creditsDisplay) {
            creditsDisplay.textContent = window.app.currentUser.crediti || 0;
        }

        // Update ranking points
        const pointsDisplay = document.getElementById('hubMatchPoints');
        if (pointsDisplay) {
            pointsDisplay.textContent = window.app.currentUser.punti_classifica || 0;
        }

        // Load staking info
        const stakingResponse = await fetch(`${window.app.API_BASE}/api/staking/user/${userId}`);
        if (stakingResponse.ok) {
            const stakingData = await stakingResponse.json();
            updateStakingStats(stakingData);
        }

        // Load social tasks progress
        const tasksResponse = await fetch(`${window.app.API_BASE}/api/social/actions/${userId}`);
        if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            updateSocialStats(tasksData);
        }

        // Load RD Insights count
        loadRDInsightsCount();

    } catch (error) {
        console.error('Error loading hub data:', error);
    }
}

function updateStakingStats(stakingData) {
    const stakeAmount = document.getElementById('userStakeAmount');
    const dailyYield = document.getElementById('userDailyYield');

    if (stakeAmount && stakingData.total_deposited_lunc) {
        stakeAmount.textContent = `${stakingData.total_deposited_lunc.toFixed(2)} LUNC`;
    }

    if (dailyYield && stakingData.daily_yield) {
        dailyYield.textContent = `${stakingData.daily_yield.toFixed(2)} Credits`;
    }
}

function updateSocialStats(tasksData) {
    const completedTasks = tasksData.length;
    const totalTasks = 9; // Total available tasks
    const availableTasksEl = document.getElementById('availableTasks');

    if (availableTasksEl) {
        availableTasksEl.textContent = `${totalTasks - completedTasks}/${totalTasks}`;
    }

    const userPointsEl = document.getElementById('userRankingPoints');
    if (userPointsEl && window.app.currentUser) {
        userPointsEl.textContent = window.app.currentUser.punti_classifica || 0;
    }
}

async function loadRDInsightsCount() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/blog/feed`);
        if (response.ok) {
            const feedData = await response.json();
            const countEl = document.getElementById('latestPostsCount');
            if (countEl && feedData.posts) {
                countEl.textContent = feedData.posts.length;
            }
        }
    } catch (error) {
        console.error('Error loading RD Insights:', error);
    }
}

// ================================
// NAVIGATION FUNCTIONS
// ================================

function navigateToStakingHub() {
    console.log('🏦 Navigating to Staking Hub');
    if (window.app && window.app.navigateTo) {
        window.app.navigateTo('dashboard');
    }
}

function navigateToSocialRewards() {
    console.log('🎯 Navigating to Social Rewards');
    if (window.app && window.app.navigateTo) {
        window.app.navigateTo('social-tasks');
    }
}

function navigateToGameCenter() {
    console.log('🎮 Navigating to Game Center');

    // Check if user has enough credits
    if (window.app && window.app.currentUser) {
        const userCredits = window.app.currentUser.crediti || 0;
        if (userCredits < 50) {
            showNotification('⚠️ You need 50 credits to enter the Game Center', 'warning');
            return;
        }
    }

    if (window.app && window.app.navigateTo) {
        window.app.navigateTo('lobby');
    }
}

function navigateToRDInsights() {
    console.log('📰 Navigating to RD Insights');
    if (window.app && window.app.navigateTo) {
        window.app.navigateTo('mission');
    }
}

// ================================
// HUB NAVIGATION SETUP
// ================================

function setupHubNavigation() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    navigateToStakingHub();
                    break;
                case '2':
                    e.preventDefault();
                    navigateToSocialRewards();
                    break;
                case '3':
                    e.preventDefault();
                    navigateToGameCenter();
                    break;
                case '4':
                    e.preventDefault();
                    navigateToRDInsights();
                    break;
            }
        }
    });
}

// ================================
// USER PROFILE MANAGEMENT
// ================================

function updateUserProfile() {
    if (!window.app || !window.app.currentUser) return;

    const user = window.app.currentUser;

    // Update credits display
    const creditsDisplays = document.querySelectorAll('.user-credits-display');
    creditsDisplays.forEach(el => {
        el.textContent = user.crediti || 0;
    });

    // Update match points
    const pointsDisplays = document.querySelectorAll('.user-points-display');
    pointsDisplays.forEach(el => {
        el.textContent = user.punti_classifica || 0;
    });
}

// ================================
// SYSTEM MESSAGES
// ================================

async function checkSystemMessages() {
    if (!window.app || !window.app.currentUser) return;

    try {
        const userId = window.app.currentUser.id_univoco;
        const response = await fetch(`${window.app.API_BASE}/api/messages/system/${userId}`);

        if (response.ok) {
            const messages = await response.json();
            if (messages.length > 0) {
                showSystemMessageBadge(messages.length);
            }
        }
    } catch (error) {
        console.error('Error checking system messages:', error);
    }
}

function showSystemMessageBadge(count) {
    const badge = document.getElementById('systemMessageBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = 'block';
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function showNotification(message, type = 'info') {
    if (window.lunoplyNeon && window.lunoplyNeon.addNotification) {
        window.lunoplyNeon.addNotification(message);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// ================================
// SOCKET.IO INTEGRATION
// ================================

if (window.app && window.app.socket) {
    // Credits updated
    window.app.socket.on('credits:updated', (data) => {
        if (data.userId === window.app.currentUser?.id_univoco) {
            window.app.currentUser.crediti = data.newBalance;
            updateUserProfile();
            loadHubData();
            showNotification(`💰 Credits updated: ${data.newBalance}`, 'success');
        }
    });

    // Points updated
    window.app.socket.on('points:updated', (data) => {
        if (data.userId === window.app.currentUser?.id_univoco) {
            window.app.currentUser.punti_classifica = data.newPoints;
            updateUserProfile();
            loadHubData();
            showNotification(`🏆 Points updated: ${data.newPoints}`, 'success');
        }
    });

    // System message received
    window.app.socket.on('system:message', (data) => {
        if (data.userId === window.app.currentUser?.id_univoco) {
            checkSystemMessages();
            showNotification(`📬 New system message: ${data.subject}`, 'info');
        }
    });
}

// ================================
// EXPORTS
// ================================

// Global function aliases for easy access
window.initializeRDStationHub = initializeHub;
window.refreshRDStationHub = loadHubData;
window.navigateToStakingHub = navigateToStakingHub;
window.navigateToSocialRewards = navigateToSocialRewards;
window.navigateToGameCenter = navigateToGameCenter;
window.navigateToRDInsights = navigateToRDInsights;

window.rdStationHub = {
    initialize: initializeHub,
    refresh: loadHubData,
    navigateToStakingHub,
    navigateToSocialRewards,
    navigateToGameCenter,
    navigateToRDInsights,
    updateUserProfile,
    loadHubData
};

// Auto-initialize when navigating to hub
if (window.app) {
    const originalNavigateTo = window.app.navigateTo;
    if (originalNavigateTo) {
        window.app.navigateTo = function(page) {
            originalNavigateTo.call(window.app, page);
            if (page === 'hub') {
                setTimeout(() => initializeHub(), 100);
            }
        };
    }
}
