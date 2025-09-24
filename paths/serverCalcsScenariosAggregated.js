// serverCalcsScenariosAggregated.js
// Aggregate-based scenario calculations for performance optimization

const { buildFilterClause } = require('./serverCalcsBaseline');
const { 
    getComputedFeeId, 
    parseComputedFeeList 
} = require('./serverCalcsComputedFees');

/**
 * Build SQL query to get aggregated totals including cached computed fees
 */
function buildAggregateQuery(filterClause, params) {
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
            COUNT(*) as row_count,
            ${regularFeeColumns.join(',\n            ')},
            ${computedFeeColumns.join(',\n            ')}
        FROM product_data pd
        LEFT JOIN computed_fee_cache cfc ON pd.rowid = cfc.product_data_rowid
        WHERE ${filterClause}
    `;
    
    return { sql, params };
}

/**
 * Get sum of quantities for rows matching policy conditions
 */
function getQuantitySumForPolicy(db, policy, baseFilterClause, baseParams) {
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
            SELECT SUM(quantity) as total_quantity
            FROM product_data
            WHERE ${fullWhereClause}
        `;
        
        db.get(sql, fullParams, (err, row) => {
            if (err) reject(err);
            else resolve(row?.total_quantity || 0);
        });
    });
}

/**
 * Apply a single policy to aggregate totals
 */
async function applyPolicyToAggregates(db, policy, currentTotals, baseFilterClause, baseParams) {
    const modifiedTotals = { ...currentTotals };
    
    if (!policy.field || !/^fee\d+$/.test(policy.field)) {
        return modifiedTotals; // Only handle regular fees
    }
    
    const targetFeeKey = `total_${policy.field}`;
    
    if (policy.type === 'reduce_percentage') {
        const reduction = policy.value / 100;
        
        // Check if policy has conditions - need to split the calculation
        const hasConditions = Object.entries(policy.condition || {}).some(([key, value]) => value && value !== '');
        
        if (hasConditions) {
            // Get the total for rows that match conditions
            const matchingTotal = await getMatchingFeeTotal(db, policy, policy.field, baseFilterClause, baseParams);
            const nonMatchingTotal = (currentTotals[targetFeeKey] || 0) - matchingTotal;
            
            // Apply reduction only to matching portion
            const reducedMatchingTotal = matchingTotal * (1 - reduction);
            modifiedTotals[targetFeeKey] = reducedMatchingTotal + nonMatchingTotal;
        } else {
            // Apply reduction to entire total
            modifiedTotals[targetFeeKey] = (currentTotals[targetFeeKey] || 0) * (1 - reduction);
        }
        
    } else if (policy.type === 'set_value') {
        const hasConditions = Object.entries(policy.condition || {}).some(([key, value]) => value && value !== '');
        
        if (hasConditions) {
            // Get the total quantity for matching rows only
            const matchingQuantity = await getQuantitySumForPolicy(db, policy, baseFilterClause, baseParams);
            
            // Calculate new value for matching rows only
            const newValueForMatching = (parseFloat(policy.value) || 0) * matchingQuantity;
            
            // Get the current total for matching rows and subtract it
            const currentMatchingTotal = await getMatchingFeeTotal(db, policy, policy.field, baseFilterClause, baseParams);
            const nonMatchingTotal = (currentTotals[targetFeeKey] || 0) - currentMatchingTotal;
            
            // Set final total = non-matching portion + new value for matching portion
            modifiedTotals[targetFeeKey] = nonMatchingTotal + newValueForMatching;
        } else {
            // Apply to all rows - get total quantity for all rows matching base filters
            const totalQuantity = await getTotalQuantityForFilters(db, baseFilterClause, baseParams);
            
            // Calculate new total value
            const newTotalValue = (parseFloat(policy.value) || 0) * totalQuantity;
            
            // Replace entire total
            modifiedTotals[targetFeeKey] = newTotalValue;
        }
    }
    
    return modifiedTotals;
}

/**
 * Get sum of quantities for all rows matching base filters (no policy conditions)
 */
function getTotalQuantityForFilters(db, filterClause, params) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT SUM(quantity) as total_quantity
            FROM product_data
            WHERE ${filterClause}
        `;
        
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row?.total_quantity || 0);
        });
    });
}

/**
 * Get the current total for a specific fee for rows matching policy conditions
 */
function getMatchingFeeTotal(db, policy, feeField, baseFilterClause, baseParams) {
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
            SELECT SUM(${feeField}) as total
            FROM product_data
            WHERE ${fullWhereClause}
        `;
        
        db.get(sql, fullParams, (err, row) => {
            if (err) reject(err);
            else resolve(row?.total || 0);
        });
    });
}

/**
 * Apply policy effects to computed fees
 */
function applyPolicyEffectsToComputedFees(computedFees, policy, netEffect, totals) {
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
 * Main aggregated scenario calculation function
 */
async function calculateScenarioAggregated(db, policies = [], filters = {}) {
    try {
        // Build filter clause
        const { whereClause, params } = buildFilterClause(filters);
console.log('=== FILTERS RECEIVED ===', JSON.stringify(filters, null, 2));
console.log('=== WHERE CLAUSE ===', whereClause);
console.log('=== PARAMS ===', params);
        
        // Get active computed fees
        const computedFees = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // Get baseline aggregates
        const { sql: baselineQuery, params: baselineParams } = buildAggregateQuery(whereClause, params);
        const baselineTotals = await new Promise((resolve, reject) => {
            db.get(baselineQuery, baselineParams, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Initialize results with baseline
        const results = [{
            baseline: true,
            row_count: baselineTotals.row_count,
            ...baselineTotals,
            filters: filters
        }];
        
        // Apply policies cumulatively
        let previousTotals = { ...baselineTotals };
        
        for (let i = 0; i < policies.length; i++) {
            const policy = policies[i];
            
            // Apply policy to aggregates
            const currentTotals = await applyPolicyToAggregates(
                db, 
                policy, 
                previousTotals, 
                whereClause, 
                params
            );
            
            // Calculate net effect on target fee
            const targetFeeKey = `total_${policy.field}`;
            const netEffect = (currentTotals[targetFeeKey] || 0) - (previousTotals[targetFeeKey] || 0);
            
            // Apply effects to computed fees
            const finalTotals = applyPolicyEffectsToComputedFees(
                computedFees,
                policy,
                netEffect,
                currentTotals
            );
            
            // Add result for this policy step
            results.push({
                baseline: false,
                row_count: baselineTotals.row_count,
                policyName: policy.name,
                policyData: policy,
                ...finalTotals,
                filters: filters
            });
            
            previousTotals = { ...finalTotals };
        }
        
        return {
            batch: true,
            aggregated: true,
            scenario_steps: results.length,
            results: results,
            filters: filters
        };
        
    } catch (error) {
        throw new Error(`Aggregated calculation error: ${error.message}`);
    }
}

module.exports = {
    buildAggregateQuery,
    getQuantitySumForPolicy,
    applyPolicyToAggregates,
    applyPolicyEffectsToComputedFees,
    calculateScenarioAggregated
};
