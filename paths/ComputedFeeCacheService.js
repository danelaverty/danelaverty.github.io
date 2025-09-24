const { extractComputedFeeDependencies, sortComputedFeesByDependencies } = require('./serverCalcsComputedFees');

class ComputedFeeCacheService {
    constructor(db) {
        this.db = db;
        this.maxComputedFeeId = 30; // Match the schema
        this.batchSize = 1000; // Process in batches for performance
    }

    /**
     * Initialize the cache table if it doesn't exist
     */
    async initializeCacheTable() {
        // The table creation is handled in serverDatabase.js
        // This method can be used for any additional setup if needed
        console.log('Computed fee cache table initialized');
    }

    /**
     * Get the current cache version
     */
    async getCacheVersion() {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT MAX(cache_version) as version FROM computed_fee_cache", (err, row) => {
                if (err) reject(err);
                else resolve(row?.version || 0);
            });
        });
    }

    /**
     * Increment cache version (used when computed fee rules change)
     */
    async incrementCacheVersion() {
        const currentVersion = await this.getCacheVersion();
        const newVersion = currentVersion + 1;
        
        return new Promise((resolve, reject) => {
            this.db.run("UPDATE computed_fee_cache SET cache_version = ?", [newVersion], (err) => {
                if (err) reject(err);
                else resolve(newVersion);
            });
        });
    }

    /**
     * Get active computed fees from database
     */
    async getActiveComputedFees() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM computed_fees WHERE active = 1 ORDER BY priority ASC", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Refresh the entire cache
     */
    async refreshFullCache() {
        console.log('Starting full computed fee cache refresh...');
        const startTime = Date.now();

        try {
            await this.clearCache();

            const computedFees = await this.getActiveComputedFees();
            console.log(`Found ${computedFees.length} active computed fees`);

            if (computedFees.length === 0) {
                console.log('No active computed fees - clearing cache');
                await this.clearCache();
                return;
            }

            // Get total row count for progress tracking
            const totalRows = await this.getProductDataRowCount();
            console.log(`Processing ${totalRows} product data rows`);

            // Process in batches
            let processedRows = 0;
            let offset = 0;

            while (offset < totalRows) {
                const batch = await this.getProductDataBatch(offset, this.batchSize);
                
                if (batch.length === 0) break;

                await this.processBatch(batch, computedFees);
                
                processedRows += batch.length;
                offset += this.batchSize;

                // Log progress every 10k rows
                if (processedRows % 10000 === 0 || processedRows === totalRows) {
                    console.log(`Processed ${processedRows}/${totalRows} rows (${Math.round(processedRows/totalRows*100)}%)`);

                     const cacheCount = await new Promise((resolve, reject) => {
                         this.db.get("SELECT COUNT(*) as count FROM computed_fee_cache", (err, row) => {
                             if (err) reject(err);
                             else resolve(row.count);
                         });
                     });
                    console.log(`Cache entries: ${cacheCount}/${totalRows} (${Math.round(cacheCount/totalRows*100)}%)`);
                }
            }

            // Update cache version
            await this.incrementCacheVersion();

            const duration = Date.now() - startTime;
            console.log(`Cache refresh complete in ${duration}ms (${Math.round(duration/1000)}s)`);

        } catch (error) {
            console.error('Error during cache refresh:', error);
            throw error;
        }
    }

    /**
     * Refresh cache for specific rows (for incremental updates)
     */
    async refreshCacheForRows(rowIds) {
        if (!Array.isArray(rowIds) || rowIds.length === 0) return;

        console.log(`Refreshing cache for ${rowIds.length} specific rows`);

        const computedFees = await this.getActiveComputedFees();
        if (computedFees.length === 0) {
            // If no computed fees, just clear cache entries for these rows
            await this.clearCacheForRows(rowIds);
            return;
        }

        // Get the specific rows
        const placeholders = rowIds.map(() => '?').join(',');
        const rows = await new Promise((resolve, reject) => {
            this.db.all(`SELECT rowid, * FROM product_data WHERE rowid IN (${placeholders})`, rowIds, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        if (rows.length > 0) {
            await this.processBatch(rows, computedFees);
        }
    }

    /**
     * Process a batch of product data rows
     */
async processBatch(productDataRows, computedFees) {
    return new Promise((resolve, reject) => {
        this.db.run("BEGIN TRANSACTION", (err) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                const stmt = this.prepareUpsertStatement(computedFees);
                let completed = 0;
                const total = productDataRows.length;
                
                for (const row of productDataRows) {
                    const computedValues = this.calculateComputedFeesForRow(computedFees, row);
                    const params = this.buildUpsertParams(row.rowid, computedFees, computedValues);
                    
                    // Wait for each statement to complete
                    stmt.run(params, (err) => {
                        if (err) {
                            stmt.finalize();
                            this.db.run("ROLLBACK");
                            reject(err);
                            return;
                        }
                        
                        completed++;
                        
                        // Only finalize and commit after all rows are processed
                        if (completed === total) {
                            stmt.finalize((err) => {
                                if (err) {
                                    this.db.run("ROLLBACK");
                                    reject(err);
                                    return;
                                }
                                
                                this.db.run("COMMIT", (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                        }
                    });
                }

            } catch (error) {
                this.db.run("ROLLBACK");
                reject(error);
            }
        });
    });
}

    /**
     * Calculate computed fees for a single row
     */
    calculateComputedFeesForRow(computedFees, row) {
        const calculatedValues = {};
        
        // Sort computed fees by dependencies to ensure correct calculation order
        const sortedFees = sortComputedFeesByDependencies(computedFees);
        
        // Calculate each computed fee
        sortedFees.forEach(feeRule => {
            if (!feeRule.active || !feeRule.formula) return;

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
                    let formula = feeRule.formula;
                    
                    // Replace field names with actual values
                    formula = formula.replace(/\bfee(\d+)\b/g, (match, num) => {
                        return row[`fee${num}`] || 0;
                    });
                    formula = formula.replace(/quantity/g, row.quantity || 0);
                    formula = formula.replace(/pid/g, row.pid || 0);
                    
                    // Replace computed fee references with calculated values
                    formula = formula.replace(/computed_fee(\d+)/g, (match, feeId) => {
                        const fieldName = `computed_fee${feeId}`;
                        const value = calculatedValues[fieldName];
                        return value !== undefined ? value : 0;
                    });

                    // Evaluate the formula
                    const result = Function('"use strict"; return (' + formula + ')')();
                    
                    if (!isNaN(result)) {
                        calculatedValues[`computed_fee${feeRule.id}`] = result;
                    }
                } catch (error) {
                    // If calculation fails, default to 0
                    calculatedValues[`computed_fee${feeRule.id}`] = 0;
                }
            } else {
                calculatedValues[`computed_fee${feeRule.id}`] = 0;
            }
        });

        return calculatedValues;
    }

    /**
     * Prepare INSERT OR REPLACE statement for cache updates
     */
    prepareUpsertStatement(computedFees) {
        const feeColumns = computedFees
            .filter(fee => fee.id <= this.maxComputedFeeId)
            .map(fee => `computed_fee${fee.id}`)
            .join(', ');
        
        const placeholders = computedFees
            .filter(fee => fee.id <= this.maxComputedFeeId)
            .map(() => '?')
            .join(', ');

        const sql = `
            INSERT OR REPLACE INTO computed_fee_cache 
            (product_data_rowid, ${feeColumns}, last_updated, cache_version)
            VALUES (?, ${placeholders}, CURRENT_TIMESTAMP, 
                    (SELECT COALESCE(MAX(cache_version), 0) + 1 FROM computed_fee_cache))
        `;

        return this.db.prepare(sql);
    }

    /**
     * Build parameters for upsert statement
     */
    buildUpsertParams(rowId, computedFees, computedValues) {
        const params = [rowId];
        
        computedFees
            .filter(fee => fee.id <= this.maxComputedFeeId)
            .forEach(fee => {
                params.push(computedValues[`computed_fee${fee.id}`] || 0);
            });

        return params;
    }

    /**
     * Get product data row count
     */
    async getProductDataRowCount() {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM product_data", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    /**
     * Get batch of product data
     */
    async getProductDataBatch(offset, limit) {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT rowid, * FROM product_data LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Clear the entire cache
     */
    async clearCache() {
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM computed_fee_cache", (err) => {
                if (err) reject(err);
                else {
                    console.log('Computed fee cache cleared');
                    resolve();
                }
            });
        });
    }

    /**
     * Clear cache for specific rows
     */
    async clearCacheForRows(rowIds) {
        if (!Array.isArray(rowIds) || rowIds.length === 0) return;

        const placeholders = rowIds.map(() => '?').join(',');
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM computed_fee_cache WHERE product_data_rowid IN (${placeholders})`, rowIds, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        return new Promise((resolve, reject) => {
            const queries = [
                "SELECT COUNT(*) as cached_rows FROM computed_fee_cache",
                "SELECT COUNT(*) as total_product_rows FROM product_data", 
                "SELECT MAX(last_updated) as last_update FROM computed_fee_cache",
                "SELECT cache_version FROM computed_fee_cache LIMIT 1"
            ];

            Promise.all(queries.map(query => 
                new Promise((resolve, reject) => {
                    this.db.get(query, (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                })
            )).then(results => {
                resolve({
                    cachedRows: results[0].cached_rows,
                    totalProductRows: results[1].total_product_rows,
                    lastUpdate: results[2].last_update,
                    cacheVersion: results[3]?.cache_version || 0,
                    cacheHitRate: results[0].cached_rows / Math.max(results[1].total_product_rows, 1)
                });
            }).catch(reject);
        });
    }
}

module.exports = ComputedFeeCacheService;
