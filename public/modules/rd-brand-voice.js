// ================================
// THE RD STATION - BRAND VOICE
// Unified messaging and localization system
// ================================

const RD_BRAND_VOICE = {
    // ================================
    // SYSTEM MESSAGES & NOTIFICATIONS
    // ================================

    system: {
        // Loading states
        loadingGame: "Syncing with the RD Node...",
        loadingData: "Retrieving station data...",
        connecting: "Establishing secure connection...",
        processing: "Processing your request, Commander...",
        calculating: "Running yield calculations...",

        // Success messages
        success: "Operation completed successfully.",
        depositSuccess: "Commander, your LUNC has been secured in the vault.",
        creditsMinted: "Credits successfully minted to your balance.",
        taskCompleted: "Mission accomplished! Rewards transferred.",
        voteRegistered: "Your vote has been recorded by the RD Node.",
        tradeAccepted: "Trade confirmed. Assets transferred.",

        // Error messages
        error: "System error detected. Please retry.",
        insufficientCredits: "Insufficient Credits. Visit Staking Hub to mint more.",
        insufficientBalance: "Insufficient L balance for this transaction.",
        networkError: "Unable to reach RD Node. Check your connection.",
        invalidInput: "Invalid input detected. Please verify your data.",
        sessionExpired: "Session expired. Please reconnect to the station.",

        // Welcome messages
        welcome: "Commander, welcome to The RD Station.",
        welcomeBack: "Welcome back, Commander. All systems operational.",
        firstLogin: "Greetings, new Commander. Initiating onboarding sequence...",

        // Game messages
        gameStarting: "Luncopoly Blitz initiating. Prepare for deployment.",
        turnStart: "Your turn, Commander. 10 seconds to execute.",
        turnSkipped: "Turn auto-skipped. Decision window closed.",
        playerBankrupt: "Commander {player} has been eliminated.",
        gameOver: "Match concluded. Final results calculated.",
        victory: "Victory achieved! Prize Credits incoming.",

        // Lobby messages
        joiningLobby: "Entering lobby. Scanning for opponents...",
        lobbyFull: "Table full. Match launching in 3... 2... 1...",
        waitingPlayers: "Awaiting additional commanders. ETA: {time}",
        botsDeployed: "Deploying AI opponents to fill empty slots.",
        lobbyLeft: "You've exited the lobby. Credits refunded.",

        // Social rewards
        verifying: "Verifying social action via platform API...",
        taskVerified: "Task verified. Awarding {reward} to your account.",
        alreadyCompleted: "Task already completed. Loyalty reward applied.",
        upvoteRemoved: "Upvote removal detected. Applying deduction penalty.",

        // Staking
        stakingDeposit: "Depositing {amount} LUNC to the secure vault...",
        stakingSuccess: "Deposit confirmed. {credits} Credits minted.",
        yieldCalculated: "Your daily yield: {amount} Credits/day.",
        withdrawalRequest: "Withdrawal request submitted. Processing in 24-48 hours.",

        // Auction
        auctionStart: "Property auction initiated. 30-second bidding window.",
        bidPlaced: "Bid registered: {amount} L",
        auctionWon: "Auction won! Property transferred to your portfolio.",
        auctionLost: "Outbid. Another commander claimed the property.",

        // Trade
        tradeProposed: "Trade proposal sent. Assets silenced for 1 minute.",
        tradeRejected: "Trade rejected. Assets unlocked.",
        tradeExpired: "Trade proposal expired. Assets released.",

        // Maintenance
        maintenance: "The RD Station is undergoing scheduled maintenance.",
        maintenanceEnd: "Maintenance complete. All systems restored.",
        updateAvailable: "New station update available. Refresh recommended."
    },

    // ================================
    // UI LABELS & HEADINGS
    // ================================

    ui: {
        // Navigation
        home: "Mission Control",
        stakingHub: "Staking Hub",
        gameCenter: "Game Center",
        socialRewards: "Social Rewards",
        rdInsights: "RD Insights",
        manual: "Station Manual",

        // Buttons
        enter: "Enter",
        connect: "Connect to Station",
        disconnect: "Disconnect",
        play: "Deploy",
        cancel: "Abort",
        confirm: "Confirm",
        back: "Return",
        next: "Proceed",
        submit: "Submit",

        // Status
        online: "Operational",
        offline: "Offline",
        connecting: "Connecting...",
        syncing: "Syncing...",
        active: "Active",
        inactive: "Inactive",

        // Game states
        waiting: "Standby Mode",
        inProgress: "In Progress",
        completed: "Completed",
        victory: "Victory",
        defeat: "Eliminated",

        // Time
        timeRemaining: "Time Remaining",
        expires: "Expires",
        lastUpdated: "Last Updated",

        // Stats
        balance: "Balance",
        rank: "Rank",
        level: "Level",
        points: "Points",
        credits: "Credits",
        capital: "Capital"
    },

    // ================================
    // STRATEGIC DESCRIPTIONS
    // ================================

    descriptions: {
        stakingHub: "Simulate the official Rendite Digitali LUNC staking strategy. Deposit LUNC to mint Credits through our 80% APR minting system. Your capital is 100% protected in secure cold storage.",

        gameCenter: "Master the Blitz strategy to climb the Monthly RD Leaderboard. Fast-paced Luncopoly with 10-second turns, strategic auctions, and 250 Credit prize pools. Conservative bots ensure fair competition.",

        socialRewards: "Earn Credits and Ranking Points by supporting the Rendite Digitali community. Complete social tasks on Twitter/X, Reddit, and Blogger. First-time rewards: 100%. Loyalty rewards: 50%.",

        rdInsights: "Stay informed with the latest LUNC strategies, blockchain gaming insights, and Terra Classic ecosystem updates from Rendite Digitali. Vote on articles to earn bonus points.",

        burnConcept: "Bot winnings are permanently burned to protect the Credit economy. This deflationary mechanism ensures sustainable value for all commanders. Transparency via 24-hour burn tracker.",

        mintingEngine: "80% of staking APR is allocated to Credit minting. The remaining 20% is split between the Sustainability Vault (10%) and Burn Reserve (10%). Example: 100,000 LUNC = 1,500 Credits minted instantly.",

        leaderboard: "The Monthly RD Leaderboard ranks commanders by Ranking Points. Top 10 players share the 50% APR Prize Pool. Reset occurs on the 1st of every month. Climb the ranks through social tasks, game victories, and community engagement."
    },

    // ================================
    // COMMANDER RANKS (BASED ON POINTS)
    // ================================

    ranks: {
        0: { name: "Cadet", icon: "🎖️" },
        500: { name: "Lieutenant", icon: "⭐" },
        1500: { name: "Captain", icon: "⚡" },
        5000: { name: "Commander", icon: "💎" },
        15000: { name: "Admiral", icon: "🏆" },
        50000: { name: "Grand Admiral", icon: "👑" }
    },

    // ================================
    // TOOLTIPS & HELP TEXT
    // ================================

    tooltips: {
        credits: "Credits are the universal currency of The RD Station. Use them for game entry, chat, and future marketplace transactions.",

        lunari: "L (Lunari) is the in-game currency for Luncopoly Blitz. Starting balance: 1,500 L. Not transferable outside the game.",

        rankingPoints: "Ranking Points determine your position on the Monthly RD Leaderboard. Earn them through social tasks, game victories, and chat activity.",

        matchPoints: "Match Points represent your Luncopoly skill level (1-5 scale). Higher ratings unlock better matchmaking and leaderboard weight.",

        burnTracker: "Displays Credits burned by bot winnings in the last 24 hours. This deflationary mechanism protects the Credit economy.",

        yieldWidget: "Real-time calculation of your daily and monthly Credit yield based on staked LUNC and the 80% APR minting rule.",

        prizePool: "Each Luncopoly game has a 250 Credit prize pool distributed to winners. Entry fee: 50 Credits.",

        silenceAsset: "During the 1-minute trade window, offered assets are 'silenced' (locked) to prevent double-trading. Unlocks if rejected."
    },

    // ================================
    // MODAL TITLES
    // ================================

    modals: {
        welcome: "Welcome to The RD Station",
        deposit: "Deposit LUNC",
        withdraw: "Withdraw LUNC",
        trade: "Propose Trade",
        auction: "Property Auction",
        cardDraw: "Card Revealed",
        gameOver: "Match Results",
        tutorial: "Commander Tutorial",
        settings: "Station Settings",
        profile: "Commander Profile",
        leaderboard: "Monthly RD Leaderboard",
        manual: "Station Manual"
    }
};

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Get a brand voice message by key path
 * @param {string} path - Dot notation path (e.g., "system.welcome")
 * @param {object} vars - Variables to replace in message (e.g., {player: "Alice"})
 * @returns {string} - Branded message
 */
function getBrandMessage(path, vars = {}) {
    const keys = path.split('.');
    let message = RD_BRAND_VOICE;

    for (const key of keys) {
        if (message[key] === undefined) {
            console.warn(`Brand voice key not found: ${path}`);
            return path;
        }
        message = message[key];
    }

    // Replace variables in message
    if (typeof message === 'string') {
        return message.replace(/\{(\w+)\}/g, (match, key) => {
            return vars[key] !== undefined ? vars[key] : match;
        });
    }

    return message;
}

/**
 * Get commander rank based on points
 * @param {number} points - Ranking points
 * @returns {object} - Rank object with name and icon
 */
function getCommanderRank(points) {
    const ranks = RD_BRAND_VOICE.ranks;
    const thresholds = Object.keys(ranks).map(Number).sort((a, b) => b - a);

    for (const threshold of thresholds) {
        if (points >= threshold) {
            return ranks[threshold];
        }
    }

    return ranks[0]; // Default to Cadet
}

/**
 * Format notification with brand voice
 * @param {string} type - Message type (success, error, info, warning)
 * @param {string} message - Message key or custom text
 * @param {object} vars - Variables to replace
 * @returns {object} - Notification object
 */
function createBrandedNotification(type, message, vars = {}) {
    const icon = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    }[type] || 'ℹ️';

    const text = message.includes('.') ? getBrandMessage(message, vars) : message;

    return {
        type,
        icon,
        message: text,
        timestamp: Date.now()
    };
}

// ================================
// EXPORTS
// ================================

window.RD_BRAND_VOICE = RD_BRAND_VOICE;
window.getBrandMessage = getBrandMessage;
window.getCommanderRank = getCommanderRank;
window.createBrandedNotification = createBrandedNotification;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RD_BRAND_VOICE,
        getBrandMessage,
        getCommanderRank,
        createBrandedNotification
    };
}
