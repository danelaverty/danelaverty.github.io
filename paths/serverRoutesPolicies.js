const express = require('express');
const router = express.Router();

// Helper function to safely parse condition
const parseCondition = (condition) => {
    if (!condition) return {};
    
    // If it's already an object, return it
    if (typeof condition === 'object') return condition;
    
    // If it's a string, try to parse it as JSON
    if (typeof condition === 'string') {
        // If empty string, return empty object
        if (!condition.trim()) return {};
        
        try {
            return JSON.parse(condition);
        } catch (error) {
            // If JSON parsing fails, return error info
            return { 
                _parseError: true, 
                _originalValue: condition,
                _error: 'Invalid JSON format' 
            };
        }
    }
    
    return {};
};

// Get all policies
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const { group_id } = req.query;
    
    let query = `
        SELECT p.*, pg.name as group_name, pg.priority as group_priority
        FROM policies p
        LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
    `;
    let params = [];
    
    if (group_id) {
        query += ' WHERE p.policy_group_id = ?';
        params.push(group_id);
    }
    
    query += ' ORDER BY pg.priority ASC, p.name ASC';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            // Parse condition for each policy
            const policies = rows.map(row => ({
                ...row,
                condition: parseCondition(row.condition)
            }));
            res.json(policies);
        }
    });
});

// Get a specific policy by ID
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const query = `
        SELECT p.*, pg.name as group_name, pg.priority as group_priority
        FROM policies p
        LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
        WHERE p.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Policy not found' });
        } else {
            res.json({
                ...row,
                condition: parseCondition(row.condition)
            });
        }
    });
});

// Create a new policy
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { 
        name, 
        type, 
        field, 
        condition, 
        affects_direct, 
        affects_inverse, 
        policy_group_id 
    } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Policy name is required' });
    }
    if (!type || !['reduce_percentage', 'set_value'].includes(type)) {
        return res.status(400).json({ error: 'Valid policy type is required (reduce_percentage or set_value)' });
    }
    if (!field || !field.trim()) {
        return res.status(400).json({ error: 'Field is required' });
    }

    // Store condition as raw string - let the user input be stored exactly as typed
    let conditionToStore = condition;
    if (typeof condition === 'object') {
        // If frontend sends an object, convert to string for storage
        conditionToStore = JSON.stringify(condition);
    } else if (!condition) {
        // If no condition, store empty string
        conditionToStore = '';
    }
    
    const stmt = db.prepare(`
        INSERT INTO policies (
            name, type, field, condition, 
            affects_direct, affects_inverse, policy_group_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
        name.trim(),
        type,
        field.trim(),
        conditionToStore,
        affects_direct || '',
        affects_inverse || '',
        policy_group_id || 1
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            // Return the created policy with group info
            const selectQuery = `
                SELECT p.*, pg.name as group_name, pg.priority as group_priority
                FROM policies p
                LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
                WHERE p.id = ?
            `;
            
            db.get(selectQuery, [this.lastID], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.status(201).json({
                        ...row,
                        condition: parseCondition(row.condition)
                    });
                }
            });
        }
    });
});

// Update a policy
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { 
        name, 
        type, 
        field, 
        condition, 
        affects_direct, 
        affects_inverse, 
        policy_group_id 
    } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Policy name is required' });
    }
    if (!type || !['reduce_percentage', 'set_value'].includes(type)) {
        return res.status(400).json({ error: 'Valid policy type is required (reduce_percentage or set_value)' });
    }
    if (!field || !field.trim()) {
        return res.status(400).json({ error: 'Field is required' });
    }

    // Store condition as raw string - let the user input be stored exactly as typed
    let conditionToStore = condition;
    if (typeof condition === 'object') {
        // If frontend sends an object, convert to string for storage
        conditionToStore = JSON.stringify(condition);
    } else if (!condition) {
        // If no condition, store empty string
        conditionToStore = '';
    }
    
    const stmt = db.prepare(`
        UPDATE policies 
        SET name = ?, type = ?, field = ?, condition = ?,
            affects_direct = ?, affects_inverse = ?, policy_group_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run([
        name.trim(),
        type,
        field.trim(),
        conditionToStore,
        affects_direct || '',
        affects_inverse || '',
        policy_group_id || 1,
        id
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Policy not found' });
        } else {
            // Return updated policy with group info
            const selectQuery = `
                SELECT p.*, pg.name as group_name, pg.priority as group_priority
                FROM policies p
                LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
                WHERE p.id = ?
            `;
            
            db.get(selectQuery, [id], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.json({
                        ...row,
                        condition: parseCondition(row.condition)
                    });
                }
            });
        }
    });
});

// Delete a policy
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if policy is used in any scenarios
    db.get("SELECT COUNT(*) as count FROM scenario_policies WHERE policy_id = ?", [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (result.count > 0) {
            res.status(400).json({ 
                error: `Cannot delete policy: it is used in ${result.count} scenario(s). Remove it from all scenarios first.` 
            });
            return;
        }
        
        // Safe to delete
        db.run("DELETE FROM policies WHERE id = ?", [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Policy not found' });
            } else {
                res.json({ success: true, deletedId: parseInt(id) });
            }
        });
    });
});

// Duplicate/copy a policy
router.post('/:id/duplicate', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name } = req.body; // Optional new name
    
    // Get the original policy
    db.get("SELECT * FROM policies WHERE id = ?", [id], (err, policy) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!policy) {
            res.status(404).json({ error: 'Policy not found' });
            return;
        }
        
        // Create a copy with new name
        const newName = name ? name.trim() : `${policy.name} (Copy)`;
        
        const stmt = db.prepare(`
            INSERT INTO policies (
                name, type, field, condition, 
                affects_direct, affects_inverse, policy_group_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            newName,
            policy.type,
            policy.field,
            policy.condition, // Store the original condition as-is
            policy.affects_direct,
            policy.affects_inverse,
            policy.policy_group_id
        ], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                // Return the new policy with group info
                const selectQuery = `
                    SELECT p.*, pg.name as group_name, pg.priority as group_priority
                    FROM policies p
                    LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
                    WHERE p.id = ?
                `;
                
                db.get(selectQuery, [this.lastID], (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.status(201).json({
                            ...row,
                            condition: parseCondition(row.condition)
                        });
                    }
                });
            }
        });
    });
});

// Get policies for a specific scenario
router.get('/scenario/:scenario_id', (req, res) => {
    const db = req.app.locals.db;
    const { scenario_id } = req.params;
    
    const query = `
        SELECT p.*, pg.name as group_name, pg.priority as group_priority, 
               sp.execution_order, sp.value as scenario_value
        FROM policies p
        INNER JOIN scenario_policies sp ON p.id = sp.policy_id
        LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
        WHERE sp.scenario_id = ?
        ORDER BY sp.execution_order ASC, pg.priority ASC, p.name ASC
    `;
    
    db.all(query, [scenario_id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const policies = rows.map(row => ({
                ...row,
                value: row.scenario_value, // Use scenario-specific value
                condition: parseCondition(row.condition)
            }));
            res.json(policies);
        }
    });
});

// Get scenarios that use a specific policy
router.get('/:id/scenarios', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const query = `
        SELECT s.*, sp.execution_order
        FROM scenarios s
        INNER JOIN scenario_policies sp ON s.id = sp.scenario_id
        WHERE sp.policy_id = ?
        ORDER BY s.name ASC
    `;
    
    db.all(query, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            // Parse filters for each scenario
            const scenarios = rows.map(row => ({
                ...row,
                filters: row.filters ? JSON.parse(row.filters) : {}
            }));
            res.json(scenarios);
        }
    });
});

module.exports = router;
