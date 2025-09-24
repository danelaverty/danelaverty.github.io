// serverRoutesHistogramGrids.js
const express = require('express');
const router = express.Router();

// GET /api/histogram-grids - Get all saved grids
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    
    db.all(`
        SELECT 
            id, name, columns, grid_width, row_height, 
            histogram_ids, created_at, updated_at
        FROM histogram_grids
        ORDER BY created_at DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('Error fetching histogram grids:', err);
            return res.status(500).json({ error: err.message });
        }
        
        const grids = rows.map(row => ({
            id: row.id,
            name: row.name,
            columns: row.columns,
            gridWidth: row.grid_width,
            rowHeight: row.row_height,
            histogramIds: JSON.parse(row.histogram_ids),
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
        
        res.json(grids);
    });
});

// POST /api/histogram-grids - Save a new grid
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { name, columns, gridWidth, rowHeight, histogramIds } = req.body;
    
    if (!name || !histogramIds || !Array.isArray(histogramIds)) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, histogramIds (array)' 
        });
    }
    
    db.run(`
        INSERT INTO histogram_grids (
            name, columns, grid_width, row_height, histogram_ids
        ) VALUES (?, ?, ?, ?, ?)
    `, [
        name,
        columns || 2,
        gridWidth || '100%',
        rowHeight || 250,
        JSON.stringify(histogramIds)
    ], function(err) {
        if (err) {
            console.error('Error creating histogram grid:', err);
            return res.status(500).json({ error: err.message });
        }
        
        db.get(`
            SELECT id, name, columns, grid_width, row_height, 
                   histogram_ids, created_at, updated_at
            FROM histogram_grids
            WHERE id = ?
        `, [this.lastID], (err, row) => {
            if (err) {
                console.error('Error fetching created grid:', err);
                return res.status(500).json({ error: err.message });
            }
            
            const grid = {
                id: row.id,
                name: row.name,
                columns: row.columns,
                gridWidth: row.grid_width,
                rowHeight: row.row_height,
                histogramIds: JSON.parse(row.histogram_ids),
                created_at: row.created_at,
                updated_at: row.updated_at
            };
            
            res.status(201).json(grid);
        });
    });
});

// PUT /api/histogram-grids/:id - Update a grid
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const gridId = parseInt(req.params.id);
    const { name, columns, gridWidth, rowHeight, histogramIds } = req.body;
    
    if (isNaN(gridId)) {
        return res.status(400).json({ error: 'Invalid grid ID' });
    }
    
    db.run(`
        UPDATE histogram_grids 
        SET name = ?, columns = ?, grid_width = ?, row_height = ?, 
            histogram_ids = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [
        name,
        columns,
        gridWidth,
        rowHeight,
        JSON.stringify(histogramIds),
        gridId
    ], function(err) {
        if (err) {
            console.error('Error updating histogram grid:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Grid not found' });
        }
        
        db.get(`
            SELECT id, name, columns, grid_width, row_height, 
                   histogram_ids, created_at, updated_at
            FROM histogram_grids
            WHERE id = ?
        `, [gridId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            const grid = {
                id: row.id,
                name: row.name,
                columns: row.columns,
                gridWidth: row.grid_width,
                rowHeight: row.row_height,
                histogramIds: JSON.parse(row.histogram_ids),
                created_at: row.created_at,
                updated_at: row.updated_at
            };
            
            res.json(grid);
        });
    });
});

// DELETE /api/histogram-grids/:id - Delete a grid
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const gridId = parseInt(req.params.id);
    
    if (isNaN(gridId)) {
        return res.status(400).json({ error: 'Invalid grid ID' });
    }
    
    db.run('DELETE FROM histogram_grids WHERE id = ?', [gridId], function(err) {
        if (err) {
            console.error('Error deleting histogram grid:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Grid not found' });
        }
        
        res.status(204).send();
    });
});

module.exports = router;
