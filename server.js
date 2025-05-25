const express = require('express');
const cors = require('cors');
const ping = require('ping');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/ping/:host', async (req, res) => {
    try {
        const host = req.params.host;
        const result = await ping.promise.probe(host, {
            timeout: 5,
            extra: ['-c', '4'], // 4 pings like standard ping command
        });
        
        if (result.alive) {
            res.json({
                host: result.host,
                alive: result.alive,
                time: result.time,
                min: result.min,
                max: result.max,
                avg: result.avg,
                stddev: result.stddev,
                packetLoss: result.packetLoss
            });
        } else {
            res.json({
                host: result.host,
                alive: false,
                error: 'Host unreachable'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 