// ================================
// THE RD STATION MANUAL
// Comprehensive guide and documentation
// ================================

let manualInitialized = false;
let welcomeModalShown = localStorage.getItem('rdStationWelcomeShown') === 'true';

// ================================
// INITIALIZATION
// ================================

function initializeStationManual() {
    if (manualInitialized) return;

    console.log('📖 Initializing Station Manual...');

    // Show welcome modal for new users
    if (!welcomeModalShown) {
        showWelcomeModal();
    }

    setupManualListeners();
    manualInitialized = true;
}

// ================================
// WELCOME MODAL (FIRST-TIME USERS)
// ================================

function showWelcomeModal() {
    const modal = document.createElement('div');
    modal.id = 'welcomeModal';
    modal.className = 'station-modal-overlay';
    modal.innerHTML = `
        <div class="station-modal welcome-modal">
            <div class="modal-header">
                <div class="modal-logo">
                    <span class="rd-logo">RD</span>
                    <h2 class="modal-title">Welcome to The RD Station</h2>
                </div>
            </div>
            <div class="modal-content">
                <p class="welcome-intro">
                    Commander, you've entered the most advanced blockchain gaming and staking platform
                    in the Terra Classic ecosystem. Complete these 5 steps to become operational:
                </p>

                <div class="onboarding-checklist">
                    <div class="checklist-item" data-step="1">
                        <div class="checklist-checkbox">
                            <span class="checkbox-icon">1</span>
                        </div>
                        <div class="checklist-content">
                            <h3>Explore the Dashboard</h3>
                            <p>Navigate to the Hub and familiarize yourself with real-time station metrics</p>
                        </div>
                    </div>

                    <div class="checklist-item" data-step="2">
                        <div class="checklist-checkbox">
                            <span class="checkbox-icon">2</span>
                        </div>
                        <div class="checklist-content">
                            <h3>Deposit LUNC for Credits</h3>
                            <p>Visit Staking Hub and deposit at least 100,000 LUNC to mint 1,500 Credits</p>
                        </div>
                    </div>

                    <div class="checklist-item" data-step="3">
                        <div class="checklist-checkbox">
                            <span class="checkbox-icon">3</span>
                        </div>
                        <div class="checklist-content">
                            <h3>Complete Social Tasks</h3>
                            <p>Earn your first ranking points by following RD on social platforms</p>
                        </div>
                    </div>

                    <div class="checklist-item" data-step="4">
                        <div class="checklist-checkbox">
                            <span class="checkbox-icon">4</span>
                        </div>
                        <div class="checklist-content">
                            <h3>Play Luncopoly Blitz</h3>
                            <p>Join a game table with 50 Credits and compete for the 250 Credit prize pool</p>
                        </div>
                    </div>

                    <div class="checklist-item" data-step="5">
                        <div class="checklist-checkbox">
                            <span class="checkbox-icon">5</span>
                        </div>
                        <div class="checklist-content">
                            <h3>Read the Station Manual</h3>
                            <p>Access the full guide via the (?) icon in the navbar to master all strategies</p>
                        </div>
                    </div>
                </div>

                <div class="welcome-footer">
                    <label class="checkbox-label">
                        <input type="checkbox" id="dontShowAgain">
                        <span>Don't show this again</span>
                    </label>
                    <button class="modal-button primary" onclick="closeWelcomeModal()">
                        <span>🚀 Enter The Station</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Animate entrance
    setTimeout(() => {
        modal.classList.add('active');
    }, 100);
}

function closeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    const dontShow = document.getElementById('dontShowAgain');

    if (dontShow && dontShow.checked) {
        localStorage.setItem('rdStationWelcomeShown', 'true');
        welcomeModalShown = true;
    }

    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Make function globally accessible
window.closeWelcomeModal = closeWelcomeModal;

// ================================
// STATION MANUAL PAGE
// ================================

function renderStationManual() {
    const container = document.getElementById('stationManualContainer');
    if (!container) {
        console.warn('Station Manual container not found');
        return;
    }

    container.innerHTML = `
        <div class="station-manual">
            <!-- Manual Header -->
            <div class="manual-header">
                <div class="manual-title-section">
                    <span class="manual-icon">📖</span>
                    <div>
                        <h1 class="manual-title">The RD Station Manual</h1>
                        <p class="manual-subtitle">Complete documentation for commanders and strategists</p>
                    </div>
                </div>
                <div class="manual-version">
                    <span class="version-badge">v2.0</span>
                    <span class="last-updated">Last Updated: January 2026</span>
                </div>
            </div>

            <!-- Quick Navigation -->
            <div class="manual-quick-nav">
                <button class="quick-nav-btn" onclick="scrollToSection('pillar1')">
                    <span>💎</span> Economia & Minting
                </button>
                <button class="quick-nav-btn" onclick="scrollToSection('pillar2')">
                    <span>🎲</span> Luncopoly Blitz
                </button>
                <button class="quick-nav-btn" onclick="scrollToSection('pillar3')">
                    <span>🎯</span> Social Rewards
                </button>
                <button class="quick-nav-btn" onclick="scrollToSection('pillar4')">
                    <span>🔥</span> Burn Concept
                </button>
                <button class="quick-nav-btn" onclick="scrollToSection('glossary')">
                    <span>📚</span> Glossary
                </button>
            </div>

            <!-- Manual Content Accordion -->
            <div class="manual-accordion">
                ${renderPillar1()}
                ${renderPillar2()}
                ${renderPillar3()}
                ${renderPillar4()}
                ${renderGlossary()}
            </div>

            <!-- Footer -->
            <div class="manual-footer">
                <p>Built with ❤️ by the <a href="https://renditedigitali.blogspot.com" target="_blank">Rendite Digitali</a> community</p>
                <p>Need help? Contact us on <a href="https://twitter.com/RenditeDigitali" target="_blank">Twitter/X</a></p>
            </div>
        </div>
    `;

    setupAccordion();
}

// ================================
// PILLAR 1: ECONOMIA & MINTING
// ================================

function renderPillar1() {
    return `
        <div class="accordion-section" id="pillar1">
            <button class="accordion-header" onclick="toggleAccordion('pillar1')">
                <div class="accordion-title">
                    <span class="accordion-icon">💎</span>
                    <h2>Pillar 1: Economia & Minting</h2>
                </div>
                <span class="accordion-arrow">▼</span>
            </button>
            <div class="accordion-content">
                <div class="pillar-content">
                    <h3>🌟 Overview</h3>
                    <p class="pillar-text">
                        The RD Station operates on a <strong>simulated LUNC staking economy</strong> based on
                        the official Rendite Digitali strategy. Your LUNC deposits are 100% protected and
                        generate Credits through our minting system.
                    </p>

                    <h3>💰 The 80% APR Rule</h3>
                    <div class="info-box cyan-theme">
                        <h4>How Credits Are Generated</h4>
                        <ul>
                            <li><strong>Deposit Ratio:</strong> 100,000 LUNC = 1,500 Credits minted instantly</li>
                            <li><strong>APR Distribution:</strong> 80% of staking APR goes to Credit minting</li>
                            <li><strong>Remaining 20%:</strong> Divided into Sustainability Vault (10%) and Burn Reserve (10%)</li>
                            <li><strong>Capital Protection:</strong> Your principal is never touched - 100% guaranteed</li>
                        </ul>
                    </div>

                    <h3>📊 Yield Calculation Example</h3>
                    <div class="calculation-box">
                        <div class="calc-step">
                            <span class="calc-label">Initial Deposit:</span>
                            <span class="calc-value">500,000 LUNC</span>
                        </div>
                        <div class="calc-arrow">↓</div>
                        <div class="calc-step">
                            <span class="calc-label">Credits Minted:</span>
                            <span class="calc-value">7,500 Credits</span>
                        </div>
                        <div class="calc-arrow">↓</div>
                        <div class="calc-step">
                            <span class="calc-label">Assuming 5% APR:</span>
                            <span class="calc-value">25,000 LUNC/year yield</span>
                        </div>
                        <div class="calc-arrow">↓</div>
                        <div class="calc-step">
                            <span class="calc-label">80% to Minting:</span>
                            <span class="calc-value">20,000 LUNC = ~300 Credits/year</span>
                        </div>
                    </div>

                    <h3>🏦 Credit Economy</h3>
                    <p class="pillar-text">
                        Credits are the <strong>universal currency</strong> of The RD Station. Use them to:
                    </p>
                    <ul class="feature-list">
                        <li><strong>Play Games:</strong> Luncopoly Blitz entry costs 50 Credits</li>
                        <li><strong>Chat:</strong> Each Social Wall message costs 1 Credit (earns +10 Points)</li>
                        <li><strong>Trade:</strong> Future marketplace for in-game assets</li>
                    </ul>

                    <h3>🔒 Security & Guarantees</h3>
                    <div class="warning-box">
                        <h4>⚠️ Important Notes</h4>
                        <ul>
                            <li>This is a <strong>simulation environment</strong> for testing strategies</li>
                            <li>In production, deposits will require <strong>real blockchain transactions</strong></li>
                            <li>Your deposited LUNC remains in <strong>secure cold storage</strong></li>
                            <li>Withdrawal requests are processed within <strong>24-48 hours</strong></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ================================
// PILLAR 2: LUNCOPOLY BLITZ RULES
// ================================

function renderPillar2() {
    return `
        <div class="accordion-section" id="pillar2">
            <button class="accordion-header" onclick="toggleAccordion('pillar2')">
                <div class="accordion-title">
                    <span class="accordion-icon">🎲</span>
                    <h2>Pillar 2: Luncopoly Blitz Rules</h2>
                </div>
                <span class="accordion-arrow">▼</span>
            </button>
            <div class="accordion-content">
                <div class="pillar-content">
                    <h3>🎮 Game Overview</h3>
                    <p class="pillar-text">
                        <strong>Luncopoly Blitz</strong> is a fast-paced, strategic board game inspired by Monopoly
                        but optimized for blockchain gaming. Master the Blitz strategy to climb the Monthly RD Leaderboard!
                    </p>

                    <h3>⚡ Core Mechanics</h3>
                    <div class="info-box magenta-theme">
                        <h4>Game Setup</h4>
                        <ul>
                            <li><strong>Entry Fee:</strong> 50 Credits (deducted from your balance)</li>
                            <li><strong>Prize Pool:</strong> 250 Credits (distributed to winners)</li>
                            <li><strong>Starting Capital:</strong> 1,500 L (in-game currency)</li>
                            <li><strong>Board:</strong> 24 tiles (properties, events, special spaces)</li>
                            <li><strong>Players:</strong> 2-5 per table (bots fill empty slots after 5 minutes)</li>
                        </ul>
                    </div>

                    <h3>⏱️ The 10-Second Blitz Timer</h3>
                    <p class="pillar-text">
                        Every turn has a <strong>strict 10-second countdown</strong>. If you don't act within 10 seconds:
                    </p>
                    <ul class="feature-list">
                        <li>Your turn is <strong>automatically skipped</strong></li>
                        <li>You <strong>lose the opportunity</strong> to buy the property you landed on</li>
                        <li>The property goes to <strong>instant auction</strong> (30-second timer)</li>
                    </ul>

                    <h3>🤝 The 1-Minute Trade Rule (Silence-Asset)</h3>
                    <div class="rule-box">
                        <h4>Trading Mechanics</h4>
                        <p>Players can propose trades with other players, but there's a catch:</p>
                        <ul>
                            <li>Trade proposals have a <strong>1-minute acceptance window</strong></li>
                            <li>During this window, the offered assets are <strong>"silenced"</strong> (locked)</li>
                            <li>If the trade is rejected or expires, assets are <strong>unlocked</strong></li>
                            <li>Strategic tip: Only trade when you have a <strong>clear advantage</strong></li>
                        </ul>
                    </div>

                    <h3>🔨 The 30-Second Auction System</h3>
                    <p class="pillar-text">
                        When a player declines to buy a property (or times out), it goes to auction:
                    </p>
                    <div class="auction-flow">
                        <div class="flow-step">
                            <span class="flow-number">1</span>
                            <p>Property enters auction with <strong>30-second timer</strong></p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step">
                            <span class="flow-number">2</span>
                            <p>Players bid in <strong>real-time</strong> (minimum increment: 50 L)</p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step">
                            <span class="flow-number">3</span>
                            <p>Highest bidder wins when timer expires</p>
                        </div>
                    </div>

                    <h3>🏆 Victory Conditions</h3>
                    <div class="victory-box">
                        <h4>How to Win</h4>
                        <p>The game ends when all players except one go <strong>bankrupt</strong> (capital reaches 0 L).</p>
                        <p><strong>Prize Distribution:</strong></p>
                        <ul>
                            <li>🥇 1st Place: 150 Credits + 1,000 Points</li>
                            <li>🥈 2nd Place: 70 Credits + 500 Points</li>
                            <li>🥉 3rd Place: 30 Credits + 300 Points</li>
                            <li>4th-5th Place: 100 Points each</li>
                        </ul>
                    </div>

                    <h3>🤖 Bot Strategy</h3>
                    <div class="warning-box">
                        <h4>💡 Understanding Bots</h4>
                        <p>
                            Bots in The RD Station use <strong>conservative strategies</strong>. They:
                        </p>
                        <ul>
                            <li>Rarely engage in trades unless highly advantageous</li>
                            <li>Bid cautiously in auctions (max 80% of property value)</li>
                            <li>Focus on completing color groups before upgrading</li>
                            <li><strong>Important:</strong> Bot winnings are <strong>burned</strong> to protect the economy</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ================================
// PILLAR 3: SOCIAL REWARDS
// ================================

function renderPillar3() {
    return `
        <div class="accordion-section" id="pillar3">
            <button class="accordion-header" onclick="toggleAccordion('pillar3')">
                <div class="accordion-title">
                    <span class="accordion-icon">🎯</span>
                    <h2>Pillar 3: Social Rewards System</h2>
                </div>
                <span class="accordion-arrow">▼</span>
            </button>
            <div class="accordion-content">
                <div class="pillar-content">
                    <h3>🌟 Overview</h3>
                    <p class="pillar-text">
                        The RD Station rewards <strong>authentic community engagement</strong> through our
                        Social-to-Earn system. Complete tasks on Twitter/X, Reddit, and Blogger to earn
                        Credits and Ranking Points.
                    </p>

                    <h3>🎁 The 100% / 50% Loyalty System</h3>
                    <div class="info-box green-theme">
                        <h4>Reward Tiers Explained</h4>
                        <div class="reward-tier">
                            <div class="tier-badge first-time">100%</div>
                            <div class="tier-details">
                                <h5>First-Time Rewards</h5>
                                <p>When you complete a task for the <strong>first time</strong>, you receive the <strong>full reward</strong>:</p>
                                <ul>
                                    <li>Follow @RenditeDigitali: <strong>300 Points</strong></li>
                                    <li>Follow Blog: <strong>500 Points</strong></li>
                                    <li>Join r/LunaClassic: <strong>400 Points</strong></li>
                                </ul>
                            </div>
                        </div>
                        <div class="reward-tier">
                            <div class="tier-badge loyalty">50%</div>
                            <div class="tier-details">
                                <h5>Loyalty Rewards</h5>
                                <p>If you've already completed the task before, you receive <strong>50% of the reward</strong>:</p>
                                <ul>
                                    <li>This prevents reward farming</li>
                                    <li>Encourages authentic, long-term engagement</li>
                                    <li>Loyalty badge displayed on your profile</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <h3>📉 Dynamic Upvote Deduction</h3>
                    <div class="warning-box">
                        <h4>⚠️ Anti-Gaming Mechanism</h4>
                        <p>
                            To ensure fair play, The RD Station monitors <strong>upvote persistence</strong>:
                        </p>
                        <ul>
                            <li>If you upvote a Reddit post and later <strong>remove the upvote</strong>, the Points are <strong>deducted</strong></li>
                            <li>This applies to all votable content (Reddit posts, blog comments, etc.)</li>
                            <li>Regular audits ensure reward integrity</li>
                            <li><strong>Penalty:</strong> Repeated removals may result in <strong>temporary suspension</strong></li>
                        </ul>
                    </div>

                    <h3>✅ Verification System</h3>
                    <p class="pillar-text">
                        Each task has a <strong>"Check & Verify"</strong> button that:
                    </p>
                    <ol class="numbered-list">
                        <li>Queries the social platform API (Twitter, Reddit, Blogger)</li>
                        <li>Confirms your username has completed the action</li>
                        <li>Awards the appropriate tier (100% or 50%)</li>
                        <li>Updates your profile with the completion badge</li>
                    </ol>

                    <h3>🏆 Monthly Leaderboard</h3>
                    <div class="leaderboard-box">
                        <h4>Ranking System</h4>
                        <p>The <strong>Monthly RD Leaderboard</strong> ranks players by <strong>Ranking Points</strong>:</p>
                        <ul>
                            <li>Top 10 players share the <strong>50% APR Prize Pool</strong> (from staking yield)</li>
                            <li>Leaderboard resets on the <strong>1st of every month</strong></li>
                            <li>Points earned from: Social tasks, game victories, chat activity</li>
                        </ul>
                        <p class="highlight-text">
                            🎯 <strong>Pro Tip:</strong> Combine social tasks with Luncopoly victories for maximum points!
                        </p>
                    </div>

                    <h3>📋 Available Tasks</h3>
                    <div class="tasks-grid">
                        <div class="task-category">
                            <h5>🐦 Twitter / X</h5>
                            <ul>
                                <li>Follow @RenditeDigitali (300 pts)</li>
                                <li>Like Latest Post (30 pts + 2 credits)</li>
                                <li>Repost Article (200 pts + 10 credits)</li>
                            </ul>
                        </div>
                        <div class="task-category">
                            <h5>📰 Blog</h5>
                            <ul>
                                <li>Follow Blog (500 pts)</li>
                                <li>Comment on Article (50 pts + 5 credits)</li>
                            </ul>
                        </div>
                        <div class="task-category">
                            <h5>🤖 Reddit</h5>
                            <ul>
                                <li>Join r/LunaClassic (400 pts)</li>
                                <li>Upvote Latest Post (40 pts + 2 credits)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ================================
// PILLAR 4: THE BURN CONCEPT
// ================================

function renderPillar4() {
    return `
        <div class="accordion-section" id="pillar4">
            <button class="accordion-header" onclick="toggleAccordion('pillar4')">
                <div class="accordion-title">
                    <span class="accordion-icon">🔥</span>
                    <h2>Pillar 4: The Burn Concept</h2>
                </div>
                <span class="accordion-arrow">▼</span>
            </button>
            <div class="accordion-content">
                <div class="pillar-content">
                    <h3>🔥 Why Burn Bot Winnings?</h3>
                    <p class="pillar-text">
                        The RD Station implements a <strong>strategic burn mechanism</strong> to protect
                        the Credit economy and ensure long-term sustainability.
                    </p>

                    <h3>🤖 Bot Economic Impact</h3>
                    <div class="info-box burn-theme">
                        <h4>The Problem Without Burning</h4>
                        <p>Consider a scenario without bot burning:</p>
                        <ul>
                            <li>Bots win games and accumulate Credits</li>
                            <li>These Credits <strong>never re-enter circulation</strong></li>
                            <li>Over time, bots become "black holes" for Credits</li>
                            <li>Human players face <strong>deflation</strong> and Credit scarcity</li>
                            <li>The economy becomes <strong>unsustainable</strong></li>
                        </ul>
                    </div>

                    <h3>✨ The Burn Solution</h3>
                    <p class="pillar-text">
                        When a bot wins a Luncopoly game, its prize Credits are <strong>permanently burned</strong>:
                    </p>
                    <div class="burn-flow">
                        <div class="flow-step">
                            <span class="flow-icon">🤖</span>
                            <p><strong>Bot Wins Game</strong><br>Earns 150 Credits</p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step">
                            <span class="flow-icon">🔥</span>
                            <p><strong>Credits Burned</strong><br>Removed from supply</p>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step">
                            <span class="flow-icon">📊</span>
                            <p><strong>Supply Decreases</strong><br>Remaining Credits gain value</p>
                        </div>
                    </div>

                    <h3>📊 Burn Tracker</h3>
                    <div class="tracker-box">
                        <h4>Real-Time Metrics</h4>
                        <p>Monitor the burn rate via the <strong>Dashboard Ticker</strong>:</p>
                        <ul>
                            <li><strong>24-Hour Burn:</strong> Total Credits burned by bots today</li>
                            <li><strong>Historical Burn:</strong> All-time burn statistics</li>
                            <li><strong>Burn Rate:</strong> Average Credits burned per game</li>
                        </ul>
                        <p class="highlight-text">
                            💡 <strong>Fun Fact:</strong> As of January 2026, bots have burned over
                            <strong>50,000 Credits</strong>, protecting the economy!
                        </p>
                    </div>

                    <h3>🎯 Strategic Implications</h3>
                    <div class="strategy-box">
                        <h4>How This Benefits You</h4>
                        <ol class="numbered-list">
                            <li>
                                <strong>Credit Value Preservation:</strong> With controlled supply, your
                                Credits maintain purchasing power
                            </li>
                            <li>
                                <strong>Deflationary Pressure:</strong> As supply decreases, demand for
                                Credits increases (basic economics)
                            </li>
                            <li>
                                <strong>Fair Competition:</strong> Bots don't accumulate wealth that
                                could distort the economy
                            </li>
                            <li>
                                <strong>Sustainable Growth:</strong> The burn mechanism ensures long-term
                                viability of The RD Station
                            </li>
                        </ol>
                    </div>

                    <h3>🔮 Future Enhancements</h3>
                    <div class="warning-box">
                        <h4>🚀 Roadmap</h4>
                        <p>The burn mechanism will evolve with these planned features:</p>
                        <ul>
                            <li><strong>Dynamic Burn Rate:</strong> Adjust burn percentage based on economy health</li>
                            <li><strong>LUNC Buyback:</strong> Use burned Credits to buy and burn LUNC tokens</li>
                            <li><strong>Community Governance:</strong> Vote on burn policy changes</li>
                            <li><strong>Burn Rewards:</strong> Bonus points for playing against bot-heavy tables</li>
                        </ul>
                    </div>

                    <h3>📈 Economic Philosophy</h3>
                    <p class="pillar-text">
                        The RD Station follows the <strong>Rendite Digitali LUNC strategy</strong>, which
                        prioritizes <strong>sustainable yield</strong> over short-term gains. The burn
                        mechanism is a core pillar of this philosophy:
                    </p>
                    <blockquote class="philosophy-quote">
                        "In blockchain ecosystems, <strong>controlled scarcity</strong> creates value.
                        By burning bot winnings, we ensure that human players—the true community—
                        benefit from a healthy, balanced economy."
                        <cite>— The RD Station Whitepaper</cite>
                    </blockquote>
                </div>
            </div>
        </div>
    `;
}

// ================================
// GLOSSARY SECTION
// ================================

function renderGlossary() {
    return `
        <div class="accordion-section" id="glossary">
            <button class="accordion-header" onclick="toggleAccordion('glossary')">
                <div class="accordion-title">
                    <span class="accordion-icon">📚</span>
                    <h2>Glossary: Key Terms</h2>
                </div>
                <span class="accordion-arrow">▼</span>
            </button>
            <div class="accordion-content">
                <div class="pillar-content">
                    <div class="glossary-grid">
                        <div class="glossary-item">
                            <h4 class="glossary-term">Credits</h4>
                            <p class="glossary-definition">
                                The universal currency of The RD Station. Earned through LUNC staking deposits
                                and used for game entry, chat, and future marketplace transactions.
                                <strong>Symbol:</strong> ⚡
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">L (Lunari)</h4>
                            <p class="glossary-definition">
                                The in-game currency used exclusively within Luncopoly Blitz. All players
                                start with 1,500 L. Not transferable outside the game.
                                <strong>Symbol:</strong> L
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Ranking Points</h4>
                            <p class="glossary-definition">
                                Points earned through social tasks, game victories, and chat activity.
                                Used to rank players on the Monthly RD Leaderboard. Resets every month.
                                <strong>Symbol:</strong> 🎯
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Match Points (1-5 Scale)</h4>
                            <p class="glossary-definition">
                                A skill rating system for Luncopoly Blitz players. Ranges from 1 (Novice)
                                to 5 (Grandmaster). Affects matchmaking and leaderboard weight.
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Staking Levels (Buildings)</h4>
                            <p class="glossary-definition">
                                Visual representation of your stake size on the Staking Dashboard. Higher
                                deposits unlock cooler building graphics (e.g., Satellite Dish, Space Station).
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Commander</h4>
                            <p class="glossary-definition">
                                How The RD Station addresses all users. You're not just a "player"—you're
                                a commander of your economic strategy in the Terra Classic ecosystem.
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">RD Node</h4>
                            <p class="glossary-definition">
                                The backend server infrastructure powering The RD Station. All game logic,
                                staking calculations, and social verifications run through the RD Node.
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Silence-Asset</h4>
                            <p class="glossary-definition">
                                During the 1-minute trade window, offered assets are "silenced" (locked)
                                to prevent double-trading or withdrawal. Unlocks if trade is rejected.
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Blitz Mode</h4>
                            <p class="glossary-definition">
                                The 10-second turn timer that makes Luncopoly fast-paced. Requires quick
                                decision-making and strategic planning. No time for hesitation!
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Burn Reserve</h4>
                            <p class="glossary-definition">
                                10% of staking APR is allocated to a reserve fund used for burning LUNC
                                tokens or Credits when bot winnings are destroyed.
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Sustainability Vault</h4>
                            <p class="glossary-definition">
                                10% of staking APR goes into a vault used for server costs, development,
                                and future feature funding. Ensures long-term platform viability.
                            </p>
                        </div>

                        <div class="glossary-item">
                            <h4 class="glossary-term">Conservative Bot Strategy</h4>
                            <p class="glossary-definition">
                                Bots in Luncopoly use risk-averse tactics: cautious bidding, rare trades,
                                and property-focused play. Designed to be beatable by skilled human players.
                            </p>
                        </div>
                    </div>

                    <div class="glossary-footer">
                        <h3>🎓 Still Have Questions?</h3>
                        <p>
                            If you need clarification on any term or concept, reach out to the community:
                        </p>
                        <div class="contact-links">
                            <a href="https://twitter.com/RenditeDigitali" target="_blank" class="contact-btn">
                                <span>🐦</span> Twitter/X
                            </a>
                            <a href="https://renditedigitali.blogspot.com" target="_blank" class="contact-btn">
                                <span>📰</span> Blog
                            </a>
                            <a href="https://reddit.com/r/LunaClassic" target="_blank" class="contact-btn">
                                <span>🤖</span> Reddit
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ================================
// ACCORDION FUNCTIONALITY
// ================================

function setupAccordion() {
    // Add click listeners to all accordion headers
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        // Click handler is inline (onclick attribute)
        // Just add keyboard support
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                header.click();
            }
        });
    });
}

function toggleAccordion(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const header = section.querySelector('.accordion-header');
    const content = section.querySelector('.accordion-content');
    const arrow = section.querySelector('.accordion-arrow');

    const isOpen = section.classList.contains('open');

    if (isOpen) {
        section.classList.remove('open');
        content.style.maxHeight = '0';
        arrow.textContent = '▼';
    } else {
        // Close all other sections first
        document.querySelectorAll('.accordion-section.open').forEach(openSection => {
            openSection.classList.remove('open');
            openSection.querySelector('.accordion-content').style.maxHeight = '0';
            openSection.querySelector('.accordion-arrow').textContent = '▼';
        });

        // Open this section
        section.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
        arrow.textContent = '▲';
    }
}

// Make function globally accessible
window.toggleAccordion = toggleAccordion;

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Open the section if closed
    if (!section.classList.contains('open')) {
        toggleAccordion(sectionId);
    }

    // Scroll to section with offset for header
    setTimeout(() => {
        const yOffset = -100; // Offset for fixed header
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }, 300);
}

// Make function globally accessible
window.scrollToSection = scrollToSection;

// ================================
// MANUAL BUTTON SETUP
// ================================

function setupManualListeners() {
    // Add listener to help button in navbar (will be added in HTML)
    const helpButton = document.getElementById('helpBtn');
    if (helpButton) {
        helpButton.addEventListener('click', openStationManual);
    }
}

function openStationManual() {
    // Navigate to manual page
    if (window.app && window.app.navigateTo) {
        window.app.navigateTo('manual');
    }
}

// ================================
// EXPORTS
// ================================

window.stationManual = {
    initialize: initializeStationManual,
    render: renderStationManual,
    showWelcomeModal,
    openManual: openStationManual
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStationManual);
} else {
    initializeStationManual();
}
