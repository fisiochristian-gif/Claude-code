// ================================
// MISSION CONTROL MODULE
// Combines: Blog Iframe, Social-to-Earn, Monthly Leaderboard
// ================================

let missionInitialized = false;
let socialRewards = {};

// ================================
// INITIALIZATION
// ================================

async function initializeMissionControl() {
    console.log('📈 Initializing MISSION CONTROL...');

    if (!missionInitialized) {
        await loadSocialRewards();
        initializeBlogIframe();
        initializeSocialTasks();
        loadMonthlyLeaderboard();
        missionInitialized = true;
    }
}

async function loadSocialRewards() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/social/rewards`);
        socialRewards = await response.json();
        console.log('✅ Social rewards loaded:', socialRewards);
    } catch (error) {
        console.error('Error loading social rewards:', error);
    }
}

// ================================
// BLOG IFRAME (LEFT PANEL)
// ================================

function initializeBlogIframe() {
    const blogIframe = document.getElementById('blogIframe');

    if (blogIframe) {
        blogIframe.src = 'https://renditedigitali.blogspot.com';
        blogIframe.onload = () => {
            console.log('📰 Blog iframe loaded');
        };
        blogIframe.onerror = () => {
            console.error('❌ Error loading blog iframe');
            const blogContainer = document.getElementById('blogPanel');
            if (blogContainer) {
                blogContainer.innerHTML = `
                    <div class="iframe-error">
                        <h3>⚠️ Errore Caricamento Blog</h3>
                        <p>Il blog potrebbe non consentire il caricamento in iframe.</p>
                        <a href="https://renditedigitali.blogspot.com" target="_blank" class="cyber-button">
                            Apri Blog in Nuova Tab
                        </a>
                    </div>
                `;
            }
        };
    }
}

// ================================
// SOCIAL-TO-EARN TASKS (RIGHT PANEL)
// ================================

function initializeSocialTasks() {
    console.log('🎯 Initializing Social-to-Earn tasks...');

    renderMissionCards();
    loadUserSocialActions();
}

function renderMissionCards() {
    const tasksContainer = document.querySelector('.tasks-container');
    if (!tasksContainer) return;

    // Mission Cards Configuration
    const missions = [
        {
            id: 'follow_blog',
            icon: '📰',
            title: 'Follow Blog',
            description: 'Segui il blog "Rendite Digitali" per ricevere punti bonus (azione unica)',
            points: socialRewards.follow_blog?.points || 500,
            cost: socialRewards.follow_blog?.credits || 0,
            requiresInput: false,
            externalLink: 'https://renditedigitali.blogspot.com',
            placeholder: null
        },
        {
            id: 'comment_blog',
            icon: '💬',
            title: 'Comment Blog',
            description: 'Lascia un commento su un post del blog e inserisci il link al commento',
            points: socialRewards.comment_blog?.points || 50,
            cost: socialRewards.comment_blog?.credits || 5,
            requiresInput: true,
            externalLink: 'https://renditedigitali.blogspot.com',
            placeholder: 'https://renditedigitali.blogspot.com/...'
        },
        {
            id: 'x_follow',
            icon: '🐦',
            title: 'Follow su X',
            description: 'Segui l\'account X (Twitter) ufficiale per ricevere punti bonus (azione unica)',
            points: socialRewards.x_follow?.points || 300,
            cost: socialRewards.x_follow?.credits || 0,
            requiresInput: false,
            externalLink: 'https://x.com/LUNC_HORIZON',
            placeholder: null
        },
        {
            id: 'x_like',
            icon: '❤️',
            title: 'Like su X',
            description: 'Metti like ad un post su X e inserisci il link al post',
            points: socialRewards.x_like?.points || 30,
            cost: socialRewards.x_like?.credits || 2,
            requiresInput: true,
            externalLink: 'https://x.com/LUNC_HORIZON',
            placeholder: 'https://x.com/...'
        },
        {
            id: 'x_repost',
            icon: '🔄',
            title: 'Repost su X',
            description: 'Fai repost di un post su X e inserisci il link al tuo repost',
            points: socialRewards.x_repost?.points || 200,
            cost: socialRewards.x_repost?.credits || 10,
            requiresInput: true,
            externalLink: 'https://x.com/LUNC_HORIZON',
            placeholder: 'https://x.com/...'
        },
        {
            id: 'reddit_join',
            icon: '🤖',
            title: 'Join Subreddit',
            description: 'Unisciti al subreddit ufficiale per ricevere punti bonus (azione unica)',
            points: socialRewards.reddit_join?.points || 400,
            cost: socialRewards.reddit_join?.credits || 0,
            requiresInput: false,
            externalLink: 'https://reddit.com/r/LuncHorizon',
            placeholder: null
        },
        {
            id: 'reddit_upvote',
            icon: '⬆️',
            title: 'Upvote su Reddit',
            description: 'Dai upvote ad un post su Reddit e inserisci il link al post',
            points: socialRewards.reddit_upvote?.points || 40,
            cost: socialRewards.reddit_upvote?.credits || 2,
            requiresInput: true,
            externalLink: 'https://reddit.com/r/LuncHorizon',
            placeholder: 'https://reddit.com/r/...'
        }
    ];

    tasksContainer.innerHTML = missions.map(mission => `
        <div class="mission-card" data-mission-id="${mission.id}">
            <div class="mission-card-header">
                <div class="mission-card-title">
                    <span>${mission.icon}</span>
                    <span>${mission.title}</span>
                </div>
                <div class="mission-card-rewards">
                    <span class="reward-points">+${mission.points} 🎯</span>
                    <span class="reward-cost ${mission.cost === 0 ? 'free' : ''}">${mission.cost === 0 ? 'GRATIS' : mission.cost + ' ⚡'}</span>
                </div>
            </div>
            <div class="mission-card-body">
                <p class="mission-card-description">${mission.description}</p>
                ${mission.requiresInput ? `
                    <input
                        type="text"
                        class="mission-card-input"
                        id="${mission.id}_input"
                        placeholder="${mission.placeholder}"
                    >
                    <button class="mission-card-button" onclick="handleMissionVerify('${mission.id}')">
                        ✅ VERIFICA
                    </button>
                ` : `
                    <a href="${mission.externalLink}" target="_blank" class="mission-card-link">
                        🔗 VAI AL SITO
                    </a>
                    <button class="mission-card-button" onclick="handleMissionVerify('${mission.id}')" style="margin-top: 0.8rem;">
                        ✅ VERIFICA
                    </button>
                `}
            </div>
        </div>
    `).join('');

    // Add history section
    tasksContainer.innerHTML += `
        <div class="task-history">
            <h4>📜 Le Tue Azioni Recenti</h4>
            <div id="socialActionsHistory" class="history-list">
                <div class="loading">Caricamento...</div>
            </div>
        </div>
    `;
}

window.handleMissionVerify = function(missionId) {
    const input = document.getElementById(`${missionId}_input`);
    const link = input ? input.value.trim() : null;

    // Validate link if required
    const reward = socialRewards[missionId];
    if (!reward) {
        showToast('❌ Azione non valida', 'error');
        return;
    }

    // If requires link, validate it
    if (input && !link) {
        showToast('❌ Inserisci il link richiesto', 'error');
        return;
    }

    performSocialAction(missionId, link);
};

async function performSocialAction(actionType, link) {
    if (!window.app.currentUser) {
        showToast('❌ Utente non autenticato', 'error');
        return;
    }

    const reward = socialRewards[actionType];
    if (!reward) {
        showToast('❌ Azione non valida', 'error');
        return;
    }

    // Check if user has enough credits
    if (reward.credits > 0 && window.app.currentUser.crediti < reward.credits) {
        showToast(`❌ Crediti insufficienti! Necessari: ${reward.credits} ⚡`, 'error');
        return;
    }

    const confirmMsg = `Questa azione ${reward.once ? '(una sola volta) ' : ''}ti darà +${reward.points} Punti${reward.credits > 0 ? ` e costerà ${reward.credits} Crediti` : ' (gratis)'}. Confermare?`;

    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`${window.app.API_BASE}/api/social/verify-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.app.currentUser.id_univoco,
                actionType,
                link
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showToast(`❌ ${result.error}`, 'error');
            return;
        }

        // Update local user data
        window.app.currentUser.crediti = result.newCredits;
        window.app.currentUser.punti_classifica = result.newPoints;

        // Update displays
        const creditsDisplay = document.getElementById('creditsDisplay');
        const puntiDisplay = document.getElementById('puntiDisplay');

        if (creditsDisplay) creditsDisplay.textContent = result.newCredits;
        if (puntiDisplay) puntiDisplay.textContent = result.newPoints;

        // Show success toast with points awarded
        showToast(`✅ Azione registrata! +${reward.points} Punti assegnati alla Classifica.`, 'success');

        // Reload user actions and leaderboard
        await loadUserSocialActions();
        await loadMonthlyLeaderboard();

        // Clear input field
        if (link) {
            const input = document.getElementById(`${actionType}_input`);
            if (input) input.value = '';
        }

    } catch (error) {
        console.error('Social action error:', error);
        showToast('❌ Errore durante l\'azione', 'error');
    }
}

async function loadUserSocialActions() {
    if (!window.app.currentUser) return;

    try {
        const response = await fetch(`${window.app.API_BASE}/api/social/actions/${window.app.currentUser.id_univoco}`);
        const actions = await response.json();

        const historyContainer = document.getElementById('socialActionsHistory');
        if (!historyContainer) return;

        if (actions.length === 0) {
            historyContainer.innerHTML = '<div class="no-actions">Nessuna azione completata ancora</div>';
            return;
        }

        historyContainer.innerHTML = '';

        actions.forEach(action => {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-history-item';

            const actionName = getActionName(action.action_type);
            const date = new Date(action.timestamp).toLocaleDateString('it-IT');

            actionDiv.innerHTML = `
                <div class="action-info">
                    <div class="action-name">${actionName}</div>
                    <div class="action-date">${date}</div>
                </div>
                <div class="action-points">+${action.points_earned} Punti</div>
            `;

            historyContainer.appendChild(actionDiv);
        });

    } catch (error) {
        console.error('Error loading social actions:', error);
    }
}

function getActionName(actionType) {
    const names = {
        'follow_blog': '📰 Follow Blog',
        'comment_blog': '💬 Comment Blog',
        'social_wall_message': '💬 Social Wall Message',
        'x_follow': '🐦 X Follow',
        'x_like': '❤️ X Like',
        'x_repost': '🔄 X Repost',
        'reddit_join': '🤖 Reddit Join',
        'reddit_upvote': '⬆️ Reddit Upvote',
        'referral_invite': '🎁 Referral Code'
    };
    return names[actionType] || actionType;
}

// ================================
// MONTHLY LEADERBOARD (BOTTOM PANEL)
// ================================

async function loadMonthlyLeaderboard() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/social/leaderboard`);
        const leaderboard = await response.json();

        const leaderboardContainer = document.getElementById('missionLeaderboard');
        if (!leaderboardContainer) return;

        leaderboardContainer.innerHTML = `
            <div class="leaderboard-header">
                <h3>🏆 CLASSIFICA MENSILE TOP 10</h3>
                <p class="leaderboard-notice">Reset automatico ogni 30 giorni</p>
            </div>
            <div class="leaderboard-grid">
                ${leaderboard.map((entry, index) => `
                    <div class="leaderboard-entry ${index === 0 ? 'rank-1' : ''} ${index === 1 ? 'rank-2' : ''} ${index === 2 ? 'rank-3' : ''}">
                        <div class="rank-badge">#${index + 1}</div>
                        <div class="player-info">
                            <div class="player-name">${entry.username}</div>
                            <div class="player-id">ID: ${entry.id_univoco.substring(0, 8)}</div>
                        </div>
                        <div class="player-stats">
                            <div class="stat-points">${entry.punti_classifica} 🎯</div>
                            <div class="stat-credits">${entry.crediti} ⚡</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        console.log('✅ Monthly leaderboard loaded:', leaderboard.length);

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        const leaderboardContainer = document.getElementById('missionLeaderboard');
        if (leaderboardContainer) {
            leaderboardContainer.innerHTML = '<div class="error-message">Errore caricamento classifica</div>';
        }
    }
}

// ================================
// UTILITIES
// ================================

function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;

    // Add icon based on type
    let icon = '💬';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 5000);
}

// Legacy function for compatibility
function showMissionStatus(message, type = 'info') {
    showToast(message, type);
}

// ================================
// EXPORTS
// ================================

window.initializeMissionControl = initializeMissionControl;
window.loadMonthlyLeaderboard = loadMonthlyLeaderboard;
window.loadUserSocialActions = loadUserSocialActions;
