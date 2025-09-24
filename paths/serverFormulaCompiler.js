// serverFormulaCompiler.js - Compiled formula evaluation system

class FormulaCompiler {
    constructor() {
        this.compiledFormulas = new Map(); // Cache of compiled formulas
        this.dependencyGraph = new Map(); // Track dependencies between computed fees
    }

    // Parse a formula and extract field references
    parseFormula(formula) {
        const tokens = {
            regularFees: new Set(),
            computedFees: new Set(),
            literals: ['quantity', 'pid']
        };

        // Extract regular fee references (fee1, fee2, etc.)
        const feeMatches = formula.match(/\bfee(\d+)\b/g);
        if (feeMatches) {
            feeMatches.forEach(match => {
                tokens.regularFees.add(match);
            });
        }

        // Extract computed fee references (computed_fee1, computed_fee2, etc.)
        const computedMatches = formula.match(/computed_fee(\d+)/g);
        if (computedMatches) {
            computedMatches.forEach(match => {
                tokens.computedFees.add(match);
            });
        }

        return tokens;
    }

    // Compile a formula into an optimized function
    compileFormula(feeId, formula) {
        try {
            const tokens = this.parseFormula(formula);
            
            // Track dependencies for this computed fee
            const dependencies = Array.from(tokens.computedFees).map(cf => {
                const match = cf.match(/computed_fee(\d+)/);
                return match ? parseInt(match[1]) : null;
            }).filter(id => id !== null);
            
            this.dependencyGraph.set(feeId, dependencies);

            // Generate the optimized function code
            let functionCode = formula;

            // Replace regular fee references with direct row property access
            tokens.regularFees.forEach(feeRef => {
                const regex = new RegExp(`\\b${feeRef}\\b`, 'g');
                functionCode = functionCode.replace(regex, `(row.${feeRef} || 0)`);
            });

            // Replace literal references
            functionCode = functionCode.replace(/\bquantity\b/g, '(row.quantity || 0)');
            functionCode = functionCode.replace(/\bpid\b/g, '(row.pid || 0)');

            // Replace computed fee references with parameter access
            tokens.computedFees.forEach(computedRef => {
                const regex = new RegExp(`\\b${computedRef}\\b`, 'g');
                functionCode = functionCode.replace(regex, `(computedValues.${computedRef} || 0)`);
            });

            // Validate the final code contains only safe characters
            const safePattern = /^[0-9+\-*/.() |&<>=!rowcomputedValuesquantitypid\[\]]+$/;
            if (!safePattern.test(functionCode.replace(/\s/g, ''))) {
                throw new Error('Formula contains unsafe characters after compilation');
            }

            // Create the compiled function
            const compiledFunction = new Function('row', 'computedValues', `
                "use strict";
                try {
                    const result = (${functionCode});
                    return isNaN(result) ? 0 : result;
                } catch (error) {
                    console.error('Runtime formula error for fee ${feeId}:', error);
                    return 0;
                }
            `);

            // Cache the compiled function with metadata
            this.compiledFormulas.set(feeId, {
                compiledFunction,
                dependencies,
                originalFormula: formula,
                compiledCode: functionCode
            });

            return compiledFunction;

        } catch (error) {
            console.error(`Error compiling formula for fee ${feeId}:`, error);
            // Return a fallback function that always returns 0
            const fallbackFunction = () => 0;
            this.compiledFormulas.set(feeId, {
                compiledFunction: fallbackFunction,
                dependencies: [],
                originalFormula: formula,
                error: error.message
            });
            return fallbackFunction;
        }
    }

    // Get or compile a formula function
    getCompiledFormula(feeId, formula) {
        const cached = this.compiledFormulas.get(feeId);
        
        // Return cached version if formula hasn't changed
        if (cached && cached.originalFormula === formula) {
            return cached.compiledFunction;
        }

        // Compile new or changed formula
        return this.compileFormula(feeId, formula);
    }

    // Get dependency-sorted order for computed fees
    getSortedComputedFees(computedFees) {
        // Update dependency graph for all fees
        computedFees.forEach(fee => {
            if (fee.formula) {
                this.parseFormula(fee.formula); // This updates the dependency graph
            }
        });

        // Topological sort
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (feeId) => {
            if (visiting.has(feeId)) {
                throw new Error(`Circular dependency detected involving computed fee ${feeId}`);
            }
            if (visited.has(feeId)) {
                return;
            }

            visiting.add(feeId);
            
            const dependencies = this.dependencyGraph.get(feeId) || [];
            dependencies.forEach(depId => {
                if (computedFees.some(cf => cf.id === depId)) {
                    visit(depId);
                }
            });

            visiting.delete(feeId);
            visited.add(feeId);

            const fee = computedFees.find(cf => cf.id === feeId);
            if (fee && !sorted.some(sf => sf.id === feeId)) {
                sorted.push(fee);
            }
        };

        // Sort by priority first, then by dependencies
        const feesByPriority = [...computedFees].sort((a, b) => (a.priority || 0) - (b.priority || 0));
        
        feesByPriority.forEach(fee => {
            visit(fee.id);
        });

        return sorted;
    }

    // Clear cache (call when computed fees change)
    clearCache() {
        this.compiledFormulas.clear();
        this.dependencyGraph.clear();
    }

    // Get compilation statistics
    getStats() {
        const stats = {
            totalCompiled: this.compiledFormulas.size,
            withErrors: 0,
            dependencies: {}
        };

        this.compiledFormulas.forEach((compiled, feeId) => {
            if (compiled.error) {
                stats.withErrors++;
            }
            stats.dependencies[feeId] = compiled.dependencies || [];
        });

        return stats;
    }
}

// Singleton instance
const formulaCompiler = new FormulaCompiler();

// Enhanced computed fee calculation using compiled formulas
function calculateComputedFeesCompiled(computedFees, rows, calculatedValues = {}) {
    if (!computedFees || computedFees.length === 0) {
        return calculatedValues;
    }

    try {
        // Get dependency-sorted computed fees
        const sortedFees = formulaCompiler.getSortedComputedFees(computedFees);
        
        // Initialize totals for all computed fees
        sortedFees.forEach(fee => {
            const field = `computed_fee${fee.id}`;
            const totalKey = `total_${field}`;
            if (!calculatedValues.hasOwnProperty(totalKey)) {
                calculatedValues[totalKey] = 0;
            }
        });

        // Process each row
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
                        // Get or compile the formula function
                        const compiledFunction = formulaCompiler.getCompiledFormula(feeRule.id, feeRule.formula);
                        
                        // Execute the compiled function
                        const result = compiledFunction(row, rowComputedValues);
                        
                        if (!isNaN(result)) {
                            const fieldName = `computed_fee${feeRule.id}`;
                            const totalKey = `total_${fieldName}`;
                            
                            // Store the result for this row
                            rowComputedValues[fieldName] = result;
                            
                            // Add to the total
                            calculatedValues[totalKey] += result;
                        }
                    } catch (error) {
                        console.error(`Error executing compiled formula for fee ${feeRule.id}:`, error);
                    }
                } else {
                    // If condition doesn't match, still store 0 for this row
                    const fieldName = `computed_fee${feeRule.id}`;
                    rowComputedValues[fieldName] = 0;
                }
            });
        });

        return calculatedValues;

    } catch (error) {
        console.error('Error in compiled computed fee calculation:', error);
        // Fallback to original calculation method
        const { calculateComputedFeesForRows } = require('./serverCalcsComputedFees');
        return calculateComputedFeesForRows(computedFees, rows, calculatedValues);
    }
}

module.exports = {
    FormulaCompiler,
    formulaCompiler,
    calculateComputedFeesCompiled
};
