// serverRoutesSavedHistograms.js
const express = require('express');
const router = express.Router();

// GET /api/saved-histograms - Get all saved histograms
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    
    db.all(`
        SELECT 
            id,
            name,
            scenario_id,
            scenario_name,
            computed_fee_id,
            computed_fee_name,
            filters,
            impact_data,
            created_at
        FROM saved_histograms
        ORDER BY created_at DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('Error fetching saved histograms:', err);
            return res.status(500).json({ error: err.message });
        }
        
        const histograms = rows.map(row => ({
            id: row.id,
            name: row.name,
            scenario_id: row.scenario_id,
            scenario_name: row.scenario_name,
            computed_fee_id: row.computed_fee_id,
            computed_fee_name: row.computed_fee_name,
            filters: row.filters ? JSON.parse(row.filters) : {},
            impact_data: row.impact_data ? JSON.parse(row.impact_data) : [],
            created_at: row.created_at
        }));
        
        res.json(histograms);
    });
});

// POST /api/saved-histograms - Save a new histogram
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { 
        name, 
        scenario_id, 
        scenario_name, 
        computed_fee_id, 
        computed_fee_name, 
        filters, 
        impact_data 
    } = req.body;
    
    // Validate required fields
    if (!name || !scenario_id || !scenario_name || !computed_fee_id || !computed_fee_name || !impact_data) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, scenario_id, scenario_name, computed_fee_id, computed_fee_name, impact_data' 
        });
    }
    
    db.run(`
        INSERT INTO saved_histograms (
            name,
            scenario_id,
            scenario_name,
            computed_fee_id,
            computed_fee_name,
            filters,
            impact_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        name,
        scenario_id,
        scenario_name,
        computed_fee_id,
        computed_fee_name,
        JSON.stringify(filters || {}),
        JSON.stringify(impact_data)
    ], function(err) {
        if (err) {
            console.error('Error creating saved histogram:', err);
            return res.status(500).json({ error: err.message });
        }
        
        // Fetch the newly created histogram
        db.get(`
            SELECT 
                id, name, scenario_id, scenario_name,
                computed_fee_id, computed_fee_name,
                filters, impact_data, created_at
            FROM saved_histograms
            WHERE id = ?
        `, [this.lastID], (err, row) => {
            if (err) {
                console.error('Error fetching created histogram:', err);
                return res.status(500).json({ error: err.message });
            }
            
            const histogram = {
                id: row.id,
                name: row.name,
                scenario_id: row.scenario_id,
                scenario_name: row.scenario_name,
                computed_fee_id: row.computed_fee_id,
                computed_fee_name: row.computed_fee_name,
                filters: row.filters ? JSON.parse(row.filters) : {},
                impact_data: row.impact_data ? JSON.parse(row.impact_data) : [],
                created_at: row.created_at
            };
            
            res.status(201).json(histogram);
        });
    });
});

// DELETE /api/saved-histograms/:id - Delete a saved histogram
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const histogramId = parseInt(req.params.id);
    
    if (isNaN(histogramId)) {
        return res.status(400).json({ error: 'Invalid histogram ID' });
    }
    
    db.run('DELETE FROM saved_histograms WHERE id = ?', [histogramId], function(err) {
        if (err) {
            console.error('Error deleting saved histogram:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Histogram not found' });
        }
        
        res.status(204).send();
    });
});

module.exports = router;
