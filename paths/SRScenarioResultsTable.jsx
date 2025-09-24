import React from 'react';

const ChangeBadge = ({ current, baseline, formatCurrency }) => {
  const diff = (current || 0) - (baseline || 0);
  const isPositive = diff > 0;
  const isZero = Math.abs(diff) < 0.01;

  if (isZero) return null;

  return (
    <small className={`change-badge ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? '+' : ''}{formatCurrency(diff)}
    </small>
  );
};

const SRScenarioResultsTable = ({ 
  results,
  feesToDisplay,
  groupedComputedFees,
  groupedPolicies,
  showAllFees,
  formatPolicyNameWithValue,
  getComputedFeeName,
  getRegularFeeName,
  formatCurrency,
  formatPercentage
}) => {
  const [showSummaryRows, setShowSummaryRows] = React.useState({
    netChangeOfGroup: true,
    netChangeVsBaseline: true,
    netChangeVsBaselinePercent: true
  });

  const allSummaryRowsShown = showSummaryRows.netChangeOfGroup && 
    showSummaryRows.netChangeVsBaseline && 
    showSummaryRows.netChangeVsBaselinePercent;
  
  const someSummaryRowsShown = showSummaryRows.netChangeOfGroup || 
    showSummaryRows.netChangeVsBaseline || 
    showSummaryRows.netChangeVsBaselinePercent;

  const toggleAllSummaryRows = () => {
    const newValue = !allSummaryRowsShown;
    setShowSummaryRows({
      netChangeOfGroup: newValue,
      netChangeVsBaseline: newValue,
      netChangeVsBaselinePercent: newValue
    });
  };

  if (feesToDisplay.length === 0) {
    return (
      <div className="no-computed-fees">
        <div className="summary-card">
          <h4>No Active Computed Fees</h4>
          <p>No computed fee rules are currently active. Please configure computed fee rules to see scenario results.</p>
        </div>
      </div>
    );
  }

  const baseline = results[0];
  const isGrouped = groupedPolicies.length > 0;
  
  // Normalize: always work with groups
  const normalizedGroups = isGrouped ? groupedPolicies : [{
    id: 'default',
    name: 'Policy',
    policies: results.slice(1)
  }];

  // Helper function to get border styles for a fee
  const getBorderStyles = (fee) => {
    const styles = {};
    
    if (fee.type === 'computed' && isGrouped && !showAllFees && groupedComputedFees.length > 0) {
      for (const group of groupedComputedFees) {
        const feeInThisGroup = group.fees.find(f => f.field === fee.field);
        if (feeInThisGroup && group.color) {
          const groupColor = group.color.primary || '#6b7280';
          const groupFeeFields = group.fees.map(f => f.field);
          const feeIndexInGroup = groupFeeFields.indexOf(fee.field);
          const isFirstInGroup = feeIndexInGroup === 0;
          
          if (isFirstInGroup) {
            styles.borderLeft = `3px solid ${groupColor}`;
          }
          break;
        }
      }
    }
    
    return styles;
  };

  return (
    <div className="results-table">
      {/* Summary Row Controls */}
      {isGrouped && (
        <div className="summary-controls" style={{ display: 'flex', flexDirection: 'row', padding: '4px', gap: '8px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <input
              type="checkbox"
              checked={allSummaryRowsShown}
              ref={input => {
                if (input) input.indeterminate = someSummaryRowsShown && !allSummaryRowsShown;
              }}
              onChange={toggleAllSummaryRows}
            />
            Show All Summary Rows
          </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={showSummaryRows.netChangeOfGroup}
                onChange={(e) => setShowSummaryRows(prev => ({ ...prev, netChangeOfGroup: e.target.checked }))}
              />
              Net Change of Policy Group
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={showSummaryRows.netChangeVsBaseline}
                onChange={(e) => setShowSummaryRows(prev => ({ ...prev, netChangeVsBaseline: e.target.checked }))}
              />
              Net Change vs Baseline
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={showSummaryRows.netChangeVsBaselinePercent}
                onChange={(e) => setShowSummaryRows(prev => ({ ...prev, netChangeVsBaselinePercent: e.target.checked }))}
              />
              Net Change vs Baseline %
            </label>
        </div>
      )}

      <table>
        <thead>
          {/* Group headers row */}
          {isGrouped && !showAllFees && groupedComputedFees.length > 0 && (
            <tr className="group-headers-row">
              <th></th><th></th>
              {groupedComputedFees.map(group => (
                <th 
                  key={group.id} 
                  colSpan={group.fees.length}
                  className="group-header-cell"
                  style={{ 
                    backgroundColor: group.color?.primary || '#6b7280', 
                    color: 'white' 
                  }}
                >
                  {group.name}
                </th>
              ))}
            </tr>
          )}
          
          {/* Column headers */}
          <tr>
            <th>Policy Group</th>
            <th>Step</th>
            {feesToDisplay.map((fee) => {
              let headerStyle = {};
              
              if (fee.type === 'computed' && isGrouped && !showAllFees && groupedComputedFees.length > 0) {
                for (const group of groupedComputedFees) {
                  const feeInThisGroup = group.fees.find(f => f.field === fee.field);
                  if (feeInThisGroup && group.color) {
                    headerStyle = { backgroundColor: group.color.light || '#f3f4f6' };
                    break;
                  }
                }
              }
              
              // Add border styles
              const borderStyles = getBorderStyles(fee);
              headerStyle = { ...headerStyle, ...borderStyles };
              
              return (
                <th 
                  key={fee.type === 'computed' ? fee.feeData.id : fee.field}
                  style={headerStyle}
                >
                  {fee.type === 'computed' 
                    ? getComputedFeeName(fee.field)
                    : getRegularFeeName(fee.field)
                  }
                  {fee.type === 'computed' && (
                    <small className="fee-type-badge">Computed</small>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Baseline row */}
          <tr className="baseline-row">
            <td className="policy-group-cell">Baseline</td>
            <td className="step-cell">
              <strong>Baseline (with computed fees)</strong>
            </td>
            {feesToDisplay.map(fee => {
              const borderStyles = getBorderStyles(fee);
              
              return (
                <td key={fee.field} style={borderStyles}>
                  <div className="value-cell">
                    <strong>{formatCurrency(baseline[`total_${fee.field}`])}</strong>
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Policy rows */}
          {(() => {
            const rows = [];
            let currentResultIndex = 1;
            
            normalizedGroups.forEach((group) => {
              // Calculate rowspan based on visible summary rows
              const summaryRowCount = (showSummaryRows.netChangeOfGroup ? 1 : 0) +
                                    (showSummaryRows.netChangeVsBaseline ? 1 : 0) +
                                    (showSummaryRows.netChangeVsBaselinePercent ? 1 : 0);
              const totalRowSpan = group.policies.length + summaryRowCount;

              // Policy rows for this group
              group.policies.forEach((policy, policyIndex) => {
                const result = results[currentResultIndex];
                const isFirstInGroup = policyIndex === 0;
                
                rows.push(
                  <tr 
                    key={`policy-${currentResultIndex}`} 
                    className={`policy-row ${isGrouped && isFirstInGroup ? 'policy-group-first' : ''}`}
                  >
                    {isGrouped && isFirstInGroup && (
                      <td rowSpan={totalRowSpan} className="policy-group-cell">
                        {group.name}
                      </td>
                    )}
                    {!isGrouped && <td className="policy-group-cell">{group.name}</td>}
                    
                    <td className="step-cell">
                      {!isGrouped && <small>Policy {policyIndex + 1}</small>}
                      <strong>{formatPolicyNameWithValue(result.policyName, result.policyData)}</strong>
                    </td>
                    
                    {feesToDisplay.map(fee => {
                      const fieldKey = `total_${fee.field}`;
                      const currentValue = result[fieldKey];
                      const previousValue = results[currentResultIndex - 1][fieldKey];
                      const borderStyles = getBorderStyles(fee);
                      
                      return (
                        <td key={fee.field} style={borderStyles}>
                          <div className="value-cell">
                            <strong>{formatCurrency(currentValue)}</strong>
                            <ChangeBadge 
                              current={currentValue} 
                              baseline={previousValue} 
                              formatCurrency={formatCurrency}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
                currentResultIndex++;
              });
              
              // Net change rows (only for grouped)
              if (isGrouped) {
                const lastResult = results[currentResultIndex - 1];
                const groupStartIndex = currentResultIndex - group.policies.length;
                
                // Calculate group deltas by summing individual policy changes
                const groupDeltas = {};
                for (let i = 0; i < group.policies.length; i++) {
                  const previousResult = results[groupStartIndex + i - 1];
                  const currentResult = results[groupStartIndex + i];
                  
                  feesToDisplay.forEach(fee => {
                    const fieldKey = `total_${fee.field}`;
                    const delta = (currentResult[fieldKey] || 0) - (previousResult[fieldKey] || 0);
                    groupDeltas[fieldKey] = (groupDeltas[fieldKey] || 0) + delta;
                  });
                }
                
                // Net Change of Policy Group (sum of individual deltas)
                if (showSummaryRows.netChangeOfGroup) {
                  rows.push(
                    <tr key={`policy-group-delta-${group.id}`} className="net-change-row policy-group-delta">
                      <td className="step-cell"><strong>Net Change of Policy Group</strong></td>
                      {feesToDisplay.map(fee => {
                        const fieldKey = `total_${fee.field}`;
                        const delta = groupDeltas[fieldKey] || 0;
                        const isPositive = delta > 0;
                        const isZero = Math.abs(delta) < 0.01;
                        const borderStyles = getBorderStyles(fee);
                        
                        return (
                          <td key={fee.field} style={borderStyles}>
                            <div className="value-cell net-change-cell">
                              <strong className={isZero ? 'no-change' : isPositive ? 'positive' : 'negative'}>
                                {isZero ? '$0' : `${isPositive ? '+' : ''}${formatCurrency(delta)}`}
                              </strong>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }
                
                // Net Change vs Baseline (total group effect)
                if (showSummaryRows.netChangeVsBaseline) {
                  rows.push(
                    <tr key={`net-change-${group.id}`} className="net-change-row">
                      <td className="step-cell"><strong>Net Change vs Baseline</strong></td>
                      {feesToDisplay.map(fee => {
                        const fieldKey = `total_${fee.field}`;
                        const diff = (lastResult[fieldKey] || 0) - (baseline[fieldKey] || 0);
                        const isPositive = diff > 0;
                        const isZero = Math.abs(diff) < 0.01;
                        const borderStyles = getBorderStyles(fee);
                        
                        return (
                          <td key={fee.field} style={borderStyles}>
                            <div className="value-cell net-change-cell">
                              <strong className={isZero ? 'no-change' : isPositive ? 'positive' : 'negative'}>
                                {isZero ? '$0' : `${isPositive ? '+' : ''}${formatCurrency(diff)}`}
                              </strong>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                // Net Change vs Baseline % (percentage version)
                if (showSummaryRows.netChangeVsBaselinePercent) {
                  rows.push(
                    <tr key={`net-change-percent-${group.id}`} className="net-change-row policy-group-last">
                      <td className="step-cell"><strong>Net Change vs Baseline %</strong></td>
                      {feesToDisplay.map(fee => {
                        const fieldKey = `total_${fee.field}`;
                        const finalValue = lastResult[fieldKey];
                        const baselineValue = baseline[fieldKey];
                        const diff = (finalValue || 0) - (baselineValue || 0);
                        const percentage = baselineValue && Math.abs(baselineValue) > 0.01 ? ((diff / baselineValue) * 100) : 0;
                        const isPositive = percentage > 0;
                        const isZero = Math.abs(percentage) < 0.01;
                        const borderStyles = getBorderStyles(fee);
                        
                        return (
                          <td key={fee.field} style={borderStyles}>
                            <div className="value-cell net-change-cell">
                              <strong className={isZero ? 'no-change' : isPositive ? 'positive' : 'negative'}>
                                {isZero ? '0.0%' : `${isPositive ? '+' : ''}${formatPercentage(percentage)}`}
                              </strong>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }
              }
            });
            
            return rows;
          })()}
        </tbody>
      </table>
    </div>
  );
};

export default SRScenarioResultsTable;
