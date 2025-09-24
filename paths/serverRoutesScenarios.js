// serverRoutesScenarios.js
const express = require('express');
const { 
    calculateBaseline, 
    calculateBaselineWithCache,
    refreshComputedFeeCache
} = require('./serverCalcsBaseline');
const { 
    calculateScenario, 
    calculateScenarioByPID, 
    calculateScenarioByPIDBatch, 
    calculateScenarioBatch
} = require('./serverCalcsScenarios');
const { calculateScenarioAggregated } = require('./serverCalcsScenariosAggregated');
const { calculateScenarioAggregatedByPID } = require('./serverCalcsScenariosAggregatedByPID');
const router = express.Router();


const updateScenarioPolicies = (db, scenarioId, policyData) => {
    console.log('updateScenarioPolicies called with:', { scenarioId, policyData }); // Debug log
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // First, delete existing associations
            db.run("DELETE FROM scenario_policies WHERE scenario_id = ?", [scenarioId], (err) => {
                if (err) {
                    console.error('Error deleting existing policies:', err);
                    reject(err);
                    return;
                }
                
                console.log('Deleted existing policies for scenario', scenarioId);
                
                // If no policies to add, we're done
                if (!policyData || policyData.length === 0) {
                    console.log('No policies to add, resolving');
                    resolve();
                    return;
                }
                
                // Insert new associations with execution order and value
                const stmt = db.prepare("INSERT INTO scenario_policies (scenario_id, policy_id, execution_order, value) VALUES (?, ?, ?, ?)");
                
                let completed = 0;
                let hasError = false;
                
                policyData.forEach((policyItem, index) => {
                    // Handle both old format (just IDs) and new format (objects with policy_id and value)
                    const policyId = typeof policyItem === 'object' ? policyItem.policy_id : policyItem;
                    const value = typeof policyItem === 'object' ? policyItem.value : null;
                    
                    console.log(`Inserting policy ${index + 1}:`, { policyId, value, execution_order: index });
                    
                    stmt.run([scenarioId, policyId, index, value], (err) => {
                        if (err && !hasError) {
                            console.error('Error inserting policy:', err);
                            hasError = true;
                            reject(err);
                            return;
                        }
                        
                        completed++;
                        console.log(`Completed ${completed}/${policyData.length} policy insertions`);
                        
                        if (completed === policyData.length && !hasError) {
                            stmt.finalize();
                            console.log('All policies inserted successfully');
                            resolve();
                        }
                    });
                });
            });
        });
    });
};

// Get baseline calculations (no policies applied)
router.post('/baseline', (req, res) => {
    const db = req.app.locals.db;
    const { filters = {} } = req.body;
    
    // Use the updated calculateBaseline function from serverCalculations.js
    calculateBaselineWithCache(db, filters)
        .then(result => res.json(result))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Apply scenario with cumulative policy effects
router.post('/calculate', (req, res) => {
    const db = req.app.locals.db;
    const { policies = [], filters = {} } = req.body;
    
    calculateScenario(db, policies, filters)
        .then(result => res.json(result))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Batch calculation endpoint - calculates all policy steps in one request
router.post('/calculate-batch', (req, res) => {
    const db = req.app.locals.db;
    const { policies = [], filters = {} } = req.body;
    
    console.log(`=== BATCH CALCULATION START ===`);
    console.log(`Policies: ${policies.length}`);
    console.log(`Filters:`, filters);
    const startTime = Date.now();
    
    calculateScenarioBatch(db, policies, filters)
        .then(result => {
            const endTime = Date.now();
            console.log(`=== BATCH CALCULATION COMPLETE ===`);
            console.log(`Duration: ${endTime - startTime}ms`);
            console.log(`Steps calculated: ${result.scenario_steps}`);
            res.json(result);
        })
        .catch(err => {
            console.error('=== BATCH CALCULATION ERROR ===', err);
            res.status(500).json({ error: err.message });
        });
});

// NEW: Aggregated batch calculation - uses SQL aggregates for performance
router.post('/calculate-batch-aggregated', (req, res) => {
    const db = req.app.locals.db;
    const { policies = [], filters = {} } = req.body;
    
    console.log(`=== AGGREGATED BATCH CALCULATION START ===`);
    console.log(`Policies: ${policies.length}`);
    console.log(`Filters:`, filters);
    const startTime = Date.now();
    
    calculateScenarioAggregated(db, policies, filters)
        .then(result => {
            const endTime = Date.now();
            console.log(`=== AGGREGATED BATCH CALCULATION COMPLETE ===`);
            console.log(`Duration: ${endTime - startTime}ms`);
            console.log(`Steps calculated: ${result.scenario_steps}`);
            res.json(result);
        })
        .catch(err => {
            console.error('=== AGGREGATED BATCH CALCULATION ERROR ===', err);
            res.status(500).json({ error: err.message });
        });
});

router.post('/calculate-by-pid-batch', (req, res) => {
    const db = req.app.locals.db;
    const { policies = [], filters = {} } = req.body;
    
    console.log(`=== BATCH PID CALCULATION START ===`);
    console.log(`Policies: ${policies.length}`);
    console.log(`Filters:`, filters);
    const startTime = Date.now();
    
    calculateScenarioByPIDBatch(db, policies, filters)
        .then(result => {
            const endTime = Date.now();
            console.log(`=== BATCH PID CALCULATION COMPLETE ===`);
            console.log(`Duration: ${endTime - startTime}ms`);
            console.log(`PIDs processed: ${result.total_pids}`);
            res.json(result);
        })
        .catch(err => {
            console.error('=== BATCH PID CALCULATION ERROR ===', err);
            res.status(500).json({ error: err.message });
        });
});

// Apply scenario with cumulative policy effects broken down by PID
router.post('/calculate-by-pid', (req, res) => {
    const db = req.app.locals.db;
    const { policies = [], filters = {} } = req.body;
    
    calculateScenarioByPID(db, policies, filters)
        .then(result => res.json(result))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Get all scenarios
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    
    // Get all scenarios first
    db.all("SELECT * FROM scenarios ORDER BY display_order ASC, created_at DESC", (err, scenarios) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (scenarios.length === 0) {
            res.json([]);
            return;
        }
        
        // Get policies for all scenarios
        const scenarioIds = scenarios.map(s => s.id);
        const placeholders = scenarioIds.map(() => '?').join(',');
        
const policyQuery = `
    SELECT 
        p.*, 
        pg.name as group_name, 
        sp.execution_order,
        sp.value as scenario_value,
        sp.scenario_id
    FROM policies p
    INNER JOIN scenario_policies sp ON p.id = sp.policy_id
    LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
    WHERE sp.scenario_id IN (${placeholders})
    ORDER BY sp.scenario_id, sp.execution_order ASC
`;
        
        db.all(policyQuery, scenarioIds, (err, allPolicies) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Group policies by scenario
            const policiesByScenario = {};
            allPolicies.forEach(policy => {
                if (!policiesByScenario[policy.scenario_id]) {
                    policiesByScenario[policy.scenario_id] = [];
                }
policiesByScenario[policy.scenario_id].push({
    ...policy,
    value: policy.scenario_value !== null ? policy.scenario_value : policy.value, // Fallback to policy value during migration
    condition: policy.condition ? JSON.parse(policy.condition) : {}
});
            });
            
            // Attach policies to each scenario
            const scenariosWithPolicies = scenarios.map(scenario => ({
                ...scenario,
                filters: JSON.parse(scenario.filters || '{}'),
                policies: policiesByScenario[scenario.id] || []
            }));
            
            res.json(scenariosWithPolicies);
        });
    });
});

router.post('/refresh-cache', async (req, res) => {
        const db = req.app.locals.db;
        
        try {
                    await refreshComputedFeeCache(db);
                    res.json({ success: true, message: 'Computed fee cache refreshed successfully' });
                } catch (error) {
                            console.error('Error refreshing computed fee cache:', error);
                            res.status(500).json({ error: error.message });
                        }
});

router.get('/refresh-cache/status', (req, res) => {
    const db = req.app.locals.db;
    
    Promise.all([
        // Get current cache count
        new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM computed_fee_cache", (err, result) => {
                if (err) reject(err);
                else resolve(result.count);
            });
        }),
        // Get total product data count
        new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM product_data", (err, result) => {
                if (err) reject(err);
                else resolve(result.count);
            });
        })
    ]).then(([cacheCount, totalCount]) => {
        res.json({
            processed: cacheCount,
            total: totalCount,
            percentage: totalCount > 0 ? Math.round((cacheCount / totalCount) * 100) : 0
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
});

// Create new scenario
router.post('/', async (req, res) => {
    const db = req.app.locals.db;
    const { name, description, policies = [], filters = {} } = req.body;
    
    console.log('Creating scenario with policies:', policies); // Debug log
    
    try {
        // Create the scenario first
        const scenarioId = await new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO scenarios (name, description, filters, display_order) VALUES (?, ?, ?, ?)", 
                [name, description, JSON.stringify(filters), 999], 
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
        
        // Update the junction table with policies
        await updateScenarioPolicies(db, scenarioId, policies);
        
        res.json({ 
            id: scenarioId, 
            name, 
            description,
            policies,
            filters,
            created_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error creating scenario:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update scenario
router.put('/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, description, policies = [], filters = {} } = req.body;
    
    console.log('Updating scenario with policies:', policies); // Debug log
    
    try {
        // Update the scenario
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE scenarios SET name = ?, description = ?, filters = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", 
                [name, description, JSON.stringify(filters), id], 
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Update the junction table with policies
        await updateScenarioPolicies(db, parseInt(id), policies);
        
        res.json({ 
            id: parseInt(id),
            name, 
            description,
            policies,
            filters,
            updated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error updating scenario:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/order', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { newOrder } = req.body;
    
    try {
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE scenarios SET display_order = ? WHERE id = ?", 
                [newOrder, id], 
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating scenario order:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Get scenario details
    db.get("SELECT * FROM scenarios WHERE id = ?", [id], (err, scenario) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!scenario) {
            res.status(404).json({ error: 'Scenario not found' });
            return;
        }
        
        // Get associated policies with full details
const policyQuery = `
    SELECT p.*, pg.name as group_name, sp.execution_order, sp.value as scenario_value
    FROM policies p
    INNER JOIN scenario_policies sp ON p.id = sp.policy_id
    LEFT JOIN policy_groups pg ON p.policy_group_id = pg.id
    WHERE sp.scenario_id = ?
    ORDER BY sp.execution_order ASC
`;
        
        db.all(policyQuery, [id], (err, policies) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                ...scenario,
                filters: JSON.parse(scenario.filters || '{}'),
                policies: policies.map(p => ({
                    ...p,
                    condition: p.condition ? JSON.parse(p.condition) : {}
                }))
            });
        });
    });
});

// Delete scenario
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    db.run("DELETE FROM scenarios WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, deletedId: parseInt(id) });
        }
    });
});

router.post('/calculate-by-pid-batch-aggregated', (req, res) => {
    const db = req.app.locals.db;
    const { policies = [], filters = {}, mode = 'summary' } = req.body;
    
    console.log(`=== AGGREGATED BATCH PID CALCULATION START (${mode} mode) ===`);
    const startTime = Date.now();
    
    calculateScenarioAggregatedByPID(db, policies, filters)
        .then(result => {
            const endTime = Date.now();
            console.log(`=== AGGREGATED BATCH PID CALCULATION COMPLETE ===`);
            console.log(`Duration: ${endTime - startTime}ms`);
            console.log(`PIDs processed: ${result.total_pids}`);
            
            if (mode === 'summary') {
                // Return only what's needed for histogram and comparison table
                const summaryResponse = {
                    breakdown_by_pid: true,
                    batch: true,
                    aggregated: true,
                    total_pids: result.total_pids,
                    pid_list: result.pid_list,
                    // Convert full results to summary format (baseline + final only)
                    pid_summaries: {},
                    filters: result.filters
                };
                
                // For each PID, only include baseline and final result
                result.pid_list.forEach(pid => {
                    const pidResults = result.results_by_pid[pid];
                    if (pidResults && pidResults.length > 0) {
                        summaryResponse.pid_summaries[pid] = {
                            baseline: pidResults[0],
                            final: pidResults[pidResults.length - 1],
                            row_count: pidResults[0].row_count
                        };
                    }
                });
                
                res.json(summaryResponse);
            } else if (mode === 'single_pid') {
                // Return full details for a single PID
                const requestedPID = req.body.pid;
                if (requestedPID && result.results_by_pid[requestedPID]) {
                    res.json({
                        pid: requestedPID,
                        results: result.results_by_pid[requestedPID],
                        filters: result.filters
                    });
                } else {
                    res.status(404).json({ error: 'PID not found' });
                }
            } else {
                // Full mode - will likely fail for large datasets
                res.json(result);
            }
        })
        .catch(err => {
            console.error('=== AGGREGATED BATCH PID CALCULATION ERROR ===', err);
            res.status(500).json({ error: err.message });
        });
});

// Debug endpoint for scenarios
router.post('/debug', (req, res) => {
    const db = req.app.locals.db;
    const { policies = [], filters = {} } = req.body;
    
    let whereClause = '1=1';
    const params = [];
    
    // Apply filters dynamically
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
            whereClause += ` AND ${key} = ?`;
            params.push(value);
        }
    });
    
    // Get sample data to test against
    const sampleQuery = `SELECT * FROM product_data WHERE ${whereClause} LIMIT 10`;
    
    db.all(sampleQuery, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        const debugResults = [];
        
        rows.forEach((row, rowIndex) => {
            const rowDebug = {
                pid: row.pid,
                originalValues: {
                    fee13: row.fee13,
                    fee14: row.fee14,
                    type: row.type
                },
                policyResults: []
            };
            
            // Test each policy against this row
            policies.forEach((policy, policyIndex) => {
                // Check condition matching
                const conditionResults = {};
                let overallMatch = true;
                
                Object.entries(policy.condition || {}).forEach(([key, value]) => {
                    const rowValue = row[key];
                    const matches = !value || value === '' || rowValue === value;
                    conditionResults[key] = {
                        expected: value,
                        actual: rowValue,
                        matches: matches
                    };
                    if (!matches) overallMatch = false;
                });
                
                const policyResult = {
                    policyName: policy.name,
                    conditionMatch: overallMatch,
                    conditionDetails: conditionResults
                };
                
                if (overallMatch) {
                    const originalValue = row[policy.field];
                    let newValue = originalValue;
                    
                    if (policy.type === 'set_value') {
                        newValue = policy.value;
                    } else if (policy.type === 'reduce_percentage') {
                        const reduction = policy.value / 100;
                        newValue = (originalValue || 0) * (1 - reduction);
                    }
                    
                    policyResult.transformation = {
                        field: policy.field,
                        original: originalValue,
                        new: newValue,
                        action: policy.type
                    };
                }
                
                rowDebug.policyResults.push(policyResult);
            });
            
            debugResults.push(rowDebug);
        });
        
        res.json({
            debug: true,
            totalRows: rows.length,
            sampleData: rows.slice(0, 3), // First 3 rows for inspection
            debugResults: debugResults,
            policies: policies,
            filters: filters
        });
    });
});

module.exports = router;
