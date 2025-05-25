const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// The WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Message types (must match client)
const MESSAGE_TYPE = {
    PING: 0x01,
    PONG: 0x02,
    START: 0x03,
    ERROR: 0xFF
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const data = new Uint8Array(message);
        
        // Handle PING messages
        if (data[0] === MESSAGE_TYPE.PING) {
            // Create PONG response with same sequence number
            const response = new Uint8Array(3);
            response[0] = MESSAGE_TYPE.PONG;
            response[1] = data[1];
            response[2] = data[2];
            
            // Send PONG immediately
            ws.send(response);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Create HTTP server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Handle upgrade requests
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Handle all other routes by serving the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
}); 