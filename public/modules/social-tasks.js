// ================================
// SOCIAL TASKS INTERFACE
// Enhanced social rewards with verification
// ================================

let socialTasksInitialized = false;
let userSocialActions = [];

// ================================
// INITIALIZATION
// ================================

function initializeSocialTasks() {
    if (socialTasksInitialized) return;

    console.log('🎯 Initializing Social Tasks Interface...');

    renderSocialTasksPage();
    loadUserActions();
    setupTaskListeners();

    socialTasksInitialized = true;
}

// ================================
// SOCIAL TASKS PAGE RENDERING
// ================================

function renderSocialTasksPage() {
    const container = document.getElementById('socialTasksContainer');
    if (!container) {
        console.warn('Social tasks container not found');
        return;
    }

    container.innerHTML = `
        <div class="social-tasks-page">
            <!-- Header -->
            <div class="social-tasks-header">
                <h1 class="page-title">🎯 Social Rewards</h1>
                <p class="page-subtitle">Complete tasks to earn credits and ranking points</p>
                <div class="rewards-legend">
                    <span class="legend-item"><span class="badge-new">100%</span> First Time</span>
                    <span class="legend-item"><span class="badge-loyalty">50%</span> Loyalty</span>
                    <span class="legend-item"><span class="badge-repeat">Standard</span> Repeatable</span>
                </div>
            </div>

            <!-- User Stats Summary -->
            <div class="social-stats-summary">
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <span class="stat-label">Total Credits</span>
                        <span class="stat-value" id="socialUserCredits">0</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-info">
                        <span class="stat-label">Ranking Points</span>
                        <span class="stat-value" id="socialUserPoints">0</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-info">
                        <span class="stat-label">Tasks Completed</span>
                        <span class="stat-value" id="socialTasksCompleted">0</span>
                    </div>
                </div>
            </div>

            <!-- Tasks List -->
            <div class="social-tasks-grid">
                <!-- Twitter/X Tasks -->
                <div class="task-category">
                    <h2 class="category-title"><span class="category-icon">🐦</span> Twitter / X</h2>
                    <div class="task-list">
                        ${renderTask('x_follow', 'Follow @RenditeDigitali', '300 points', 'follow', true)}
                        ${renderTask('x_like', 'Like Latest Post', '30 points + 2 credits', 'like', false)}
                        ${renderTask('x_repost', 'Repost Latest Article', '200 points + 10 credits', 'repost', false)}
                    </div>
                </div>

                <!-- Blog Tasks -->
                <div class="task-category">
                    <h2 class="category-title"><span class="category-icon">📰</span> Rendite Digitali Blog</h2>
                    <div class="task-list">
                        ${renderTask('follow_blog', 'Follow Blog', '500 points', 'follow', true)}
                        ${renderTask('comment_blog', 'Comment on Article', '50 points + 5 credits', 'comment', false)}
                    </div>
                </div>

                <!-- Reddit Tasks -->
                <div class="task-category">
                    <h2 class="category-title"><span class="category-icon">🤖</span> Reddit</h2>
                    <div class="task-list">
                        ${renderTask('reddit_join', 'Join r/LunaClassic', '400 points', 'follow', true)}
                        ${renderTask('reddit_upvote', 'Upvote Latest Post', '40 points + 2 credits', 'upvote', false)}
                    </div>
                </div>

                <!-- Community Tasks -->
                <div class="task-category">
                    <h2 class="category-title"><span class="category-icon">💬</span> Community</h2>
                    <div class="task-list">
                        ${renderTask('social_wall_message', 'Post on Social Wall', '10 points + 1 credit', 'message', false)}
                        ${renderTask('referral_invite', 'Invite a Friend', '1000 points', 'referral', false)}
                    </div>
                </div>
            </div>

            <!-- Task History -->
            <div class="task-history-section">
                <h2 class="section-title">📋 Recent Activity</h2>
                <div id="taskHistoryList" class="task-history-list"></div>
            </div>
        </div>
    `;

    updateSocialStats();
}

function renderTask(taskId, title, reward, type, isFollow) {
    const taskStatus = getTaskStatus(taskId);
    const isCompleted = taskStatus.completed;
    const isLoyalty = taskStatus.isLoyalty;

    let badgeHTML = '';
    if (isFollow) {
        if (!isCompleted) {
            badgeHTML = '<span class="task-badge badge-new">100%</span>';
        } else if (isLoyalty) {
            badgeHTML = '<span class="task-badge badge-loyalty">50%</span>';
        }
    }

    let buttonHTML = '';
    if (!isCompleted || isFollow) {
        buttonHTML = `
            <button class="task-check-btn"
                    onclick="checkTask('${taskId}')"
                    ${isCompleted && !isFollow ? 'disabled' : ''}>
                ${isCompleted && isFollow ? 'Claim Loyalty Reward' : 'Check & Verify'}
            </button>
        `;
    } else {
        buttonHTML = '<span class="task-completed-badge">✓ Completed</span>';
    }

    return `
        <div class="task-item ${isCompleted ? 'task-completed' : ''}" data-task-id="${taskId}">
            <div class="task-icon task-icon-${type}">
                ${getTaskIcon(type)}
            </div>
            <div class="task-info">
                <div class="task-title-row">
                    <span class="task-title">${title}</span>
                    ${badgeHTML}
                </div>
                <span class="task-reward">${reward}</span>
            </div>
            <div class="task-action">
                ${buttonHTML}
            </div>
        </div>
    `;
}

function getTaskIcon(type) {
    const icons = {
        'follow': '👥',
        'like': '❤️',
        'repost': '🔄',
        'comment': '💬',
        'upvote': '⬆️',
        'message': '📝',
        'referral': '🎁'
    };
    return icons[type] || '✓';
}

// ================================
// TASK STATUS CHECKING
// ================================

function getTaskStatus(taskId) {
    const action = userSocialActions.find(a => a.action_type === taskId);

    if (!action) {
        return { completed: false, isLoyalty: false };
    }

    // Check if it's a follow action with loyalty tier
    const followActions = ['x_follow', 'follow_blog', 'reddit_join'];
    if (followActions.includes(taskId)) {
        // Check if claimed this month
        const lastClaimed = new Date(action.timestamp);
        const now = new Date();
        const sameMonth = lastClaimed.getMonth() === now.getMonth() &&
                         lastClaimed.getFullYear() === now.getFullYear();

        return {
            completed: sameMonth,
            isLoyalty: action.points_earned < 300 // Reduced points = loyalty tier
        };
    }

    return { completed: true, isLoyalty: false };
}

// ================================
// TASK VERIFICATION
// ================================

async function checkTask(taskId) {
    if (!window.app || !window.app.currentUser) {
        alert('Please log in to complete tasks');
        return;
    }

    const userId = window.app.currentUser.id_univoco;

    // For tasks requiring external link verification
    const taskRequiresLink = ['x_like', 'x_repost', 'comment_blog', 'reddit_upvote'];

    let linkUrl = null;
    if (taskRequiresLink.includes(taskId)) {
        linkUrl = prompt(`Please paste the link to your ${taskId.replace('_', ' ')}:`);
        if (!linkUrl || linkUrl.trim() === '') {
            return;
        }
    }

    // Show loading state
    const button = document.querySelector(`[data-task-id="${taskId}"] .task-check-btn`);
    if (button) {
        button.disabled = true;
        button.textContent = 'Verifying...';
    }

    try {
        const response = await fetch(`${window.app.API_BASE}/api/social/verify-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                actionType: taskId,
                link: linkUrl
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Verification failed');
        }

        // Update user data
        window.app.currentUser.crediti = result.newCredits;
        window.app.currentUser.punti_classifica = result.newPoints;
        localStorage.setItem('luncHorizonUser', JSON.stringify(window.app.currentUser));

        // Show success message
        let message = `✅ Task completed! Earned: ${result.pointsEarned} points`;
        if (result.creditsSpent > 0) {
            message += ` (Cost: ${result.creditsSpent} credits)`;
        }
        if (result.tierMessage) {
            message += ` - ${result.tierMessage}`;
        }

        showTaskNotification(message, 'success');

        // Reload tasks
        await loadUserActions();
        renderSocialTasksPage();
        updateSocialStats();

        // Notify hub
        if (window.rdStationHub) {
            window.rdStationHub.updateUserProfile();
            window.rdStationHub.loadHubData();
        }

    } catch (error) {
        console.error('Task verification error:', error);
        showTaskNotification(error.message || 'Task verification failed', 'error');

        // Reset button
        if (button) {
            button.disabled = false;
            button.textContent = 'Check & Verify';
        }
    }
}

// ================================
// DATA LOADING
// ================================

async function loadUserActions() {
    if (!window.app || !window.app.currentUser) return;

    try {
        const userId = window.app.currentUser.id_univoco;
        const response = await fetch(`${window.app.API_BASE}/api/social/actions/${userId}`);

        if (response.ok) {
            userSocialActions = await response.json();
            renderTaskHistory();
        }
    } catch (error) {
        console.error('Error loading user actions:', error);
    }
}

function renderTaskHistory() {
    const historyList = document.getElementById('taskHistoryList');
    if (!historyList) return;

    if (userSocialActions.length === 0) {
        historyList.innerHTML = '<div class="no-history">No tasks completed yet. Start earning rewards above!</div>';
        return;
    }

    historyList.innerHTML = userSocialActions.slice(0, 10).map(action => {
        const date = new Date(action.timestamp).toLocaleString('it-IT');
        return `
            <div class="history-item">
                <div class="history-icon">${getActionIcon(action.action_type)}</div>
                <div class="history-info">
                    <span class="history-action">${getActionName(action.action_type)}</span>
                    <span class="history-date">${date}</span>
                </div>
                <div class="history-reward">
                    <span class="history-points">+${action.points_earned} pts</span>
                    ${action.credits_cost > 0 ? `<span class="history-cost">-${action.credits_cost} credits</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getActionIcon(actionType) {
    const icons = {
        'x_follow': '🐦',
        'x_like': '❤️',
        'x_repost': '🔄',
        'follow_blog': '📰',
        'comment_blog': '💬',
        'reddit_join': '🤖',
        'reddit_upvote': '⬆️',
        'social_wall_message': '📝',
        'referral_invite': '🎁'
    };
    return icons[actionType] || '✓';
}

function getActionName(actionType) {
    const names = {
        'x_follow': 'Followed on X',
        'x_like': 'Liked Post',
        'x_repost': 'Reposted',
        'follow_blog': 'Followed Blog',
        'comment_blog': 'Commented on Blog',
        'reddit_join': 'Joined Reddit',
        'reddit_upvote': 'Upvoted on Reddit',
        'social_wall_message': 'Posted Message',
        'referral_invite': 'Invited Friend'
    };
    return names[actionType] || actionType;
}

// ================================
// UI UPDATES
// ================================

function updateSocialStats() {
    if (!window.app || !window.app.currentUser) return;

    const user = window.app.currentUser;

    const creditsEl = document.getElementById('socialUserCredits');
    if (creditsEl) {
        creditsEl.textContent = user.crediti || 0;
    }

    const pointsEl = document.getElementById('socialUserPoints');
    if (pointsEl) {
        pointsEl.textContent = user.punti_classifica || 0;
    }

    const completedEl = document.getElementById('socialTasksCompleted');
    if (completedEl) {
        completedEl.textContent = userSocialActions.length;
    }
}

function setupTaskListeners() {
    // Socket listeners for real-time updates
    if (window.app && window.app.socket) {
        window.app.socket.on('social:action', async (data) => {
            if (data.userId === window.app.currentUser?.id_univoco) {
                await loadUserActions();
                renderSocialTasksPage();
                updateSocialStats();
            }
        });
    }
}

// ================================
// NOTIFICATIONS
// ================================

function showTaskNotification(message, type = 'info') {
    if (window.lunoplyNeon && window.lunoplyNeon.addNotification) {
        window.lunoplyNeon.addNotification(message);
    } else {
        alert(message);
    }
}

// ================================
// EXPORTS
// ================================

window.socialTasks = {
    initialize: initializeSocialTasks,
    checkTask,
    loadUserActions,
    updateSocialStats
};

// Auto-initialize when navigating to social tasks
if (window.app) {
    const originalNavigateTo = window.app.navigateTo;
    if (originalNavigateTo) {
        window.app.navigateTo = function(page) {
            originalNavigateTo.call(window.app, page);
            if (page === 'social-tasks') {
                setTimeout(() => initializeSocialTasks(), 100);
            }
        };
    }
}
