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
    updateUserSummaryHUD();
    checkSystemMessages();

    // Start real-time ticker
    startDataTicker();

    // Load dynamic widgets
    updateYieldWidget();
    updatePrizePoolWidget();

    // Load RD Insights feed
    loadRDInsightsFeed();

    // Refresh widgets every 30 seconds
    setInterval(() => {
        updatePrizePoolWidget();
        updateUserSummaryHUD();
    }, 30000);

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
            <!-- Real-Time Data Ticker -->
            <div class="data-ticker">
                <div class="ticker-track" id="tickerTrack">
                    <div class="ticker-item">
                        <span class="ticker-icon">🌕</span>
                        <span class="ticker-label">LUNC/USD:</span>
                        <span class="ticker-value" id="luncPrice">$0.000XXX</span>
                    </div>
                    <div class="ticker-item">
                        <span class="ticker-icon">💎</span>
                        <span class="ticker-label">USTC/USD:</span>
                        <span class="ticker-value" id="ustcPrice">$0.0XXX</span>
                    </div>
                    <div class="ticker-item">
                        <span class="ticker-icon">🔥</span>
                        <span class="ticker-label">BURN TRACKER (24h):</span>
                        <span class="ticker-value burn" id="burnTracker">0 Credits</span>
                    </div>
                    <div class="ticker-item">
                        <span class="ticker-icon">👥</span>
                        <span class="ticker-label">STATION USERS:</span>
                        <span class="ticker-value online" id="onlineUsers">0 Online</span>
                    </div>
                    <div class="ticker-item">
                        <span class="ticker-icon">🏆</span>
                        <span class="ticker-label">GLOBAL POOL:</span>
                        <span class="ticker-value" id="globalPoolTicker">0 LUNC</span>
                    </div>
                </div>
            </div>

            <!-- User Summary HUD -->
            <div class="user-summary-hud">
                <div class="hud-section hud-balance">
                    <div class="hud-icon">💰</div>
                    <div class="hud-content">
                        <span class="hud-label">Current Balance</span>
                        <span class="hud-value" id="hudCredits">0</span>
                        <span class="hud-unit">Credits</span>
                    </div>
                </div>
                <div class="hud-section hud-rank">
                    <div class="hud-icon">🏆</div>
                    <div class="hud-content">
                        <span class="hud-label">Global Rank</span>
                        <span class="hud-value" id="hudRank">#--</span>
                        <span class="hud-unit" id="hudPoints">0 pts</span>
                    </div>
                </div>
                <div class="hud-section hud-notifications">
                    <div class="hud-icon">🔔</div>
                    <div class="hud-content">
                        <span class="hud-label">Active Notifications</span>
                        <span class="hud-value" id="hudNotifications">0</span>
                        <span class="hud-unit">pending</span>
                    </div>
                </div>
                <div class="hud-section hud-streak">
                    <div class="hud-icon">⚡</div>
                    <div class="hud-content">
                        <span class="hud-label">Login Streak</span>
                        <span class="hud-value" id="hudStreak">0</span>
                        <span class="hud-unit">days</span>
                    </div>
                </div>
            </div>

            <!-- Dynamic Widgets Row -->
            <div class="dynamic-widgets">
                <!-- Yield Widget -->
                <div class="widget yield-widget">
                    <div class="widget-header">
                        <span class="widget-icon">📈</span>
                        <h3 class="widget-title">Your Minting Rate</h3>
                    </div>
                    <div class="widget-content">
                        <div class="yield-stats">
                            <div class="yield-item">
                                <span class="yield-label">Daily Yield:</span>
                                <span class="yield-value" id="widgetDailyYield">0</span>
                                <span class="yield-unit">Credits/day</span>
                            </div>
                            <div class="yield-item">
                                <span class="yield-label">Monthly Yield:</span>
                                <span class="yield-value" id="widgetMonthlyYield">0</span>
                                <span class="yield-unit">Credits/month</span>
                            </div>
                            <div class="yield-progress">
                                <div class="yield-progress-bar" id="yieldProgressBar" style="width: 0%"></div>
                            </div>
                            <p class="yield-note">Based on 80% APR minting rule</p>
                        </div>
                    </div>
                </div>

                <!-- Prize Pool Alert Widget -->
                <div class="widget prize-pool-widget glow-pulse">
                    <div class="widget-header">
                        <span class="widget-icon">🎮</span>
                        <h3 class="widget-title">Luncopoly Live</h3>
                    </div>
                    <div class="widget-content">
                        <div class="prize-pool-alert">
                            <div class="prize-pool-main">
                                <span class="prize-label">Active Tables:</span>
                                <span class="prize-value" id="widgetActiveTables">0/2</span>
                            </div>
                            <div class="prize-pool-amount">
                                <span class="prize-label">Win up to:</span>
                                <span class="prize-value-large">250</span>
                                <span class="prize-unit">Credits</span>
                            </div>
                            <button class="widget-cta-button" onclick="navigateToGameCenter()">
                                <span>🎲 PLAY NOW (50 Credits)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RD Insights Feed -->
            <div class="rd-insights-feed">
                <div class="feed-header">
                    <h2 class="feed-title">
                        <span class="feed-icon">📰</span>
                        Latest from RD Insights
                    </h2>
                    <button class="feed-view-all" onclick="navigateToRDInsights()">View All →</button>
                </div>
                <div class="feed-grid" id="rdInsightsFeed">
                    <div class="feed-loading">Loading latest articles...</div>
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
// REAL-TIME TICKER FUNCTIONS
// ================================

let tickerInterval = null;

function startDataTicker() {
    // Initial update
    updateTickerData();

    // Update every 5 seconds
    tickerInterval = setInterval(updateTickerData, 5000);

    // Animate ticker track (continuous scroll)
    const tickerTrack = document.getElementById('tickerTrack');
    if (tickerTrack) {
        // Clone ticker items for seamless loop
        const tickerItems = tickerTrack.innerHTML;
        tickerTrack.innerHTML = tickerItems + tickerItems;
    }
}

async function updateTickerData() {
    try {
        // Update LUNC/USTC prices (simulated for now, can be replaced with real API)
        updateCryptoPrices();

        // Update burn tracker
        const burnResponse = await fetch(`${window.app.API_BASE}/api/stats/burn-tracker`);
        if (burnResponse.ok) {
            const burnData = await burnResponse.json();
            const burnEl = document.getElementById('burnTracker');
            if (burnEl) {
                burnEl.textContent = `${burnData.credits_burned_24h || 0} Credits`;
            }
        }

        // Update online users count
        const usersResponse = await fetch(`${window.app.API_BASE}/api/stats/online-users`);
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const usersEl = document.getElementById('onlineUsers');
            if (usersEl) {
                usersEl.textContent = `${usersData.count || 0} Online`;
            }
        }

        // Update global pool
        const poolResponse = await fetch(`${window.app.API_BASE}/api/staking/global-stats`);
        if (poolResponse.ok) {
            const poolData = await poolResponse.json();
            const poolEl = document.getElementById('globalPoolTicker');
            if (poolEl && poolData.total_staked) {
                poolEl.textContent = `${formatLargeNumber(poolData.total_staked)} LUNC`;
            }
        }

    } catch (error) {
        console.error('Error updating ticker data:', error);
    }
}

function updateCryptoPrices() {
    // Simulated prices with realistic fluctuation
    // In production, replace with real API calls to CoinGecko, Binance, etc.
    const luncBase = 0.00009876;
    const ustcBase = 0.0234;

    const luncFluctuation = (Math.random() - 0.5) * 0.000001;
    const ustcFluctuation = (Math.random() - 0.5) * 0.0005;

    const luncPrice = luncBase + luncFluctuation;
    const ustcPrice = ustcBase + ustcFluctuation;

    const luncEl = document.getElementById('luncPrice');
    const ustcEl = document.getElementById('ustcPrice');

    if (luncEl) {
        luncEl.textContent = `$${luncPrice.toFixed(8)}`;
        luncEl.className = 'ticker-value ' + (luncFluctuation > 0 ? 'price-up' : 'price-down');
    }

    if (ustcEl) {
        ustcEl.textContent = `$${ustcPrice.toFixed(4)}`;
        ustcEl.className = 'ticker-value ' + (ustcFluctuation > 0 ? 'price-up' : 'price-down');
    }
}

function formatLargeNumber(num) {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
}

// ================================
// USER SUMMARY HUD FUNCTIONS
// ================================

function updateUserSummaryHUD() {
    if (!window.app || !window.app.currentUser) return;

    const user = window.app.currentUser;

    // Update balance
    const hudCredits = document.getElementById('hudCredits');
    if (hudCredits) {
        hudCredits.textContent = user.crediti || 0;
    }

    // Update rank and points
    const hudPoints = document.getElementById('hudPoints');
    if (hudPoints) {
        hudPoints.textContent = `${user.punti_classifica || 0} pts`;
    }

    // Calculate and display rank (fetch from leaderboard)
    fetchUserRank();

    // Update notifications count
    fetchNotificationsCount();

    // Update streak (placeholder for now)
    const hudStreak = document.getElementById('hudStreak');
    if (hudStreak) {
        hudStreak.textContent = user.login_streak || 0;
    }
}

async function fetchUserRank() {
    try {
        const userId = window.app.currentUser?.id_univoco;
        if (!userId) return;

        const response = await fetch(`${window.app.API_BASE}/api/leaderboard/rank/${userId}`);
        if (response.ok) {
            const rankData = await response.json();
            const hudRank = document.getElementById('hudRank');
            if (hudRank) {
                hudRank.textContent = `#${rankData.rank || '--'}`;
            }
        }
    } catch (error) {
        console.error('Error fetching user rank:', error);
    }
}

async function fetchNotificationsCount() {
    try {
        const userId = window.app.currentUser?.id_univoco;
        if (!userId) return;

        const response = await fetch(`${window.app.API_BASE}/api/notifications/${userId}/count`);
        if (response.ok) {
            const notifData = await response.json();
            const hudNotifications = document.getElementById('hudNotifications');
            if (hudNotifications) {
                hudNotifications.textContent = notifData.count || 0;

                // Add pulsing effect if there are notifications
                const hudSection = hudNotifications.closest('.hud-notifications');
                if (notifData.count > 0 && hudSection) {
                    hudSection.classList.add('has-notifications');
                } else if (hudSection) {
                    hudSection.classList.remove('has-notifications');
                }
            }
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// ================================
// DYNAMIC WIDGETS FUNCTIONS
// ================================

function updateYieldWidget() {
    if (!window.app || !window.app.currentUser) return;

    const capital = window.app.currentUser.capitale_lunc || 0;

    // 80% APR minting calculation
    const apr = 0.80; // 80% APR
    const dailyRate = apr / 365;
    const monthlyRate = apr / 12;

    // Credits minted per 100,000 LUNC = 1,500 credits
    const creditsPerUnit = 1500 / 100000;

    const dailyYield = capital * dailyRate * creditsPerUnit;
    const monthlyYield = capital * monthlyRate * creditsPerUnit;

    const widgetDailyYield = document.getElementById('widgetDailyYield');
    const widgetMonthlyYield = document.getElementById('widgetMonthlyYield');

    if (widgetDailyYield) {
        widgetDailyYield.textContent = dailyYield.toFixed(2);
    }

    if (widgetMonthlyYield) {
        widgetMonthlyYield.textContent = monthlyYield.toFixed(2);
    }

    // Update progress bar (percentage of daily target reached)
    const yieldProgressBar = document.getElementById('yieldProgressBar');
    if (yieldProgressBar) {
        const targetDaily = 10; // Example target
        const progress = Math.min((dailyYield / targetDaily) * 100, 100);
        yieldProgressBar.style.width = `${progress}%`;
    }
}

async function updatePrizePoolWidget() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/game/active-tables`);
        if (response.ok) {
            const tablesData = await response.json();
            const widgetActiveTables = document.getElementById('widgetActiveTables');
            if (widgetActiveTables) {
                const activeCount = tablesData.active_tables || 0;
                widgetActiveTables.textContent = `${activeCount}/2`;

                // Add urgency effect if tables are filling up
                const widget = document.querySelector('.prize-pool-widget');
                if (activeCount > 0 && widget) {
                    widget.classList.add('tables-active');
                } else if (widget) {
                    widget.classList.remove('tables-active');
                }
            }
        }
    } catch (error) {
        console.error('Error updating prize pool widget:', error);
    }
}

// ================================
// RD INSIGHTS FEED FUNCTIONS
// ================================

async function loadRDInsightsFeed() {
    const feedContainer = document.getElementById('rdInsightsFeed');
    if (!feedContainer) return;

    try {
        // Simulated blog feed (in production, use real RSS parser or API)
        const feedData = await fetchBlogFeed();

        if (!feedData || feedData.length === 0) {
            feedContainer.innerHTML = '<div class="feed-empty">No articles available</div>';
            return;
        }

        // Display last 3 articles
        const articles = feedData.slice(0, 3);

        feedContainer.innerHTML = articles.map((article, index) => `
            <div class="feed-card" data-article-id="${article.id}">
                <div class="feed-card-thumbnail">
                    <img src="${article.thumbnail || '/images/default-blog.png'}"
                         alt="${article.title}"
                         onerror="this.src='/images/default-blog.png'">
                    ${article.isNew ? '<span class="feed-badge-new">NEW</span>' : ''}
                </div>
                <div class="feed-card-content">
                    <h3 class="feed-card-title">${article.title}</h3>
                    <p class="feed-card-excerpt">${article.excerpt}</p>
                    <div class="feed-card-meta">
                        <span class="feed-date">${formatDate(article.publishDate)}</span>
                        ${renderVoteEarnButton(article)}
                    </div>
                </div>
            </div>
        `).join('');

        // Setup vote & earn listeners
        setupVoteEarnListeners();

    } catch (error) {
        console.error('Error loading RD Insights feed:', error);
        feedContainer.innerHTML = '<div class="feed-error">Failed to load articles</div>';
    }
}

async function fetchBlogFeed() {
    // Simulated blog feed data
    // In production, replace with actual RSS parser or Blogger API call
    return [
        {
            id: 'article-1',
            title: 'LUNC 2.0: The Future of Terra Classic',
            excerpt: 'Exploring the upcoming upgrades and what they mean for the ecosystem...',
            thumbnail: 'https://via.placeholder.com/400x250/1a1a2e/ffd700?text=LUNC+2.0',
            publishDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
            isNew: true,
            hasVoted: false
        },
        {
            id: 'article-2',
            title: 'Staking Strategies for Maximum Yield',
            excerpt: 'Learn how to optimize your staking returns with proven strategies...',
            thumbnail: 'https://via.placeholder.com/400x250/1a1a2e/00ffff?text=Staking+Guide',
            publishDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
            isNew: false,
            hasVoted: true
        },
        {
            id: 'article-3',
            title: 'Blockchain Gaming: The Next Revolution',
            excerpt: 'Why blockchain gaming is poised to transform the entertainment industry...',
            thumbnail: 'https://via.placeholder.com/400x250/1a1a2e/ff00ff?text=Gaming',
            publishDate: new Date(Date.now() - 86400000 * 7), // 7 days ago
            isNew: false,
            hasVoted: false
        }
    ];
}

function renderVoteEarnButton(article) {
    if (article.hasVoted) {
        return '<span class="feed-voted">✓ Voted</span>';
    }
    return `<button class="feed-vote-button" data-article-id="${article.id}">
                <span>👍 Vote & Earn 30 pts</span>
            </button>`;
}

function setupVoteEarnListeners() {
    const voteButtons = document.querySelectorAll('.feed-vote-button');
    voteButtons.forEach(btn => {
        btn.addEventListener('click', handleVoteEarn);
    });
}

async function handleVoteEarn(event) {
    const button = event.currentTarget;
    const articleId = button.getAttribute('data-article-id');

    button.disabled = true;
    button.innerHTML = '<span>Processing...</span>';

    try {
        const userId = window.app.currentUser?.id_univoco;
        const response = await fetch(`${window.app.API_BASE}/api/social/vote-article`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, articleId })
        });

        if (response.ok) {
            const result = await response.json();
            button.innerHTML = '<span>✓ Voted (+30 pts)</span>';
            button.classList.add('voted');

            // Update user points
            if (window.app.currentUser) {
                window.app.currentUser.punti_classifica += 30;
                updateUserSummaryHUD();
                updateUserProfile();
            }

            showNotification('🎉 +30 points earned for voting!', 'success');
        } else {
            throw new Error('Vote failed');
        }
    } catch (error) {
        console.error('Error voting on article:', error);
        button.disabled = false;
        button.innerHTML = '<span>👍 Vote & Earn 30 pts</span>';
        showNotification('Failed to register vote. Please try again.', 'error');
    }
}

function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
// CLEANUP FUNCTION
// ================================

function cleanupHub() {
    // Stop ticker interval
    if (tickerInterval) {
        clearInterval(tickerInterval);
        tickerInterval = null;
    }

    // Reset initialization flag
    hubInitialized = false;
}

// ================================
// EXPORTS
// ================================

// Global function aliases for easy access
window.initializeRDStationHub = initializeHub;
window.refreshRDStationHub = loadHubData;
window.cleanupRDStationHub = cleanupHub;
window.navigateToStakingHub = navigateToStakingHub;
window.navigateToSocialRewards = navigateToSocialRewards;
window.navigateToGameCenter = navigateToGameCenter;
window.navigateToRDInsights = navigateToRDInsights;

window.rdStationHub = {
    initialize: initializeHub,
    cleanup: cleanupHub,
    refresh: loadHubData,
    navigateToStakingHub,
    navigateToSocialRewards,
    navigateToGameCenter,
    navigateToRDInsights,
    updateUserProfile,
    loadHubData,
    updateUserSummaryHUD,
    updateYieldWidget,
    updatePrizePoolWidget
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
