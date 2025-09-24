// Baseline calculation functions

async function recalculateComputedFees() {
    return Promise.resolve();
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

// Legacy function - uses non-cached computed fee calculation
function calculateBaseline(db, filters = {}) {
    const { calculateComputedFeesForRows } = require('./serverCalcsComputedFees');
    
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

module.exports = {
    recalculateComputedFees,
    calculateBaseline,
    calculateBaselineWithCache,
    getCachedComputedFeeTotals,
    getCachedComputedFeeTotalsForRows,
    getRawDataWithCachedComputedFees,
    refreshComputedFeeCache,
    buildFilterClause
};
