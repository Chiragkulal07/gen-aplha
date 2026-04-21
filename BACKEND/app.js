const express = require('express');
const cors = require('cors');
const actionRoutes = require('./routes/actionRoutes');
const predictRoutes = require('./routes/predictRoutes');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/action', actionRoutes);
app.use('/predict', predictRoutes);
app.use('/status', statusRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Backend is running 🚀',
        endpoints: ['/action', '/predict', '/status']
    });
});

module.exports = app;
