// ================================
// SOCIAL WALL MODULE
// Real-time chat with 1 Credit per message
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
        loadChatHistory();
        chatInitialized = true;
    }
}

function setupChatEvents() {
    sendMessageBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
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
        showChatError('Crediti insufficienti! Necessario: 1 Credito');
        return;
    }

    // Send message via socket
    window.app.socket.emit('chat:message', { message });

    // Clear input
    messageInput.value = '';
}

function handleChatMessage(data) {
    console.log('💬 New message:', data);

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const isOwnMessage = window.app.currentUser && data.username === window.app.currentUser.username;

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username" style="${isOwnMessage ? 'color: #00ffff;' : ''}">${data.username}</span>
            <span class="message-timestamp">${window.app.formatTimestamp(data.timestamp)}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
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
    console.log('📜 Loading chat history:', messages.length);

    messagesArea.innerHTML = '';

    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        const isOwnMessage = window.app.currentUser && msg.username === window.app.currentUser.username;

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-username" style="${isOwnMessage ? 'color: #00ffff;' : ''}">${msg.username}</span>
                <span class="message-timestamp">${window.app.formatTimestamp(msg.timestamp)}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.message)}</div>
        `;

        messagesArea.appendChild(messageDiv);
    });

    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function loadChatHistoryFromServer() {
    if (window.app.socket) {
        window.app.socket.emit('chat:history');
    }
}

// ================================
// UTILITIES
// ================================

function showChatError(message) {
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

// Auto-load history when socket connects
if (window.app && window.app.socket) {
    window.app.socket.on('connect', () => {
        if (chatInitialized) {
            loadChatHistoryFromServer();
        }
    });
}
