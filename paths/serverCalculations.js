// Function to recalculate computed fees in the database
async function recalculateComputedFees() {
    return Promise.resolve();
}

// Simple math expression evaluator (safe for basic operations)
function evaluateBasicMath(expression) {
    // Remove spaces 
    const cleanExpr = expression.replace(/\s/g, '');
    
    // Check that after all replacements, expression should only contain numbers and math operators
    const mathOnlyPattern = /^[0-9+\-*/.() ]+$/;
    if (!mathOnlyPattern.test(cleanExpr)) {
        throw new Error('Formula contains unresolved references: ' + cleanExpr);
    }
    
    // Use Function constructor for safe evaluation (only basic math)
    try {
        return Function('"use strict"; return (' + cleanExpr + ')')();
    } catch (error) {
        throw new Error('Invalid formula: ' + error.message);
    }
}

function getCachedComputedFeeTotals(db, whereClause = '1=1', params = []) {
    return new Promise((resolve, reject) => {
        // Build query to sum cached computed fees
        const computedFeeColumns = [];
        for (let i = 1; i <= 30; i++) {
            computedFeeColumns.push(`SUM(cfc.computed_fee${i}) as total_computed_fee${i}`);
        }
        
        const query = `
            SELECT ${computedFeeColumns.join(', ')}
            FROM product_data pd
            LEFT JOIN computed_fee_cache cfc ON pd.rowid = cfc.product_data_rowid
            WHERE ${whereClause}
        `;
        
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                // Convert null values to 0 and build result object
                const result = {};
                for (let i = 1; i <= 30; i++) {
                    result[`total_computed_fee${i}`] = row[`total_computed_fee${i}`] || 0;
                }
                resolve(result);
            }
        });
    });
}

// Updated calculateBaseline to use cached computed fees
function calculateBaselineWithCache(db, filters = {}) {
    return new Promise((resolve, reject) => {
        let whereClause = '1=1';
        const params = [];
        
        // Apply filters dynamically
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                whereClause += ` AND pd.${key} = ?`;
                params.push(value);
            }
        });
        
        // Get regular fee totals and cached computed fee totals in parallel
        Promise.all([
            // Regular fee totals with row count
            new Promise((resolve, reject) => {
                const regularFeeQuery = `
                    SELECT 
                        COUNT(*) as row_count,
                        SUM(fee1) as total_fee1, SUM(fee2) as total_fee2, SUM(fee3) as total_fee3,
                        SUM(fee4) as total_fee4, SUM(fee5) as total_fee5, SUM(fee6) as total_fee6,
                        SUM(fee7) as total_fee7, SUM(fee8) as total_fee8, SUM(fee9) as total_fee9,
                        SUM(fee10) as total_fee10, SUM(fee11) as total_fee11, SUM(fee12) as total_fee12,
                        SUM(fee13) as total_fee13, SUM(fee14) as total_fee14, SUM(fee15) as total_fee15,
                        SUM(fee16) as total_fee16, SUM(fee17) as total_fee17
                    FROM product_data pd 
                    WHERE ${whereClause}
                `;
                
                db.get(regularFeeQuery, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            }),
            
            // Cached computed fee totals
            getCachedComputedFeeTotals(db, whereClause, params)
            
        ]).then(([regularTotals, computedTotals]) => {
            resolve({
                baseline: true,
                row_count: regularTotals.row_count,
                // Regular fees
                total_fee1: regularTotals.total_fee1 || 0,
                total_fee2: regularTotals.total_fee2 || 0,
                total_fee3: regularTotals.total_fee3 || 0,
                total_fee4: regularTotals.total_fee4 || 0,
                total_fee5: regularTotals.total_fee5 || 0,
                total_fee6: regularTotals.total_fee6 || 0,
                total_fee7: regularTotals.total_fee7 || 0,
                total_fee8: regularTotals.total_fee8 || 0,
                total_fee9: regularTotals.total_fee9 || 0,
                total_fee10: regularTotals.total_fee10 || 0,
                total_fee11: regularTotals.total_fee11 || 0,
                total_fee12: regularTotals.total_fee12 || 0,
                total_fee13: regularTotals.total_fee13 || 0,
                total_fee14: regularTotals.total_fee14 || 0,
                total_fee15: regularTotals.total_fee15 || 0,
                total_fee16: regularTotals.total_fee16 || 0,
                total_fee17: regularTotals.total_fee17 || 0,
                // Cached computed fees
                ...computedTotals,
                filters: filters
            });
        }).catch(reject);
    });
}

// Updated raw data query to include cached computed fees
function getRawDataWithCachedComputedFees(db, filters = {}) {
    return new Promise((resolve, reject) => {
        let whereClause = '1=1';
        const params = [];
        
        // Apply filters dynamically
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                whereClause += ` AND pd.${key} = ?`;
                params.push(value);
            }
        });
        
        // Build computed fee columns for SELECT
        const computedFeeColumns = [];
        for (let i = 1; i <= 30; i++) {
            computedFeeColumns.push(`cfc.computed_fee${i}`);
        }
        
        const query = `
            SELECT 
                pd.rowid,
                pd.pid, pd.attr1, pd.attr2, pd.attr3, pd.attr4, pd.attr5, 
                pd.type, pd.subtype, pd.quantity,
                pd.fee1, pd.fee2, pd.fee3, pd.fee4, pd.fee5, 
                pd.fee6, pd.fee7, pd.fee8, pd.fee9, pd.fee10, 
                pd.fee11, pd.fee12, pd.fee13, pd.fee14, pd.fee15, 
                pd.fee16, pd.fee17,
                ${computedFeeColumns.join(', ')}
            FROM product_data pd 
            LEFT JOIN computed_fee_cache cfc ON pd.rowid = cfc.product_data_rowid
            WHERE ${whereClause}
            ORDER BY pd.pid ASC
        `;
        
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    rows: rows,
                    count: rows.length,
                    filters: filters
                });
            }
        });
    });
}

// Cache refresh trigger - call this when computed fees are modified
async function refreshComputedFeeCache(db) {
    const ComputedFeeCacheService = require('./ComputedFeeCacheService');
    const cacheService = new ComputedFeeCacheService(db);
    
    try {
        await cacheService.refreshFullCache();
        console.log('Computed fee cache refreshed successfully');
    } catch (error) {
        console.error('Error refreshing computed fee cache:', error);
        throw error;
    }
}

// Helper function to get field name from computed fee ID
function getComputedFeeField(computedFeeId) {
    return `computed_fee${computedFeeId}`;
}

async function calculateScenarioByPIDBatch(db, policies = [], filters = {}) {
    let whereClause = '1=1';
    const params = [];
    
    // Apply filters dynamically
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
            whereClause += ` AND ${key} = ?`;
            params.push(value);
        }
    });
    
    try {
        // Get active computed fee rules and filtered data in parallel
        const [computedFees, originalRows] = await Promise.all([
            new Promise((resolve, reject) => {
                db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            new Promise((resolve, reject) => {
                db.all(`SELECT * FROM product_data WHERE ${whereClause}`, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            })
        ]);
        
        // Group rows by PID
        const rowsByPID = {};
        originalRows.forEach(row => {
            if (!rowsByPID[row.pid]) {
                rowsByPID[row.pid] = [];
            }
            rowsByPID[row.pid].push(row);
        });
        
        const pidList = Object.keys(rowsByPID).sort();
        const resultsByPID = {};
        
        // Process each PID with batch logic
        for (const pid of pidList) {
            const pidRows = rowsByPID[pid];
            const pidResults = [];
            
            // Step 1: Calculate baseline for this PID
            const baselineTotals = {
                total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                total_fee16: 0, total_fee17: 0
            };
            
            // Sum regular fees for this PID
            pidRows.forEach(row => {
                for (let i = 1; i <= 17; i++) {
                    baselineTotals[`total_fee${i}`] += row[`fee${i}`] || 0;
                }
            });
            
            // Get cached computed fees for this PID's rows
const pidComputedTotals = await getCachedComputedFeeTotals(db, `pd.pid = ?`, [pid]);
            
            // Add cached computed fee totals to baseline
            Object.keys(pidComputedTotals).forEach(key => {
                baselineTotals[key] = pidComputedTotals[key] || 0;
            });
            
            const baseline = {
                baseline: true,
                pid: pid,
                row_count: pidRows.length,
                ...baselineTotals,
                filters: filters
            };
            pidResults.push(baseline);
            
            // Step 2: Apply policies cumulatively
            let currentRows = pidRows.map(row => ({ ...row })); // Deep copy for modifications
            let previousTotals = { ...baselineTotals }; // Track previous step for policy effect calculations
            
            for (let policyIndex = 0; policyIndex < policies.length; policyIndex++) {
                const currentPolicy = policies[policyIndex];
                
                // Apply this policy to current rows (modifying in place for cumulative effect)
                currentRows.forEach(row => {
                    // Check if policy conditions match this row
                    const conditionMatch = Object.entries(currentPolicy.condition || {}).every(([key, value]) => {
                        const rowValue = row[key];
                        const matches = !value || value === '' || rowValue === value;
                        return matches;
                    });
                    
                    if (conditionMatch) {
                        if (currentPolicy.type === 'reduce_percentage') {
                            const reduction = currentPolicy.value / 100;
                            
                            if (currentPolicy.field && /^fee\d+$/.test(currentPolicy.field)) {
                                const newValue = (row[currentPolicy.field] || 0) * (1 - reduction);
                                row[currentPolicy.field] = newValue;
                            }
                        } else if (currentPolicy.type === 'set_value') {
                            if (currentPolicy.field && /^fee\d+$/.test(currentPolicy.field)) {
                                const quantity = row.quantity || 1;
                                const newValue = (parseFloat(currentPolicy.value) || 0) * quantity;
                                row[currentPolicy.field] = newValue;
                            }
                        }
                    }
                });
                
                // Calculate totals after applying this policy - THIS WAS MISSING!
                const currentTotals = {
                    total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                    total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                    total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                    total_fee16: 0, total_fee17: 0
                };
                
                // Sum regular fees from current modified rows
                currentRows.forEach(row => {
                    for (let i = 1; i <= 17; i++) {
                        currentTotals[`total_fee${i}`] += row[`fee${i}`] || 0;
                    }
                });
                
                // Start with cached computed fee totals from baseline
                for (let i = 1; i <= 30; i++) {
                    const computedKey = `total_computed_fee${i}`;
                    if (pidComputedTotals.hasOwnProperty(computedKey)) {
                        currentTotals[computedKey] = pidComputedTotals[computedKey];
                    }
                }
                
                // Apply policy effects to computed fees (affects_direct and affects_inverse)
                const targetFeeKey = `total_${currentPolicy.field}`;
                const previousValue = previousTotals[targetFeeKey] || 0;
                const currentValue = currentTotals[targetFeeKey] || 0;
                const netEffect = currentValue - previousValue;
                
                // Apply direct effects to computed fees
                const directFees = parseComputedFeeList(currentPolicy.affects_direct);
                directFees.forEach(feeField => {
                    const feeId = getComputedFeeId(feeField);
                    if (feeId && computedFees.find(cf => cf.id === feeId)) {
                        const totalKey = `total_${feeField}`;
                        if (currentTotals.hasOwnProperty(totalKey)) {
                            currentTotals[totalKey] += netEffect;
                        }
                    }
                });
                
                // Apply inverse effects to computed fees
                const inverseFees = parseComputedFeeList(currentPolicy.affects_inverse);
                inverseFees.forEach(feeField => {
                    const feeId = getComputedFeeId(feeField);
                    if (feeId && computedFees.find(cf => cf.id === feeId)) {
                        const totalKey = `total_${feeField}`;
                        if (currentTotals.hasOwnProperty(totalKey)) {
                            currentTotals[totalKey] -= netEffect;
                        }
                    }
                });
                
                // Create result for this policy step
                const policyResult = {
                    baseline: false,
                    pid: pid,
                    policies: policies.slice(0, policyIndex + 1),
                    row_count: currentRows.length,
                    policyName: currentPolicy.name,
                    policyData: currentPolicy,
                    ...currentTotals,
                    filters: filters
                };
                
                pidResults.push(policyResult);
                
                // Update previousTotals for next iteration 
                previousTotals = { ...currentTotals };
            }
            
            resultsByPID[pid] = pidResults;
        }
        
        return {
            breakdown_by_pid: true,
            batch: true,
            total_pids: pidList.length,
            pid_list: pidList,
            results_by_pid: resultsByPID,
            filters: filters
        };
        
    } catch (error) {
        throw error;
    }
}

function getCachedComputedFeeTotalsForRows(db, rowIds) {
    return new Promise((resolve, reject) => {
        if (!rowIds || rowIds.length === 0) {
            resolve({});
            return;
        }
        
        // Build query to sum cached computed fees for specific rows
        const computedFeeColumns = [];
        for (let i = 1; i <= 30; i++) {
            computedFeeColumns.push(`SUM(cfc.computed_fee${i}) as total_computed_fee${i}`);
        }
        
        const placeholders = rowIds.map(() => '?').join(',');
        const query = `
            SELECT ${computedFeeColumns.join(', ')}
            FROM computed_fee_cache cfc
            WHERE cfc.product_data_rowid IN (${placeholders})
        `;
        
        db.get(query, rowIds, (err, row) => {
            if (err) {
                reject(err);
            } else {
                // Convert null values to 0 and build result object
                const result = {};
                for (let i = 1; i <= 30; i++) {
                    result[`total_computed_fee${i}`] = row[`total_computed_fee${i}`] || 0;
                }
                resolve(result);
            }
        });
    });
}

// Helper function to parse comma-separated computed fee list
function parseComputedFeeList(listString) {
    if (!listString || !listString.trim()) return [];
    return listString.split(',').map(fee => fee.trim()).filter(fee => fee.length > 0);
}

// Helper function to get computed fee ID from field name (e.g., "computed_fee13" -> 13)
function getComputedFeeId(fieldName) {
    const match = fieldName.match(/^computed_fee(\d+)$/);
    return match ? parseInt(match[1]) : null;
}

// Extract computed fee dependencies from formula
function extractComputedFeeDependencies(formula) {
    const dependencies = [];
    const regex = /computed_fee(\d+)/g;
    let match;
    
    while ((match = regex.exec(formula)) !== null) {
        const feeId = parseInt(match[1]);
        if (!dependencies.includes(feeId)) {
            dependencies.push(feeId);
        }
    }
    
    return dependencies;
}

// Detect circular dependencies using depth-first search
function detectCircularDependencies(computedFees) {
    const dependencyMap = new Map();
    
    // Build dependency map
    computedFees.forEach(fee => {
        const dependencies = extractComputedFeeDependencies(fee.formula);
        dependencyMap.set(fee.id, dependencies);
    });
    
    // Check for cycles using DFS
    const visited = new Set();
    const recursionStack = new Set();
    
    function hasCycle(feeId) {
        if (recursionStack.has(feeId)) {
            return true; // Found a cycle
        }
        if (visited.has(feeId)) {
            return false; // Already processed
        }
        
        visited.add(feeId);
        recursionStack.add(feeId);
        
        const dependencies = dependencyMap.get(feeId) || [];
        for (const depId of dependencies) {
            // Only check dependencies that exist in our computed fees
            if (dependencyMap.has(depId) && hasCycle(depId)) {
                return true;
            }
        }
        
        recursionStack.delete(feeId);
        return false;
    }
    
    // Check each computed fee for cycles
    for (const fee of computedFees) {
        if (hasCycle(fee.id)) {
            throw new Error(`Circular dependency detected involving computed fee ${fee.id} (${fee.name})`);
        }
    }
}

// Topologically sort computed fees by dependencies
function sortComputedFeesByDependencies(computedFees) {
    // First check for circular dependencies
    detectCircularDependencies(computedFees);
    
    const dependencyMap = new Map();
    const sorted = [];
    const visited = new Set();
    
    // Build dependency map
    computedFees.forEach(fee => {
        const dependencies = extractComputedFeeDependencies(fee.formula);
        // Filter dependencies to only include existing computed fees
        const validDependencies = dependencies.filter(depId => 
            computedFees.some(cf => cf.id === depId)
        );
        dependencyMap.set(fee.id, validDependencies);
    });
    
    // Topological sort using DFS
    function visit(feeId) {
        if (visited.has(feeId)) {
            return;
        }
        
        visited.add(feeId);
        
        // Visit all dependencies first
        const dependencies = dependencyMap.get(feeId) || [];
        dependencies.forEach(depId => {
            if (computedFees.some(cf => cf.id === depId)) {
                visit(depId);
            }
        });
        
        // Add this fee to sorted list after its dependencies
        const fee = computedFees.find(cf => cf.id === feeId);
        if (fee && !sorted.some(sf => sf.id === feeId)) {
            sorted.push(fee);
        }
    }
    
    // Sort by priority first, then by dependencies
    const feesByPriority = [...computedFees].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    
    feesByPriority.forEach(fee => {
        visit(fee.id);
    });
    
    return sorted;
}

// Calculate computed fees with dependency resolution
function calculateComputedFeesForRows(computedFees, rows, calculatedValues = {}) {
    if (!computedFees || computedFees.length === 0) {
        return calculatedValues;
    }
    
    // Sort computed fees by dependencies
    const sortedFees = sortComputedFeesByDependencies(computedFees);
    
    // Initialize totals for all computed fees
    sortedFees.forEach(fee => {
        const field = getComputedFeeField(fee.id);
        const totalKey = `total_${field}`;
        if (!calculatedValues.hasOwnProperty(totalKey)) {
            calculatedValues[totalKey] = 0;
        }
    });
    
    // Calculate each computed fee in dependency order
    rows.forEach((row, rowIndex) => {
        const rowComputedValues = {}; // Track computed values for this specific row
        
        sortedFees.forEach(feeRule => {
            if (!feeRule.active || !feeRule.formula) {
                return;
            }
            
            // Parse condition from JSON string
            let condition = {};
            try {
                condition = typeof feeRule.condition === 'string' 
                    ? JSON.parse(feeRule.condition) 
                    : (feeRule.condition || {});
            } catch (e) {
                condition = {};
            }
            
            // Check if conditions match
            const conditionMatch = Object.entries(condition).every(([key, value]) => {
                return !value || row[key] === value;
            });
            
            if (conditionMatch) {
                try {
                    // Simple formula evaluation
                    let formula = feeRule.formula;
                    
                    // Replace regular field names with actual values (but not computed_fee references)
                    // Use word boundary to ensure we don't match "fee" that's part of "computed_fee"
                    formula = formula.replace(/\bfee(\d+)\b/g, (match, num) => {
                        return row[`fee${num}`] || 0;
                    });
                    formula = formula.replace(/quantity/g, row.quantity || 0);
                    formula = formula.replace(/pid/g, row.pid || 0);
                    
                    
                    // Replace computed fee references with their calculated values for this row
                    formula = formula.replace(/computed_fee(\d+)/g, (match, feeId) => {
                        const depFeeId = parseInt(feeId);
                        const fieldName = `computed_fee${depFeeId}`;
                        const value = rowComputedValues[fieldName];
                        // Wrap negative numbers in parentheses to avoid double negative issues
                        const finalValue = value !== undefined ? value : 0;
                        return finalValue < 0 ? `(${finalValue})` : finalValue;
                    });
                    
                    const result = evaluateBasicMath(formula);
                    
                    if (!isNaN(result)) {
                        const fieldName = getComputedFeeField(feeRule.id);
                        const totalKey = `total_${fieldName}`;
                        
                        // Store the result for this row
                        rowComputedValues[fieldName] = result;
                        
                        // Add to the total
                        calculatedValues[totalKey] += result;
                    }
                } catch (error) {
                }
            } else {
                // If condition doesn't match, still store 0 for this row to prevent undefined lookups
                const fieldName = getComputedFeeField(feeRule.id);
                rowComputedValues[fieldName] = 0;
            }
        });
        
    });
    
    return calculatedValues;
}

// Calculate baseline (no policies applied) with computed fees
function calculateBaseline(db, filters = {}) {
    return new Promise((resolve, reject) => {
        let whereClause = '1=1';
        const params = [];
        
        // Apply filters dynamically
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                whereClause += ` AND ${key} = ?`;
                params.push(value);
            }
        });
        
        // Get active computed fee rules first
        db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, computedFees) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Get all product data that matches filters
            const dataQuery = `SELECT * FROM product_data WHERE ${whereClause}`;
            
            db.all(dataQuery, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Calculate regular fee totals
                const totals = {
                    total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                    total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                    total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                    total_fee16: 0, total_fee17: 0
                };
                
                // Sum regular fees
                rows.forEach(row => {
                    for (let i = 1; i <= 17; i++) {
                        totals[`total_fee${i}`] += row[`fee${i}`] || 0;
                    }
                });
                
                // Calculate computed fees with dependency resolution
                try {
                    calculateComputedFeesForRows(computedFees, rows, totals);
                } catch (error) {
                    reject(new Error(`Error calculating computed fees: ${error.message}`));
                    return;
                }
                
                resolve({
                    baseline: true,
                    row_count: rows.length,
                    ...totals,
                    filters: filters
                });
            });
        });
    });
}

// Apply scenario with cumulative policy effects and recalculate computed fees
function calculateScenario(db, policies = [], filters = {}) {
    return new Promise((resolve, reject) => {
        let whereClause = '1=1';
        const params = [];
        
        // Apply filters dynamically
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                whereClause += ` AND ${key} = ?`;
                params.push(value);
            }
        });
        
        // Get active computed fee rules and filtered data
        Promise.all([
            new Promise((resolve, reject) => {
                db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            new Promise((resolve, reject) => {
                db.all(`SELECT * FROM product_data WHERE ${whereClause}`, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            // Get baseline totals to calculate policy effects
            calculateBaseline(db, filters)
        ]).then(([computedFees, rows, baseline]) => {
            
            // Start with baseline computed fee values - these will carry forward
            let currentComputedFeeTotals = {};
            computedFees.forEach(fee => {
                const field = `computed_fee${fee.id}`;
                const totalKey = `total_${field}`;
                currentComputedFeeTotals[totalKey] = baseline[totalKey] || 0;
            });
            
            // Apply policies to each row for regular fees only
            const modifiedRows = rows.map(row => {
                const modifiedRow = { ...row };
                let debugInfo = { pid: row.pid, appliedPolicies: [] };
                
                // Apply each policy cumulatively (but only to regular fees)
                policies.forEach((policy, policyIndex) => {
                    // Check if policy conditions match this row
                    const conditionMatch = Object.entries(policy.condition || {}).every(([key, value]) => {
                        const rowValue = row[key];
                        const matches = !value || value === '' || rowValue === value;
                        return matches;
                    });
                    
                    if (conditionMatch) {
                        const originalValue = modifiedRow[policy.field];
                        
                        if (policy.type === 'reduce_percentage') {
                            const reduction = policy.value / 100;
                            
                            if (policy.field && /^fee\d+$/.test(policy.field)) {
                                // Apply to regular fee
                                const newValue = (modifiedRow[policy.field] || 0) * (1 - reduction);
                                modifiedRow[policy.field] = newValue;
                                debugInfo.appliedPolicies.push({
                                    policy: policy.name,
                                    field: policy.field,
                                    original: originalValue,
                                    new: newValue,
                                    reduction: `${policy.value}%`
                                });
                            }
                        } else if (policy.type === 'set_value') {
                            if (policy.field && /^fee\d+$/.test(policy.field)) {
                                // Apply to regular fee
                                const quantity = modifiedRow.quantity || 1;
                                const newValue = (parseFloat(policy.value) || 0) * quantity;
                                modifiedRow[policy.field] = newValue;
                                debugInfo.appliedPolicies.push({
                                    policy: policy.name,
                                    field: policy.field,
                                    original: originalValue,
                                    new: newValue,
                                    action: 'set_value'
                                });
                            }
                        }
                    }
                });
                
                return modifiedRow;
            });
            
            // Calculate totals from modified rows (regular fees only)
            const totals = {
                total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                total_fee16: 0, total_fee17: 0
            };
            
            // Sum regular fees from modified rows
            modifiedRows.forEach(row => {
                for (let i = 1; i <= 17; i++) {
                    totals[`total_fee${i}`] += row[`fee${i}`] || 0;
                }
            });
            
            // Add the baseline computed fee totals (unchanged by policy application to regular fees)
            Object.keys(currentComputedFeeTotals).forEach(key => {
                totals[key] = currentComputedFeeTotals[key];
            });
            
            // Apply policy effects to computed fees (affects_direct and affects_inverse)
            let previousTotals = { ...baseline }; // Start with baseline
            
            policies.forEach(policy => {
                // Calculate what the regular fee totals would be after applying just this policy
                const currentPolicyIndex = policies.indexOf(policy);
                const policiesToApply = policies.slice(0, currentPolicyIndex + 1);
                
                // Recalculate regular fee totals for just the policies up to this point
                const tempModifiedRows = rows.map(row => {
                    const tempRow = { ...row };
                    
                    policiesToApply.forEach(tempPolicy => {
                        const conditionMatch = Object.entries(tempPolicy.condition || {}).every(([key, value]) => {
                            return !value || value === '' || row[key] === value;
                        });
                        
                        if (conditionMatch) {
                            if (tempPolicy.type === 'reduce_percentage') {
                                const reduction = tempPolicy.value / 100;
                                if (tempPolicy.field && /^fee\d+$/.test(tempPolicy.field)) {
                                    tempRow[tempPolicy.field] = (tempRow[tempPolicy.field] || 0) * (1 - reduction);
                                }
                            } else if (tempPolicy.type === 'set_value') {
                                if (tempPolicy.field && /^fee\d+$/.test(tempPolicy.field)) {
                                    const quantity = tempRow.quantity || 1;
                                    tempRow[tempPolicy.field] = (parseFloat(tempPolicy.value) || 0) * quantity;
                                }
                            }
                        }
                    });
                    
                    return tempRow;
                });
                
                // Calculate regular fee totals after applying policies up to this point
                const tempTotals = {
                    total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                    total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                    total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                    total_fee16: 0, total_fee17: 0
                };
                
                tempModifiedRows.forEach(row => {
                    for (let i = 1; i <= 17; i++) {
                        tempTotals[`total_fee${i}`] += row[`fee${i}`] || 0;
                    }
                });
                
                // Calculate the net effect of THIS specific policy on the target fee
                const targetFeeKey = `total_${policy.field}`;
                const previousValue = previousTotals[targetFeeKey] || 0;
                const currentValue = tempTotals[targetFeeKey] || 0;
                const netEffect = currentValue - previousValue;
                
                // Apply direct effects to computed fees
                const directFees = parseComputedFeeList(policy.affects_direct);
                directFees.forEach(feeField => {
                    const feeId = getComputedFeeId(feeField);
                    if (feeId && computedFees.find(cf => cf.id === feeId)) {
                        const totalKey = `total_${feeField}`;
                        if (totals.hasOwnProperty(totalKey)) {
                            totals[totalKey] += netEffect;
                        }
                    }
                });
                
                // Apply inverse effects to computed fees
                const inverseFees = parseComputedFeeList(policy.affects_inverse);
                inverseFees.forEach(feeField => {
                    const feeId = getComputedFeeId(feeField);
                    if (feeId && computedFees.find(cf => cf.id === feeId)) {
                        const totalKey = `total_${feeField}`;
                        if (totals.hasOwnProperty(totalKey)) {
                            totals[totalKey] -= netEffect;
                        }
                    }
                });
                
                // Update previousTotals for next iteration (regular fees only)
                previousTotals = { ...tempTotals };
            });
            
            resolve({
                baseline: false,
                policies: policies,
                row_count: modifiedRows.length,
                ...totals,
                filters: filters
            });
            
        }).catch(reject);
    });
}

function calculateScenarioByPID(db, policies = [], filters = {}) {
    return new Promise((resolve, reject) => {
        let whereClause = '1=1';
        const params = [];
        
        // Apply filters dynamically
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                whereClause += ` AND ${key} = ?`;
                params.push(value);
            }
        });
        
        // Get active computed fee rules and filtered data
        Promise.all([
            new Promise((resolve, reject) => {
                db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            new Promise((resolve, reject) => {
                db.all(`SELECT * FROM product_data WHERE ${whereClause}`, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            })
        ]).then(([computedFees, rows]) => {
            
            // Group rows by PID
            const rowsByPID = {};
            rows.forEach(row => {
                if (!rowsByPID[row.pid]) {
                    rowsByPID[row.pid] = [];
                }
                rowsByPID[row.pid].push(row);
            });
            
            const pidList = Object.keys(rowsByPID).sort();
            const resultsByPID = {};
            
            // Process each PID
            pidList.forEach(pid => {
                const pidRows = rowsByPID[pid];
                const pidResults = [];
                
                // Calculate baseline for this PID
                const baselineTotals = {
                    total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                    total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                    total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                    total_fee16: 0, total_fee17: 0
                };
                
                // Sum regular fees for this PID
                pidRows.forEach(row => {
                    for (let i = 1; i <= 17; i++) {
                        baselineTotals[`total_fee${i}`] += row[`fee${i}`] || 0;
                    }
                });
                
                // Calculate computed fees for this PID's baseline
                try {
                    calculateComputedFeesForRows(computedFees, pidRows, baselineTotals);
                } catch (error) {
                    reject(new Error(`Error calculating computed fees for PID ${pid}: ${error.message}`));
                    return;
                }
                
                const baseline = {
                    baseline: true,
                    pid: pid,
                    row_count: pidRows.length,
                    ...baselineTotals,
                    filters: filters
                };
                pidResults.push(baseline);
                
                // Apply policies cumulatively for this PID
                let previousTotals = { ...baselineTotals };
                
                for (let policyIndex = 0; policyIndex < policies.length; policyIndex++) {
                    const policiesToApply = policies.slice(0, policyIndex + 1);
                    
                    // Apply policies to this PID's rows
                    const modifiedRows = pidRows.map(row => {
                        const modifiedRow = { ...row };
                        
                        // Apply each policy cumulatively (but only to regular fees)
                        policiesToApply.forEach(policy => {
                            // Check if policy conditions match this row
                            const conditionMatch = Object.entries(policy.condition || {}).every(([key, value]) => {
                                const rowValue = row[key];
                                const matches = !value || value === '' || rowValue === value;
                                return matches;
                            });
                            
                            if (conditionMatch) {
                                if (policy.type === 'reduce_percentage') {
                                    const reduction = policy.value / 100;
                                    
                                    if (policy.field && /^fee\d+$/.test(policy.field)) {
                                        // Apply to regular fee
                                        const newValue = (modifiedRow[policy.field] || 0) * (1 - reduction);
                                        modifiedRow[policy.field] = newValue;
                                    }
                                } else if (policy.type === 'set_value') {
                                    if (policy.field && /^fee\d+$/.test(policy.field)) {
                                        // Apply to regular fee
                                        const quantity = modifiedRow.quantity || 1;
                                        const newValue = (parseFloat(policy.value) || 0) * quantity;
                                        modifiedRow[policy.field] = newValue;
                                    }
                                }
                            }
                        });
                        
                        return modifiedRow;
                    });
                    
                    // Calculate totals from modified rows (regular fees only)
                    const totals = {
                        total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                        total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                        total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                        total_fee16: 0, total_fee17: 0
                    };
                    
                    // Sum regular fees from modified rows
                    modifiedRows.forEach(row => {
                        for (let i = 1; i <= 17; i++) {
                            totals[`total_fee${i}`] += row[`fee${i}`] || 0;
                        }
                    });
                    
                    // Start with baseline computed fee totals for this PID
                    computedFees.forEach(fee => {
                        const field = `computed_fee${fee.id}`;
                        const totalKey = `total_${field}`;
                        totals[totalKey] = baselineTotals[totalKey] || 0;
                    });
                    
                    // Apply policy effects to computed fees for this PID
                    // This follows the same logic as the main calculateScenario function
                    let tempPreviousTotals = { ...baselineTotals };
                    
                    policiesToApply.forEach((policy, currentPolicyIndex) => {
                        // Calculate what the regular fee totals would be after applying just policies up to this point
                        const tempPoliciesToApply = policiesToApply.slice(0, currentPolicyIndex + 1);
                        
                        const tempModifiedRows = pidRows.map(row => {
                            const tempRow = { ...row };
                            
                            tempPoliciesToApply.forEach(tempPolicy => {
                                const conditionMatch = Object.entries(tempPolicy.condition || {}).every(([key, value]) => {
                                    return !value || value === '' || row[key] === value;
                                });
                                
                                if (conditionMatch) {
                                    if (tempPolicy.type === 'reduce_percentage') {
                                        const reduction = tempPolicy.value / 100;
                                        if (tempPolicy.field && /^fee\d+$/.test(tempPolicy.field)) {
                                            tempRow[tempPolicy.field] = (tempRow[tempPolicy.field] || 0) * (1 - reduction);
                                        }
                                    } else if (tempPolicy.type === 'set_value') {
                                        if (tempPolicy.field && /^fee\d+$/.test(tempPolicy.field)) {
                                            const quantity = tempRow.quantity || 1;
                                            tempRow[tempPolicy.field] = (parseFloat(tempPolicy.value) || 0) * quantity;
                                        }
                                    }
                                }
                            });
                            
                            return tempRow;
                        });
                        
                        // Calculate regular fee totals after applying policies up to this point
                        const tempTotals = {
                            total_fee1: 0, total_fee2: 0, total_fee3: 0, total_fee4: 0, total_fee5: 0,
                            total_fee6: 0, total_fee7: 0, total_fee8: 0, total_fee9: 0, total_fee10: 0,
                            total_fee11: 0, total_fee12: 0, total_fee13: 0, total_fee14: 0, total_fee15: 0,
                            total_fee16: 0, total_fee17: 0
                        };
                        
                        tempModifiedRows.forEach(row => {
                            for (let i = 1; i <= 17; i++) {
                                tempTotals[`total_fee${i}`] += row[`fee${i}`] || 0;
                            }
                        });
                        
                        // Calculate the net effect of THIS specific policy on the target fee
                        const targetFeeKey = `total_${policy.field}`;
                        const previousValue = tempPreviousTotals[targetFeeKey] || 0;
                        const currentValue = tempTotals[targetFeeKey] || 0;
                        const netEffect = currentValue - previousValue;
                        
                        // Apply direct effects to computed fees
                        const directFees = parseComputedFeeList(policy.affects_direct);
                        directFees.forEach(feeField => {
                            const feeId = getComputedFeeId(feeField);
                            if (feeId && computedFees.find(cf => cf.id === feeId)) {
                                const totalKey = `total_${feeField}`;
                                if (totals.hasOwnProperty(totalKey)) {
                                    totals[totalKey] += netEffect;
                                }
                            }
                        });
                        
                        // Apply inverse effects to computed fees
                        const inverseFees = parseComputedFeeList(policy.affects_inverse);
                        inverseFees.forEach(feeField => {
                            const feeId = getComputedFeeId(feeField);
                            if (feeId && computedFees.find(cf => cf.id === feeId)) {
                                const totalKey = `total_${feeField}`;
                                if (totals.hasOwnProperty(totalKey)) {
                                    totals[totalKey] -= netEffect;
                                }
                            }
                        });
                        
                        // Update previousTotals for next iteration (regular fees only)
                        tempPreviousTotals = { ...tempTotals };
                    });
                    
                    const result = {
                        baseline: false,
                        pid: pid,
                        policies: policiesToApply,
                        row_count: modifiedRows.length,
                        policyName: policies[policyIndex].name,
                        ...totals,
                        filters: filters
                    };
                    
                    pidResults.push(result);
                }
                
                resultsByPID[pid] = pidResults;
            });
            
            resolve({
                breakdown_by_pid: true,
                total_pids: pidList.length,
                pid_list: pidList,
                results_by_pid: resultsByPID,
                filters: filters
            });
            
        }).catch(reject);
    });
}

// Build filter where clause helper
function buildFilterWhereClause(filters) {
    let whereClause = '1=1';
    const params = [];
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
            whereClause += ` AND ${key} = ?`;
            params.push(value);
        }
    });
    
    return { whereClause, params };
}

// Build policy condition helper
function buildPolicyCondition(condition) {
    let conditionClause = '1=1';
    
    Object.entries(condition || {}).forEach(([key, value]) => {
        if (value && value !== '') {
            conditionClause += ` AND ${key} = '${value}'`;
        }
    });
    
    return conditionClause;
}

// Helper function to build WHERE clause and params from filters
function buildFilterClause(filters = {}) {
    let whereClause = '1=1';
    const params = [];
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
            whereClause += ` AND ${key} = ?`;
            params.push(value);
        }
    });
    
    return { whereClause, params };
}

// Helper function to apply a single policy to a single row
function applyPolicyToRow(row, policy) {
    // Check if policy conditions match this row
    const conditionMatch = Object.entries(policy.condition || {}).every(([key, value]) => {
        const rowValue = row[key];
        const matches = !value || value === '' || rowValue === value;
        return matches;
    });
    
    if (!conditionMatch) {
        return row; // No changes if conditions don't match
    }
    
    // Clone the row to avoid mutating the original
    const modifiedRow = { ...row };
    
    // Use scenario-specific value (policy.value now comes from scenario_policies.value)
    const policyValue = policy.value;
    
    if (policy.type === 'reduce_percentage') {
        const reduction = policyValue / 100;
        
        if (policy.field && /^fee\d+$/.test(policy.field)) {
            const newValue = (modifiedRow[policy.field] || 0) * (1 - reduction);
            modifiedRow[policy.field] = newValue;
        }
    } else if (policy.type === 'set_value') {
        if (policy.field && /^fee\d+$/.test(policy.field)) {
            const quantity = modifiedRow.quantity || 1;
            const newValue = (parseFloat(policyValue) || 0) * quantity;
            modifiedRow[policy.field] = newValue;
        }
    }
    
    return modifiedRow;
}

// Helper function to apply a policy to all rows
function applyPolicyToRows(rows, policy) {
    return rows.map(row => applyPolicyToRow(row, policy));
}

// Helper function to calculate totals from rows
function calculateRegularFeeTotals(rows) {
    const totals = {};
    
    // Initialize all fee totals to 0
    for (let i = 1; i <= 17; i++) {
        totals[`total_fee${i}`] = 0;
    }
    
    // Sum fees from all rows
    rows.forEach(row => {
        for (let i = 1; i <= 17; i++) {
            totals[`total_fee${i}`] += row[`fee${i}`] || 0;
        }
    });
    
    return totals;
}

// Helper function to initialize computed fee totals from baseline
function initializeComputedFeeTotals(baseline) {
    const computedTotals = {};
    
    for (let i = 1; i <= 30; i++) {
        const computedKey = `total_computed_fee${i}`;
        if (baseline.hasOwnProperty(computedKey)) {
            computedTotals[computedKey] = baseline[computedKey];
        }
    }
    
    return computedTotals;
}

// Helper function to apply policy effects to computed fees
function applyPolicyToComputedFees(computedTotals, policy, netEffect, computedFees) {
    const updatedTotals = { ...computedTotals };
    
    // Apply direct effects
    const directFees = parseComputedFeeList(policy.affects_direct);
    directFees.forEach(feeField => {
        const feeId = getComputedFeeId(feeField);
        if (feeId && computedFees.find(cf => cf.id === feeId)) {
            const totalKey = `total_${feeField}`;
            if (updatedTotals.hasOwnProperty(totalKey)) {
                updatedTotals[totalKey] += netEffect;
            }
        }
    });
    
    // Apply inverse effects
    const inverseFees = parseComputedFeeList(policy.affects_inverse);
    inverseFees.forEach(feeField => {
        const feeId = getComputedFeeId(feeField);
        if (feeId && computedFees.find(cf => cf.id === feeId)) {
            const totalKey = `total_${feeField}`;
            if (updatedTotals.hasOwnProperty(totalKey)) {
                updatedTotals[totalKey] -= netEffect;
            }
        }
    });
    
    return updatedTotals;
}

// Helper function to calculate the net effect of a policy
function calculatePolicyNetEffect(policy, currentTotals, previousTotals) {
    const targetFeeKey = `total_${policy.field}`;
    const previousValue = previousTotals[targetFeeKey] || 0;
    const currentValue = currentTotals[targetFeeKey] || 0;
    return currentValue - previousValue;
}

// Helper function to create a result object for a policy step
function createPolicyResult(policy, currentTotals, rowCount, filters) {
    return {
        baseline: false,
        row_count: rowCount,
        policyName: policy.name,
        policyData: policy,
        ...currentTotals,
        filters: filters
    };
}

function calculateScenarioBatch(db, policies = [], filters = {}) {
    return new Promise((resolve, reject) => {
        const { whereClause, params } = buildFilterClause(filters);
        
        // Get active computed fee rules and filtered data, plus cached baseline
        Promise.all([
            new Promise((resolve, reject) => {
                db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            new Promise((resolve, reject) => {
                db.all(`SELECT * FROM product_data WHERE ${whereClause}`, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            calculateBaselineWithCache(db, filters)
        ]).then(([computedFees, originalRows, cachedBaseline]) => {
            
            const results = [];
            
            // Step 1: Add baseline to results
            results.push(cachedBaseline);
            
            // Step 2: Process each policy cumulatively
            let currentRows = [...originalRows]; // Start with original data
            let previousTotals = { ...cachedBaseline }; // Track previous step totals
            
            for (let policyIndex = 0; policyIndex < policies.length; policyIndex++) {
                const currentPolicy = policies[policyIndex];
                
                // Apply this policy to current rows (cumulative)
                currentRows = applyPolicyToRows(currentRows, currentPolicy);
                
                // Calculate totals after applying this policy
                const regularFeeTotals = calculateRegularFeeTotals(currentRows);
                const computedFeeTotals = initializeComputedFeeTotals(previousTotals);
                const currentTotals = { ...regularFeeTotals, ...computedFeeTotals };
                
                // Calculate the net effect of this policy
                const netEffect = calculatePolicyNetEffect(currentPolicy, currentTotals, previousTotals);
                
                // Apply policy effects to computed fees
                const updatedComputedTotals = applyPolicyToComputedFees(
                    computedFeeTotals, 
                    currentPolicy, 
                    netEffect, 
                    computedFees
                );
                
                // Merge regular and computed totals
                const finalTotals = { ...regularFeeTotals, ...updatedComputedTotals };
                
                // Create result for this policy step
                const policyResult = createPolicyResult(
                    currentPolicy, 
                    finalTotals, 
                    currentRows.length, 
                    filters
                );
                
                results.push(policyResult);
                
                // Update previous totals for next iteration
                previousTotals = { ...finalTotals };
            }
            
            resolve({
                batch: true,
                scenario_steps: results.length,
                results: results,
                filters: filters
            });
            
        }).catch(reject);
    });
}

module.exports = {
    recalculateComputedFees,
    calculateBaseline,
    calculateScenario,
    calculateScenarioByPID,
    calculateScenarioByPIDBatch,
    calculateScenarioBatch,
    buildFilterWhereClause,
    buildPolicyCondition,
    getComputedFeeField,
    extractComputedFeeDependencies,
    detectCircularDependencies,
    sortComputedFeesByDependencies,
calculateBaselineWithCache,
getCachedComputedFeeTotalsForRows,
    getCachedComputedFeeTotals,
    getRawDataWithCachedComputedFees,
    refreshComputedFeeCache
};
