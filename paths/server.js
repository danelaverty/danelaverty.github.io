const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./serverDatabase');
const routes = require('./serverRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
}

// Middleware
app.use(cors());
//app.use(express.json());
app.use(express.json({ limit: '250mb' }));

// Initialize database
const db = initializeDatabase();

// Make database available to routes
app.locals.db = db;

// API routes
app.use('/api', routes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Scenario Calculator Backend Working!', 
        timestamp: new Date().toISOString(),
        database: path.join(__dirname, 'data', 'scenario_calculator.db'),
        status: 'success'
    });
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Scenario Calculator Backend running on http://localhost:${PORT}`);
    console.log(`Database: ${path.join(__dirname, 'data', 'scenario_calculator.db')}`);
    console.log(`Test: http://localhost:${PORT}/api/test`);
    console.log(`Data Stats: http://localhost:${PORT}/api/data/stats`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`Serving React app from: ${path.join(__dirname, 'dist')}`);
    }
});
