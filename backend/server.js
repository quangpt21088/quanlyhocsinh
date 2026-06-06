const express = require('express');
const path = require('path');
const cors = require('cors');
const { init } = require('./database');
const routes = require('./routes');
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '50mb' }));
app.use('/api', routes);
app.get('/api/ping', (req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));
app.get('*', (req, res) => { if (!req.path.startsWith('/api')) res.sendFile(path.join(frontendPath, 'index.html')); });
init().then(() => {
    app.listen(PORT, () => {
        console.log('Server running on port ' + PORT);
        console.log('DATABASE_URL: ' + (process.env.DATABASE_URL ? 'SET' : 'NOT SET'));
    });
}).catch(err => {
    console.error('Failed to initialize:', err.message);
    process.exit(1);
});
module.exports = app;
