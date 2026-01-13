// ================================
// SOCIAL WALL MODULE
// Real-time chat with Socket.io
// Cost: 1 Credit per message | Reward: +10 Points
// ================================

// DOM Elements
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatError = document.getElementById('chatError');

let chatInitialized = false;

// ================================
// INITIALIZATION
// ================================

function initializeSocial() {
    console.log('💬 Initializing SOCIAL WALL...');

    if (!chatInitialized) {
        setupChatEvents();
        loadChatHistoryFromServer();
        chatInitialized = true;
    }
}

function setupChatEvents() {
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// ================================
// CHAT FUNCTIONALITY
// ================================

function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) {
        showChatError('Inserisci un messaggio');
        return;
    }

    if (message.length > 500) {
        showChatError('Messaggio troppo lungo (max 500 caratteri)');
        return;
    }

    if (!window.app.socket) {
        showChatError('Socket non connesso');
        return;
    }

    if (!window.app.currentUser) {
        showChatError('Utente non autenticato');
        return;
    }

    // Check credits
    if (window.app.currentUser.crediti < 1) {
        showChatError('❌ Crediti insufficienti! Necessario: 1 Credito');
        return;
    }

    // Send message via socket
    window.app.socket.emit('chat:message', { message });

    // Clear input
    messageInput.value = '';
}

function handleChatMessage(data) {
    console.log('💬 New message:', data);

    if (!messagesArea) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-item';

    const isOwnMessage = window.app.currentUser && data.username === window.app.currentUser.username;

    // Get ID Univoco (shortened)
    const userId = data.userId || data.user_id || '---';
    const shortId = userId.substring(0, 8);

    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-user-info">
                <span class="message-username ${isOwnMessage ? 'own-message' : ''}">${escapeHtml(data.username)}</span>
                <span class="message-id">[ID: ${shortId}]</span>
            </div>
            <span class="message-time">${window.app.formatTimestamp(data.timestamp)}</span>
        </div>
        <div class="message-text">${escapeHtml(data.message)}</div>
        ${data.pointsEarned ? `<div class="message-points">+${data.pointsEarned} Punti 🎯</div>` : ''}
    `;

    messagesArea.appendChild(messageDiv);

    // Auto-scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;

    // Limit to 100 messages
    while (messagesArea.children.length > 100) {
        messagesArea.removeChild(messagesArea.firstChild);
    }
}

function loadChatHistory(messages) {
    console.log('📜 Loading chat history:', messages ? messages.length : 0);

    if (!messagesArea) return;

    messagesArea.innerHTML = '';

    if (!messages || messages.length === 0) {
        messagesArea.innerHTML = '<div class="no-messages">Nessun messaggio. Inizia la conversazione!</div>';
        return;
    }

    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-item';

        const isOwnMessage = window.app.currentUser && msg.username === window.app.currentUser.username;

        // Get ID Univoco (shortened)
        const userId = msg.user_id || '---';
        const shortId = userId.substring(0, 8);

        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="message-user-info">
                    <span class="message-username ${isOwnMessage ? 'own-message' : ''}">${escapeHtml(msg.username)}</span>
                    <span class="message-id">[ID: ${shortId}]</span>
                </div>
                <span class="message-time">${window.app.formatTimestamp(msg.timestamp)}</span>
            </div>
            <div class="message-text">${escapeHtml(msg.message)}</div>
        `;

        messagesArea.appendChild(messageDiv);
    });

    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function loadChatHistoryFromServer() {
    if (window.app && window.app.socket) {
        window.app.socket.emit('chat:history');
    }
}

// ================================
// UTILITIES
// ================================

function showChatError(message) {
    if (!chatError) return;

    chatError.textContent = message;
    chatError.classList.add('show');

    setTimeout(() => {
        chatError.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================
// EXPORTS
// ================================

window.initializeSocial = initializeSocial;
window.handleChatMessage = handleChatMessage;
window.loadChatHistory = loadChatHistory;

// Auto-reload history when socket connects
if (window.app && window.app.socket) {
    window.app.socket.on('connect', () => {
        if (chatInitialized) {
            loadChatHistoryFromServer();
        }
    });

    window.app.socket.on('chat:history', (messages) => {
        loadChatHistory(messages);
    });
}
