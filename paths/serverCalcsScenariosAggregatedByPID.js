// serverCalcsScenariosAggregatedByPID.js
// Aggregate-based scenario calculations grouped by PID for performance optimization

const { buildFilterClause } = require('./serverCalcsBaseline');
const { 
    getComputedFeeId, 
    parseComputedFeeList 
} = require('./serverCalcsComputedFees');

/**
 * Build SQL query to get aggregated totals by PID including cached computed fees
 */
function buildAggregateByPIDQuery(filterClause, params) {
    // Build column list for regular fees
    const regularFeeColumns = [];
    for (let i = 1; i <= 17; i++) {
        regularFeeColumns.push(`SUM(pd.fee${i}) as total_fee${i}`);
    }
    
    // Build column list for computed fees from cache
    const computedFeeColumns = [];
    for (let i = 1; i <= 30; i++) {
        computedFeeColumns.push(`SUM(cfc.computed_fee${i}) as total_computed_fee${i}`);
    }
    
    const sql = `
        SELECT 
            pd.pid,
            COUNT(*) as row_count,
            ${regularFeeColumns.join(',\n            ')},
            ${computedFeeColumns.join(',\n            ')}
        FROM product_data pd
        LEFT JOIN computed_fee_cache cfc ON pd.rowid = cfc.product_data_rowid
        WHERE ${filterClause}
        GROUP BY pd.pid
        ORDER BY pd.pid
    `;
    
    return { sql, params };
}

/**
 * Get sum of quantities by PID for rows matching policy conditions
 */
function getQuantitySumByPIDForPolicy(db, policy, baseFilterClause, baseParams) {
    return new Promise((resolve, reject) => {
        // Build policy condition clause
        let policyConditionClause = '1=1';
        const policyParams = [];
        
        Object.entries(policy.condition || {}).forEach(([key, value]) => {
            if (value && value !== '') {
                policyConditionClause += ` AND ${key} = ?`;
                policyParams.push(value);
            }
        });
        
        // Combine base filters with policy conditions
        const fullWhereClause = `(${baseFilterClause}) AND (${policyConditionClause})`;
        const fullParams = [...baseParams, ...policyParams];
        
        const sql = `
            SELECT pid, SUM(quantity) as total_quantity
            FROM product_data
            WHERE ${fullWhereClause}
            GROUP BY pid
        `;
        
        db.all(sql, fullParams, (err, rows) => {
            if (err) reject(err);
            else {
                // Convert to map for easy lookup
                const quantityMap = {};
                rows.forEach(row => {
                    quantityMap[row.pid] = row.total_quantity || 0;
                });
                resolve(quantityMap);
            }
        });
    });
}

/**
 * Get the current total for a specific fee by PID for rows matching policy conditions
 */
function getMatchingFeeTotalByPID(db, policy, feeField, baseFilterClause, baseParams) {
    return new Promise((resolve, reject) => {
        // Build policy condition clause
        let policyConditionClause = '1=1';
        const policyParams = [];
        
        Object.entries(policy.condition || {}).forEach(([key, value]) => {
            if (value && value !== '') {
                policyConditionClause += ` AND ${key} = ?`;
                policyParams.push(value);
            }
        });
        
        // Combine base filters with policy conditions
        const fullWhereClause = `(${baseFilterClause}) AND (${policyConditionClause})`;
        const fullParams = [...baseParams, ...policyParams];
        
        const sql = `
            SELECT pid, SUM(${feeField}) as total
            FROM product_data
            WHERE ${fullWhereClause}
            GROUP BY pid
        `;
        
        db.all(sql, fullParams, (err, rows) => {
            if (err) reject(err);
            else {
                // Convert to map for easy lookup
                const totalMap = {};
                rows.forEach(row => {
                    totalMap[row.pid] = row.total || 0;
                });
                resolve(totalMap);
            }
        });
    });
}

/**
 * Apply a single policy to aggregate totals for a specific PID
 */
async function applyPolicyToAggregatesForPID(db, policy, pidTotals, quantityMapByPID, matchingTotalMapByPID) {
    const modifiedTotals = { ...pidTotals };
    
    if (!policy.field || !/^fee\d+$/.test(policy.field)) {
        return modifiedTotals; // Only handle regular fees
    }
    
    const targetFeeKey = `total_${policy.field}`;
    const pid = pidTotals.pid;
    
    if (policy.type === 'reduce_percentage') {
        const reduction = policy.value / 100;
        
        // Check if policy has conditions
        const hasConditions = Object.entries(policy.condition || {}).some(([key, value]) => value && value !== '');
        
        if (hasConditions) {
            // Get the total for rows that match conditions for this PID
            const matchingTotal = matchingTotalMapByPID[pid] || 0;
            const nonMatchingTotal = (pidTotals[targetFeeKey] || 0) - matchingTotal;
            
            // Apply reduction only to matching portion
            const reducedMatchingTotal = matchingTotal * (1 - reduction);
            modifiedTotals[targetFeeKey] = reducedMatchingTotal + nonMatchingTotal;
        } else {
            // Apply reduction to entire total for this PID
            modifiedTotals[targetFeeKey] = (pidTotals[targetFeeKey] || 0) * (1 - reduction);
        }
        
    } else if (policy.type === 'set_value') {
        // Get sum of quantities for this PID
        const totalQuantity = quantityMapByPID[pid] || 0;
        
        // Calculate new value
        const newValue = (parseFloat(policy.value) || 0) * totalQuantity;
        
        // Check if policy has conditions
        const hasConditions = Object.entries(policy.condition || {}).some(([key, value]) => value && value !== '');
        
        if (hasConditions) {
            // Get the current total for matching rows for this PID
            const matchingTotal = matchingTotalMapByPID[pid] || 0;
            const nonMatchingTotal = (pidTotals[targetFeeKey] || 0) - matchingTotal;
            modifiedTotals[targetFeeKey] = nonMatchingTotal + newValue;
        } else {
            // Replace entire total for this PID
            modifiedTotals[targetFeeKey] = newValue;
        }
    }
    
    return modifiedTotals;
}

/**
 * Apply policy effects to computed fees for a specific PID
 */
function applyPolicyEffectsToComputedFeesForPID(computedFees, policy, netEffect, totals) {
    const updatedTotals = { ...totals };
    
    // Apply direct effects
    const directFees = parseComputedFeeList(policy.affects_direct);
    directFees.forEach(feeField => {
        const feeId = getComputedFeeId(feeField);
        if (feeId && computedFees.find(cf => cf.id === feeId)) {
            const totalKey = `total_${feeField}`;
            if (updatedTotals.hasOwnProperty(totalKey)) {
                updatedTotals[totalKey] = (updatedTotals[totalKey] || 0) + netEffect;
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
                updatedTotals[totalKey] = (updatedTotals[totalKey] || 0) - netEffect;
            }
        }
    });
    
    return updatedTotals;
}

/**
 * Main aggregated scenario calculation function grouped by PID
 */
async function calculateScenarioAggregatedByPID(db, policies = [], filters = {}) {
    try {
        // Build filter clause
        const { whereClause, params } = buildFilterClause(filters);
        
        // Get active computed fees
        const computedFees = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get baseline aggregates grouped by PID
        const { sql: baselineQuery, params: baselineParams } = buildAggregateByPIDQuery(whereClause, params);
        const baselinesByPID = await new Promise((resolve, reject) => {
            db.all(baselineQuery, baselineParams, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Convert to map for easier access
        const pidMap = {};
        baselinesByPID.forEach(row => {
            pidMap[row.pid] = row;
        });
        
        const pidList = Object.keys(pidMap).sort();
        
        // PRE-FETCH: Get all policy-specific data in parallel BEFORE the PID loop
        console.log(`Pre-fetching data for ${policies.length} policies...`);
        const policyDataPromises = policies.map(policy => {
            const hasConditions = Object.entries(policy.condition || {}).some(([key, value]) => value && value !== '');
            
            const promises = [];
            
            // Always get quantities for set_value policies
            if (policy.type === 'set_value') {
                promises.push(getQuantitySumByPIDForPolicy(db, policy, whereClause, params));
            } else {
                promises.push(Promise.resolve({}));
            }
            
            // Get matching totals for conditional policies
            if (hasConditions) {
                promises.push(getMatchingFeeTotalByPID(db, policy, policy.field, whereClause, params));
            } else {
                promises.push(Promise.resolve({}));
            }
            
            return Promise.all(promises);
        });
        
        const allPolicyData = await Promise.all(policyDataPromises);
        console.log(`Policy data pre-fetch complete. Processing ${pidList.length} PIDs...`);
        
        const resultsByPID = {};
        
        // Process each PID with pre-fetched data
        for (const pid of pidList) {
            const pidResults = [];
            const baselineTotals = pidMap[pid];
            
            // Add baseline for this PID
            pidResults.push({
                baseline: true,
                pid: pid,
                row_count: baselineTotals.row_count,
                ...baselineTotals,
                filters: filters
            });
            
            // Apply policies cumulatively for this PID using pre-fetched data
            let previousTotals = { ...baselineTotals };
            
            for (let i = 0; i < policies.length; i++) {
                const policy = policies[i];
                const [quantityMapByPID, matchingTotalMapByPID] = allPolicyData[i];
                
                // Apply policy to this PID's aggregates (now synchronous - no DB queries)
                const currentTotals = await applyPolicyToAggregatesForPID(
                    db, 
                    policy, 
                    previousTotals,
                    quantityMapByPID,
                    matchingTotalMapByPID
                );
                
                // Calculate net effect on target fee for this PID
                const targetFeeKey = `total_${policy.field}`;
                const netEffect = (currentTotals[targetFeeKey] || 0) - (previousTotals[targetFeeKey] || 0);
                
                // Apply effects to computed fees for this PID
                const finalTotals = applyPolicyEffectsToComputedFeesForPID(
                    computedFees,
                    policy,
                    netEffect,
                    currentTotals
                );
                
                // Add result for this policy step
                pidResults.push({
                    baseline: false,
                    pid: pid,
                    policies: policies.slice(0, i + 1),
                    row_count: baselineTotals.row_count,
                    policyName: policy.name,
                    policyData: policy,
                    ...finalTotals,
                    filters: filters
                });
                
                previousTotals = { ...finalTotals };
            }
            
            resultsByPID[pid] = pidResults;
        }
        
        console.log(`PID processing complete`);
        
        return {
            breakdown_by_pid: true,
            batch: true,
            aggregated: true,
            total_pids: pidList.length,
            pid_list: pidList,
            results_by_pid: resultsByPID,
            filters: filters
        };
        
    } catch (error) {
        throw new Error(`Aggregated PID calculation error: ${error.message}`);
    }
}

module.exports = {
    buildAggregateByPIDQuery,
    getQuantitySumByPIDForPolicy,
    getMatchingFeeTotalByPID,
    applyPolicyToAggregatesForPID,
    applyPolicyEffectsToComputedFeesForPID,
    calculateScenarioAggregatedByPID
};
