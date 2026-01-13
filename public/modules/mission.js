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

    setupTaskButtons();
    loadUserSocialActions();
}

function setupTaskButtons() {
    // Blog Actions
    const followBlogBtn = document.getElementById('followBlogBtn');
    const commentBlogBtn = document.getElementById('commentBlogBtn');
    const commentBlogLink = document.getElementById('commentBlogLink');

    // X (Twitter) Actions
    const xFollowBtn = document.getElementById('xFollowBtn');
    const xLikeBtn = document.getElementById('xLikeBtn');
    const xLikeLink = document.getElementById('xLikeLink');
    const xRepostBtn = document.getElementById('xRepostBtn');
    const xRepostLink = document.getElementById('xRepostLink');

    // Reddit Actions
    const redditJoinBtn = document.getElementById('redditJoinBtn');
    const redditUpvoteBtn = document.getElementById('redditUpvoteBtn');
    const redditUpvoteLink = document.getElementById('redditUpvoteLink');

    // Event Listeners
    if (followBlogBtn) {
        followBlogBtn.addEventListener('click', () => performSocialAction('follow_blog', null));
    }

    if (commentBlogBtn && commentBlogLink) {
        commentBlogBtn.addEventListener('click', () => {
            const link = commentBlogLink.value.trim();
            if (!link) {
                showMissionStatus('❌ Inserisci il link al commento', 'error');
                return;
            }
            performSocialAction('comment_blog', link);
        });
    }

    if (xFollowBtn) {
        xFollowBtn.addEventListener('click', () => performSocialAction('x_follow', null));
    }

    if (xLikeBtn && xLikeLink) {
        xLikeBtn.addEventListener('click', () => {
            const link = xLikeLink.value.trim();
            if (!link) {
                showMissionStatus('❌ Inserisci il link al post', 'error');
                return;
            }
            performSocialAction('x_like', link);
        });
    }

    if (xRepostBtn && xRepostLink) {
        xRepostBtn.addEventListener('click', () => {
            const link = xRepostLink.value.trim();
            if (!link) {
                showMissionStatus('❌ Inserisci il link al repost', 'error');
                return;
            }
            performSocialAction('x_repost', link);
        });
    }

    if (redditJoinBtn) {
        redditJoinBtn.addEventListener('click', () => performSocialAction('reddit_join', null));
    }

    if (redditUpvoteBtn && redditUpvoteLink) {
        redditUpvoteBtn.addEventListener('click', () => {
            const link = redditUpvoteLink.value.trim();
            if (!link) {
                showMissionStatus('❌ Inserisci il link all\'upvote', 'error');
                return;
            }
            performSocialAction('reddit_upvote', link);
        });
    }
}

async function performSocialAction(actionType, link) {
    if (!window.app.currentUser) {
        showMissionStatus('❌ Utente non autenticato', 'error');
        return;
    }

    const reward = socialRewards[actionType];
    if (!reward) {
        showMissionStatus('❌ Azione non valida', 'error');
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
            showMissionStatus(`❌ ${result.error}`, 'error');
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

        showMissionStatus(`✅ ${result.message}! Nuovi Punti: ${result.newPoints}`, 'success');

        // Reload user actions and leaderboard
        await loadUserSocialActions();
        await loadMonthlyLeaderboard();

        // Clear input field
        if (link) {
            const inputId = `${actionType}Link`.replace(/_/g, '');
            const input = document.getElementById(inputId);
            if (input) input.value = '';
        }

    } catch (error) {
        console.error('Social action error:', error);
        showMissionStatus('❌ Errore durante l\'azione', 'error');
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

function showMissionStatus(message, type = 'info') {
    const statusDiv = document.getElementById('missionStatus');
    if (!statusDiv) {
        alert(message);
        return;
    }

    statusDiv.textContent = message;
    statusDiv.className = `status-message show ${type}`;

    setTimeout(() => {
        statusDiv.classList.remove('show');
    }, 5000);
}

// ================================
// EXPORTS
// ================================

window.initializeMissionControl = initializeMissionControl;
window.loadMonthlyLeaderboard = loadMonthlyLeaderboard;
window.loadUserSocialActions = loadUserSocialActions;
