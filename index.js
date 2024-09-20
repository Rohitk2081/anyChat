const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');  

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let availableUsers = [];  // Store users who are waiting for a partner
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user joins, add them to the available pool
    availableUsers.push(socket);

    // Try to pair this user with another waiting user
    pairUsers(socket);

    // Handle chat messages
    socket.on('chatMessage', (msg) => {
        // Send the message to the paired user
        const partner = socket.partner;
        if (partner) {
            partner.emit('chatMessage', msg);
        }
    });

    // Handle skip functionality
    socket.on('skip', () => {
        if (socket.partner) {
            // Notify the partner that the user left
            socket.partner.emit('partnerDisconnected');
            // Unpair both users
            socket.partner.partner = null;
            socket.partner = null;
        }
        // Remove user from the available list
        availableUsers = availableUsers.filter(user => user !== socket);
        // Re-add the user to the available pool and try pairing again
        availableUsers.push(socket);
        pairUsers(socket);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        // Remove the user from the available pool
        availableUsers = availableUsers.filter(user => user !== socket);
        // Notify the partner
        if (socket.partner) {
            socket.partner.emit('partnerDisconnected');
            socket.partner.partner = null;
        }
    });
});

function pairUsers(socket) {
    // Check if there is another available user to pair with
    if (availableUsers.length > 1) {
        let partner = availableUsers.find(user => user !== socket);
        if (partner) {
            // Pair the users
            socket.partner = partner;
            partner.partner = socket;

            // Notify both users they have been paired
            socket.emit('paired', { partnerId: partner.id });
            partner.emit('paired', { partnerId: socket.id });

            // Remove both from the available pool
            availableUsers = availableUsers.filter(user => user !== socket && user !== partner);
        }
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});