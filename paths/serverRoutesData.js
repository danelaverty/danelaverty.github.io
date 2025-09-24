const express = require('express');
const router = express.Router();

const { getCachedComputedFeeTotals } = require('./serverCalcsBaseline');

// Simple math expression evaluator (safe for basic operations)
function evaluateBasicMath(expression) {
    // Remove spaces and validate the expression contains only safe characters
    const cleanExpr = expression.replace(/\s/g, '');
    const safePattern = /^[0-9+\-*/.() ]+$/;
    
    if (!safePattern.test(cleanExpr)) {
        throw new Error('Invalid characters in formula');
    }
    
    // Use Function constructor for safe evaluation (only basic math)
    try {
        return Function('"use strict"; return (' + cleanExpr + ')')();
    } catch (error) {
        throw new Error('Invalid formula: ' + error.message);
    }
}

// Get data statistics
router.get('/stats', async (req, res) => {
    const db = req.app.locals.db;
    
    try {
        // Get basic stats and regular fee totals
        const [basicStats, regularFeeTotals, cachedComputedTotals] = await Promise.all([
            // Basic row counts
            new Promise((resolve, reject) => {
                db.all(`
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT(DISTINCT type) as unique_types
                    FROM product_data
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0]);
                });
            }),
            
            // Regular fee totals
            new Promise((resolve, reject) => {
                db.get(`
                    SELECT 
                        SUM(fee1) as total_fee1, SUM(fee2) as total_fee2, SUM(fee3) as total_fee3,
                        SUM(fee4) as total_fee4, SUM(fee5) as total_fee5, SUM(fee6) as total_fee6,
                        SUM(fee7) as total_fee7, SUM(fee8) as total_fee8, SUM(fee9) as total_fee9,
                        SUM(fee10) as total_fee10, SUM(fee11) as total_fee11, SUM(fee12) as total_fee12,
                        SUM(fee13) as total_fee13, SUM(fee14) as total_fee14, SUM(fee15) as total_fee15,
                        SUM(fee16) as total_fee16, SUM(fee17) as total_fee17
                    FROM product_data
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            }),
            
            // Cached computed fee totals - this is the key change!
            getCachedComputedFeeTotals(db)
        ]);

        // Build response object
        res.json({
            totalRows: basicStats.total_rows,
            uniqueTypes: basicStats.unique_types,
            baseline: {
                // Regular fees
                totalFee1: regularFeeTotals.total_fee1 || 0,
                totalFee2: regularFeeTotals.total_fee2 || 0,
                totalFee3: regularFeeTotals.total_fee3 || 0,
                totalFee4: regularFeeTotals.total_fee4 || 0,
                totalFee5: regularFeeTotals.total_fee5 || 0,
                totalFee6: regularFeeTotals.total_fee6 || 0,
                totalFee7: regularFeeTotals.total_fee7 || 0,
                totalFee8: regularFeeTotals.total_fee8 || 0,
                totalFee9: regularFeeTotals.total_fee9 || 0,
                totalFee10: regularFeeTotals.total_fee10 || 0,
                totalFee11: regularFeeTotals.total_fee11 || 0,
                totalFee12: regularFeeTotals.total_fee12 || 0,
                totalFee13: regularFeeTotals.total_fee13 || 0,
                totalFee14: regularFeeTotals.total_fee14 || 0,
                totalFee15: regularFeeTotals.total_fee15 || 0,
                totalFee16: regularFeeTotals.total_fee16 || 0,
                totalFee17: regularFeeTotals.total_fee17 || 0,
                // Cached computed fees
                ...cachedComputedTotals
            }
        });

    } catch (error) {
        console.error('Error in /stats endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to get statistics',
            details: error.message 
        });
    }
});

// Get raw data with filters
router.post('/raw', (req, res) => {
    const db = req.app.locals.db;
    const { filters = {} } = req.body;
    let whereClause = '1=1';
    const params = [];
    
    // Apply filters dynamically
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
            whereClause += ` AND pd.${key} = ?`; // Note: prefixed with 'pd.' for the JOIN
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
            console.error('Error in /raw endpoint:', err);
            res.status(500).json({ 
                error: 'Failed to fetch raw data',
                details: err.message 
            });
        } else {
            res.json({
                rows: rows,
                count: rows.length,
                filters: filters
            });
        }
    });
});

// Get unique filter values for dropdowns
router.get('/filters/values', (req, res) => {
    const db = req.app.locals.db;
    
    const queries = {
        attr1: "SELECT DISTINCT attr1 FROM product_data WHERE attr1 IS NOT NULL ORDER BY attr1",
        attr2: "SELECT DISTINCT attr2 FROM product_data WHERE attr2 IS NOT NULL ORDER BY attr2", 
        attr3: "SELECT DISTINCT attr3 FROM product_data WHERE attr3 IS NOT NULL ORDER BY attr3",
        attr4: "SELECT DISTINCT attr4 FROM product_data WHERE attr4 IS NOT NULL ORDER BY attr4",
        type: "SELECT DISTINCT type FROM product_data WHERE type IS NOT NULL ORDER BY type",
        subtype: "SELECT DISTINCT subtype FROM product_data WHERE subtype IS NOT NULL ORDER BY subtype",
        attr5: "SELECT DISTINCT attr5 FROM product_data WHERE attr5 IS NOT NULL ORDER BY attr5"
    };
    
    const results = {};
    const queryPromises = Object.entries(queries).map(([key, query]) => {
        return new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else {
                    results[key] = rows.map(row => row[key]);
                    resolve();
                }
            });
        });
    });
    
    Promise.all(queryPromises)
        .then(() => res.json(results))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Debug endpoint
router.get('/stats/debug', (req, res) => {
    const db = req.app.locals.db;
    
    // Get computed fees first
    db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, computedFees) => {
        if (err) {
            console.error('Error fetching computed fees:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Get a sample of product data
        db.all("SELECT * FROM product_data LIMIT 5", (err, sampleRows) => {
            if (err) {
                console.error('Error fetching sample data:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Test formula evaluation on first row
            if (sampleRows.length > 0 && computedFees.length > 0) {
                const testRow = sampleRows[0];
                const testFee = computedFees[0];
                
                try {
                    let formula = testFee.formula;
                    
                    // Replace field names with actual values
                    formula = formula.replace(/fee(\d+)/g, (match, num) => {
                        const value = testRow[`fee${num}`] || 0;
                        return value;
                    });
                    formula = formula.replace(/quantity/g, testRow.quantity || 0);
                    formula = formula.replace(/pid/g, testRow.pid || 0);
                    
                    const result = Function('"use strict"; return (' + formula + ')')();
                    
                } catch (error) {
                    console.error('Formula evaluation error:', error);
                }
            }
            
            res.json({
                debug: true,
                computedFeesCount: computedFees.length,
                sampleDataCount: sampleRows.length,
                computedFees: computedFees,
                sampleRows: sampleRows.slice(0, 2) // Just first 2 rows for brevity
            });
        });
    });
});

module.exports = router;
