// Computed fee calculation and dependency management

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

function getComputedFeeField(computedFeeId) {
    return `computed_fee${computedFeeId}`;
}

function getComputedFeeId(fieldName) {
    const match = fieldName.match(/^computed_fee(\d+)$/);
    return match ? parseInt(match[1]) : null;
}

function parseComputedFeeList(listString) {
    if (!listString || !listString.trim()) return [];
    return listString.split(',').map(fee => fee.trim()).filter(fee => fee.length > 0);
}

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

module.exports = {
    evaluateBasicMath,
    getComputedFeeField,
    getComputedFeeId,
    parseComputedFeeList,
    extractComputedFeeDependencies,
    detectCircularDependencies,
    sortComputedFeesByDependencies,
    calculateComputedFeesForRows
};
