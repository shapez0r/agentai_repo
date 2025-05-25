const WebSocket = require('ws');
const http = require('http');

// Message types (must match client)
const MESSAGE_TYPE = {
    PING: 0x01,
    PONG: 0x02,
    START: 0x03,
    ERROR: 0xFF
};

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Speedtest WebSocket Server');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

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

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Speedtest server running on port ${PORT}`);
}); 