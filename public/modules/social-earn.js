// ================================
// SOCIAL-TO-EARN MODULE
// Earn points by performing social actions
// ================================

let socialRewards = null;
let socialEarnInitialized = false;

// DOM Elements will be referenced when module loads

// ================================
// INITIALIZATION
// ================================

async function initializeSocialEarn() {
    console.log('🎯 Initializing SOCIAL-TO-EARN...');

    if (!socialEarnInitialized) {
        await loadSocialRewards();
        setupSocialEarnEvents();
        await loadUserActions();
        socialEarnInitialized = true;
    } else {
        // Refresh when revisiting
        await loadUserActions();
    }
}

async function loadSocialRewards() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/social/rewards`);
        socialRewards = await response.json();
        console.log('✅ Social rewards loaded:', Object.keys(socialRewards).length);
    } catch (error) {
        console.error('Error loading social rewards:', error);
    }
}

function setupSocialEarnEvents() {
    // Follow Blog
    const followBlogBtn = document.getElementById('followBlogBtn');
    if (followBlogBtn) {
        followBlogBtn.addEventListener('click', () => performAction('follow_blog'));
    }

    // Comment Blog
    const commentBlogBtn = document.getElementById('commentBlogBtn');
    const commentBlogLink = document.getElementById('commentBlogLink');
    if (commentBlogBtn && commentBlogLink) {
        commentBlogBtn.addEventListener('click', () => {
            const link = commentBlogLink.value.trim();
            if (!link) {
                showSocialStatus('Inserisci il link al commento', 'error');
                return;
            }
            performAction('comment_blog', link);
        });
    }

    // X Follow
    const xFollowBtn = document.getElementById('xFollowBtn');
    if (xFollowBtn) {
        xFollowBtn.addEventListener('click', () => performAction('x_follow'));
    }

    // X Like
    const xLikeBtn = document.getElementById('xLikeBtn');
    const xLikeLink = document.getElementById('xLikeLink');
    if (xLikeBtn && xLikeLink) {
        xLikeBtn.addEventListener('click', () => {
            const link = xLikeLink.value.trim();
            if (!link) {
                showSocialStatus('Inserisci il link al like', 'error');
                return;
            }
            performAction('x_like', link);
        });
    }

    // X Repost
    const xRepostBtn = document.getElementById('xRepostBtn');
    const xRepostLink = document.getElementById('xRepostLink');
    if (xRepostBtn && xRepostLink) {
        xRepostBtn.addEventListener('click', () => {
            const link = xRepostLink.value.trim();
            if (!link) {
                showSocialStatus('Inserisci il link al repost', 'error');
                return;
            }
            performAction('x_repost', link);
        });
    }

    // Reddit Join
    const redditJoinBtn = document.getElementById('redditJoinBtn');
    if (redditJoinBtn) {
        redditJoinBtn.addEventListener('click', () => performAction('reddit_join'));
    }

    // Reddit Upvote
    const redditUpvoteBtn = document.getElementById('redditUpvoteBtn');
    const redditUpvoteLink = document.getElementById('redditUpvoteLink');
    if (redditUpvoteBtn && redditUpvoteLink) {
        redditUpvoteBtn.addEventListener('click', () => {
            const link = redditUpvoteLink.value.trim();
            if (!link) {
                showSocialStatus('Inserisci il link all\'upvote', 'error');
                return;
            }
            performAction('reddit_upvote', link);
        });
    }
}

// ================================
// PERFORM SOCIAL ACTION
// ================================

async function performAction(actionType, link = null) {
    if (!window.app.currentUser) {
        showSocialStatus('Utente non autenticato', 'error');
        return;
    }

    if (!socialRewards || !socialRewards[actionType]) {
        showSocialStatus('Azione non valida', 'error');
        return;
    }

    const reward = socialRewards[actionType];

    // Confirm with user
    const confirmMsg = `Questa azione ${reward.once ? '(disponibile una sola volta) ' : ''}ti darà +${reward.points} Punti${reward.credits > 0 ? ` e costerà ${reward.credits} Crediti` : ' (gratis)'}. Confermare?`;

    if (!confirm(confirmMsg)) {
        return;
    }

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
            throw new Error(result.error || 'Errore durante l\'azione');
        }

        // Update local user data
        window.app.currentUser.crediti = result.newCredits;
        window.app.currentUser.punti_classifica = result.newPoints;
        localStorage.setItem('luncHorizonUser', JSON.stringify(window.app.currentUser));

        // Update displays
        document.getElementById('creditsDisplay').textContent = result.newCredits;
        const puntiDisplay = document.getElementById('puntiDisplay');
        if (puntiDisplay) {
            puntiDisplay.textContent = result.newPoints;
        }

        // Show success
        showSocialStatus(
            `✅ ${result.message}! Nuovi Punti: ${result.newPoints}`,
            'success'
        );

        // Reload actions history
        await loadUserActions();

        // Clear input if any
        if (link) {
            const inputElement = document.querySelector(`#${actionType.replace('_', '')}Link, #${actionType}Link`);
            if (inputElement) {
                inputElement.value = '';
            }
        }

    } catch (error) {
        console.error('Social action error:', error);
        showSocialStatus(error.message || 'Errore durante l\'azione', 'error');
    }
}

// ================================
// LOAD USER ACTIONS HISTORY
// ================================

async function loadUserActions() {
    if (!window.app.currentUser) return;

    try {
        const response = await fetch(`${window.app.API_BASE}/api/social/actions/${window.app.currentUser.id_univoco}`);
        const actions = await response.json();

        const actionsContainer = document.getElementById('socialActionsHistory');
        if (!actionsContainer) return;

        if (actions.length === 0) {
            actionsContainer.innerHTML = '<div class="no-actions">Nessuna azione completata ancora</div>';
            return;
        }

        actionsContainer.innerHTML = '';

        actions.slice(0, 10).forEach(action => {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-history-item';

            const actionName = getActionName(action.action_type);
            const date = new Date(action.timestamp).toLocaleString('it-IT');

            actionDiv.innerHTML = `
                <div class="action-info">
                    <div class="action-name">${actionName}</div>
                    <div class="action-date">${date}</div>
                </div>
                <div class="action-points">+${action.points_earned} Punti</div>
            `;

            actionsContainer.appendChild(actionDiv);
        });

    } catch (error) {
        console.error('Error loading user actions:', error);
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
        'referral_invite': '🎁 Referral Invite'
    };
    return names[actionType] || actionType;
}

// ================================
// STATUS MESSAGES
// ================================

function showSocialStatus(message, type) {
    const statusElement = document.getElementById('socialEarnStatus');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status-message show ${type}`;

    setTimeout(() => {
        statusElement.classList.remove('show');
    }, 5000);
}

// ================================
// SOCKET.IO EVENTS
// ================================

if (window.app && window.app.socket) {
    window.app.socket.on('social:action', (data) => {
        console.log('🎯 Social action detected:', data);

        // Reload actions history if it's current user
        if (data.userId === window.app.currentUser?.id_univoco) {
            loadUserActions();
        }
    });

    window.app.socket.on('social:points-reset', (data) => {
        console.log('📊 Points reset:', data);
        alert('Reset mensile punti eseguito! Tutti i punti sono stati azzerati.');

        // Update local user
        if (window.app.currentUser) {
            window.app.currentUser.punti_classifica = 0;
            localStorage.setItem('luncHorizonUser', JSON.stringify(window.app.currentUser));

            const puntiDisplay = document.getElementById('puntiDisplay');
            if (puntiDisplay) {
                puntiDisplay.textContent = '0';
            }
        }

        // Reload actions
        loadUserActions();
    });
}

// ================================
// EXPORTS
// ================================

window.initializeSocialEarn = initializeSocialEarn;
