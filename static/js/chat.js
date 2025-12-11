// Chat functionality
let chatInterval = null;

// Check if chat is enabled
fetch('/api/settings-public')
    .then(r => r.json())
    .then(settings => {
        if (settings.enable_chat) {
            const link = document.getElementById('chat-link');
            if (link) link.style.display = 'block';
            loadChatMessages();
            chatInterval = setInterval(loadChatMessages, 5000);
        }
    })
    .catch(() => {});

function toggleChat() {
    const widget = document.getElementById('chat-widget');
    if (!widget) return;
    
    if (widget.style.display === 'none' || !widget.style.display) {
        widget.style.display = 'block';
        loadChatMessages();
    } else {
        widget.style.display = 'none';
    }
}

function loadChatMessages() {
    fetch('/api/messages')
        .then(r => r.json())
        .then(messages => {
            const container = document.getElementById('chat-messages');
            container.innerHTML = messages.map(m => `
                <div class="chat-message">
                    <strong>${m.username}</strong>
                    <p>${m.message}</p>
                    <small>${m.date}</small>
                </div>
            `).join('');
            container.scrollTop = container.scrollHeight;
        });
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    fetch('/api/messages', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: message})
    })
    .then(r => r.json())
    .then(result => {
        if (result.success) {
            input.value = '';
            loadChatMessages();
        }
    });
}
