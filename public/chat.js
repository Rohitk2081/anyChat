const socket = io();
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const skipBtn = document.getElementById('skip-btn');

let paired = false;

sendBtn.addEventListener('click', () => {
    if (chatInput.value && paired) {
        socket.emit('chatMessage', chatInput.value);
        appendMessage('You: ' + chatInput.value);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default action (like form submission)
        if (chatInput.value && paired) {
            socket.emit('chatMessage', chatInput.value);
            appendMessage('You: ' + chatInput.value ); // Send as 'you'
            chatInput.value = ''; // Clear the input
        }
    }
});

skipBtn.addEventListener('click', () => {
    socket.emit('skip');
    clearChat();
    appendMessage('Looking for a new partner...');
});

// When paired with another user
socket.on('paired', ({ partnerId }) => {
    paired = true;
    clearChat();
    appendMessage('CONNNECTED WITH A STRANGER');
});

// When a chat message is received
socket.on('chatMessage', (msg) => {
    appendMessage('Partner: ' + msg);
});

// When the partner disconnects or skips
socket.on('partnerDisconnected', () => {
    paired = false;
    clearChat();
    appendMessage('Your partner has disconnected. Looking for a new one...');
});

// Utility functions
function appendMessage(message) {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function clearChat() {
    chatBox.innerHTML = '';
}