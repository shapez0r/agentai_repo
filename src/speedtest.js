// Binary protocol message types (like in Speedtest)
const MESSAGE_TYPE = {
    PING: 0x01,
    PONG: 0x02,
    START: 0x03,
    ERROR: 0xFF
};

// Convert number to 2-byte binary
function numberToBytes(num) {
    return new Uint8Array([
        (num >> 8) & 0xFF,
        num & 0xFF
    ]);
}

// Convert 2-byte binary to number
function bytesToNumber(bytes) {
    return (bytes[0] << 8) | bytes[1];
}

export class SpeedtestLatency {
    constructor() {
        this.samples = [];
        this.currentSequence = 0;
        this.measurementStartTime = 0;
        this.ws = null;
        this.onComplete = null;
        this.onProgress = null;
        this.onError = null;
    }

    // Start latency measurement
    async measure(endpoint, options = {}) {
        const {
            sampleCount = 20,        // Number of samples to collect
            timeout = 5000,          // Overall timeout
            progressCallback = null,  // Progress callback
            errorCallback = null      // Error callback
        } = options;

        return new Promise((resolve, reject) => {
            this.samples = [];
            this.currentSequence = 0;
            this.onComplete = resolve;
            this.onProgress = progressCallback;
            this.onError = errorCallback || reject;

            // Connect WebSocket
            try {
                this.ws = new WebSocket(`wss://${endpoint}`);
                this.ws.binaryType = 'arraybuffer';
                
                // Set up event handlers
                this.ws.onopen = () => this._startMeasurement(sampleCount);
                this.ws.onmessage = (event) => this._handleMessage(event.data);
                this.ws.onerror = (error) => this._handleError(error);
                this.ws.onclose = () => this._handleClose();

                // Set timeout
                setTimeout(() => {
                    if (this.samples.length < sampleCount) {
                        this._handleError(new Error('Measurement timeout'));
                    }
                }, timeout);
            } catch (error) {
                this._handleError(error);
            }
        });
    }

    // Start the measurement sequence
    _startMeasurement(sampleCount) {
        this.measurementStartTime = performance.now();
        this._sendPing();

        // Schedule remaining pings with random intervals
        for (let i = 1; i < sampleCount; i++) {
            setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this._sendPing();
                }
            }, Math.random() * 200); // Random delay up to 200ms
        }
    }

    // Send a ping message
    _sendPing() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const sequence = this.currentSequence++;
        const message = new Uint8Array(3);
        message[0] = MESSAGE_TYPE.PING;
        message.set(numberToBytes(sequence), 1);

        const timestamp = performance.now();
        this.samples.push({
            sequence,
            timestamp,
            rtt: null
        });

        this.ws.send(message);
    }

    // Handle incoming message
    _handleMessage(data) {
        const view = new Uint8Array(data);
        if (view[0] === MESSAGE_TYPE.PONG) {
            const sequence = bytesToNumber(view.slice(1, 3));
            const sample = this.samples.find(s => s.sequence === sequence);
            
            if (sample) {
                sample.rtt = performance.now() - sample.timestamp;
                
                // Calculate and report progress
                const progress = this.samples.filter(s => s.rtt !== null).length / this.samples.length;
                if (this.onProgress) {
                    this.onProgress(progress);
                }

                // Check if we're done
                if (this.samples.every(s => s.rtt !== null)) {
                    this._complete();
                }
            }
        }
    }

    // Handle errors
    _handleError(error) {
        if (this.onError) {
            this.onError(error);
        }
        this._cleanup();
    }

    // Handle WebSocket close
    _handleClose() {
        if (this.samples.some(s => s.rtt !== null)) {
            this._complete();
        } else {
            this._handleError(new Error('Connection closed without measurements'));
        }
    }

    // Complete the measurement
    _complete() {
        const result = this._calculateResult();
        if (this.onComplete) {
            this.onComplete(result);
        }
        this._cleanup();
    }

    // Clean up resources
    _cleanup() {
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }
    }

    // Calculate final result using Speedtest.net algorithm
    _calculateResult() {
        const validSamples = this.samples
            .filter(s => s.rtt !== null && s.rtt > 0)
            .map(s => s.rtt)
            .sort((a, b) => a - b);

        if (validSamples.length === 0) {
            return null;
        }

        // Calculate jitter
        const jitter = this._calculateJitter(validSamples);

        // Remove outliers using IQR method
        const q1 = validSamples[Math.floor(validSamples.length * 0.25)];
        const q3 = validSamples[Math.floor(validSamples.length * 0.75)];
        const iqr = q3 - q1;
        const validRange = validSamples.filter(
            rtt => rtt >= q1 - 1.5 * iqr && rtt <= q3 + 1.5 * iqr
        );

        // Calculate weighted average based on jitter
        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < validRange.length; i++) {
            const weight = 1 / (1 + Math.abs(validRange[i] - validRange[i-1] || 0));
            weightedSum += validRange[i] * weight;
            totalWeight += weight;
        }

        return {
            ping: Math.round(weightedSum / totalWeight / 2), // Convert RTT to one-way latency
            jitter: Math.round(jitter * 100) / 100,
            samples: validSamples.length,
            lost: this.samples.length - validSamples.length
        };
    }

    // Calculate jitter using RFC 1889 method
    _calculateJitter(samples) {
        let jitter = 0;
        for (let i = 1; i < samples.length; i++) {
            const d = Math.abs(samples[i] - samples[i-1]);
            jitter += (d - jitter) / 16;
        }
        return jitter;
    }
} 