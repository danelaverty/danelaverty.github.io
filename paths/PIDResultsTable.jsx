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

const PIDResultsTable = ({ 
  selectedPID,
  resultsByPID,
    pidDetailCache,
  feesToDisplay,
  groupedComputedFees,
  groupedPolicies,
  showAllFees,
  getComputedFeeName,
  getRegularFeeName,
  formatCurrency,
  formatPercentage
}) => {


  if (!selectedPID) {
    return (
      <div className="no-selection">
        <p>Select a Producer ID above to see detailed results</p>
      </div>
    );
  }

const pidResults = pidDetailCache[selectedPID] || resultsByPID.pid_summaries?.[selectedPID];

if (!pidResults) {
  return (
    <div className="no-selection">
      <p>No results found for Producer {selectedPID}</p>
    </div>
  );
}

let baseline, resultsArray;

if (Array.isArray(pidResults)) {
  // Full results from cache
  baseline = pidResults[0];
  resultsArray = pidResults;
} else {
  // Summary format - create a minimal array for rendering
  baseline = pidResults.baseline;
  resultsArray = [pidResults.baseline, pidResults.final];
}

  return (
    <div className="pid-results">
      <div className="pid-result-section">
        <div className="pid-result-header">
          <div className="pid-title">
            <h4>Producer {selectedPID}</h4>
            <span className="row-count">
              ({baseline.row_count} {baseline.row_count === 1 ? 'row' : 'rows'})
            </span>
          </div>
        </div>

        {feesToDisplay.length > 0 && (
          <div className="results-table">
            <table>
              <thead>
                {/* Group headers row - only show if there are computed fees and we're not showing all fees */}
                {!showAllFees && groupedComputedFees.length > 0 && (
                  <tr className="group-headers-row">
                    <th></th> {/* Empty cell for the policy group column */}
                    <th></th> {/* Empty cell for the step column */}
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
                
                {/* Regular headers row */}
                <tr>
                  <th>Policy Group</th>
                  <th>Step</th>
                  {feesToDisplay.map((fee, feeIndex) => {
                    let headerStyle = {};
                    
                    if (fee.type === 'computed' && !showAllFees && groupedComputedFees.length > 0) {
                      for (const group of groupedComputedFees) {
                        const feeInThisGroup = group.fees.find(f => f.field === fee.field);
                        if (feeInThisGroup && group.color) {
                          headerStyle = { backgroundColor: group.color.light || '#f3f4f6' };
                          break;
                        }
                      }
                    }
                    
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
                    const fieldKey = fee.type === 'computed' 
                      ? `total_${fee.field}` 
                      : `total_${fee.field}`;
                    const currentValue = baseline[fieldKey];
                    
                    return (
                      <td key={fee.field}>
                        <div className="value-cell">
                          <strong>{formatCurrency(currentValue)}</strong>
                        </div>
                      </td>
                    );
                  })}
                </tr>

{/* Policy rows grouped by policy group */}
{(() => {
  const tableRows = [];
  
  // Check if we have full results (from cache) or just summary
  const hasFullResults = Array.isArray(pidResults) && pidResults.length > 2;
  
  if (!hasFullResults) {
    // Summary mode - only show final result
    const finalResult = resultsArray[resultsArray.length - 1];
    
    tableRows.push(
      <tr key="final-result" className="policy-row">
        <td className="policy-group-cell" rowSpan="3">All Policies Applied</td>
        <td className="step-cell">
          <strong>Final Result (after all policies)</strong>
        </td>
        {feesToDisplay.map(fee => {
          const fieldKey = fee.type === 'computed' 
            ? `total_${fee.field}` 
            : `total_${fee.field}`;
          const currentValue = finalResult[fieldKey];
          const previousValue = baseline[fieldKey];
          
          return (
            <td key={fee.field}>
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
    
    // Add net change dollar row
    tableRows.push(
      <tr key="net-change-summary" className="net-change-row">
        <td className="step-cell">
          <strong>Net Change vs Baseline</strong>
        </td>
        {feesToDisplay.map(fee => {
          const fieldKey = fee.type === 'computed' 
            ? `total_${fee.field}` 
            : `total_${fee.field}`;
          const finalValue = finalResult[fieldKey];
          const baselineValue = baseline[fieldKey];
          const diff = (finalValue || 0) - (baselineValue || 0);
          const isPositive = diff > 0;
          const isZero = Math.abs(diff) < 0.01;
          
          return (
            <td key={fee.field}>
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
    
    // Add net change percent row
    tableRows.push(
      <tr key="net-change-percent-summary" className="net-change-row policy-group-last">
        <td className="step-cell">
          <strong>Net Change vs Baseline %</strong>
        </td>
        {feesToDisplay.map(fee => {
          const fieldKey = fee.type === 'computed' 
            ? `total_${fee.field}` 
            : `total_${fee.field}`;
          const finalValue = finalResult[fieldKey];
          const baselineValue = baseline[fieldKey];
          const diff = (finalValue || 0) - (baselineValue || 0);
          const percentage = baselineValue && Math.abs(baselineValue) > 0.01 ? ((diff / baselineValue) * 100) : 0;
          const isPositive = percentage > 0;
          const isZero = Math.abs(percentage) < 0.01;
          
          return (
            <td key={fee.field}>
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
    
  } else {
    // Full results mode - show all policy steps
    if (groupedPolicies.length > 0) {
      let currentResultIndex = 1; // Start after baseline
      
      groupedPolicies.forEach((group, groupIndex) => {
        // Add policy rows for this group
        group.policies.forEach((policy, policyIndexInGroup) => {
          const result = resultsArray[currentResultIndex];
          const isFirstPolicyInGroup = policyIndexInGroup === 0;
          
          let rowClasses = "policy-row";
          if (isFirstPolicyInGroup) {
            rowClasses += " policy-group-first";
          }
          
          tableRows.push(
            <tr key={`policy-${currentResultIndex}`} className={rowClasses}>
              {isFirstPolicyInGroup && (
                <td 
                  rowSpan={group.policies.length + 2} // +2 for net change rows
                  className="policy-group-cell"
                >
                  {group.name}
                </td>
              )}
              <td className="step-cell">
                <small>Policy {currentResultIndex}</small>
                <strong>{result.policyName}</strong>
              </td>
              {feesToDisplay.map(fee => {
                const fieldKey = fee.type === 'computed' 
                  ? `total_${fee.field}` 
                  : `total_${fee.field}`;
                const currentValue = result[fieldKey];
                const previousResult = resultsArray[currentResultIndex - 1];
                const previousValue = previousResult[fieldKey];
                
                return (
                  <td key={fee.field}>
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
        
        // Add "Net Change vs Baseline" dollar row
        const lastResultInGroup = resultsArray[currentResultIndex - 1];
        tableRows.push(
          <tr key={`net-change-${group.id}`} className="net-change-row">
            <td className="step-cell">
              <strong>Net Change vs Baseline</strong>
            </td>
            {feesToDisplay.map(fee => {
              const fieldKey = fee.type === 'computed' 
                ? `total_${fee.field}` 
                : `total_${fee.field}`;
              const finalValue = lastResultInGroup[fieldKey];
              const baselineValue = baseline[fieldKey];
              const diff = (finalValue || 0) - (baselineValue || 0);
              const isPositive = diff > 0;
              const isZero = Math.abs(diff) < 0.01;
              
              return (
                <td key={fee.field}>
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

        // Add "Net Change vs Baseline %" row
        tableRows.push(
          <tr key={`net-change-percent-${group.id}`} className="net-change-row policy-group-last">
            <td className="step-cell">
              <strong>Net Change vs Baseline %</strong>
            </td>
            {feesToDisplay.map(fee => {
              const fieldKey = fee.type === 'computed' 
                ? `total_${fee.field}` 
                : `total_${fee.field}`;
              const finalValue = lastResultInGroup[fieldKey];
              const baselineValue = baseline[fieldKey];
              const diff = (finalValue || 0) - (baselineValue || 0);
              const percentage = baselineValue && Math.abs(baselineValue) > 0.01 ? ((diff / baselineValue) * 100) : 0;
              const isPositive = percentage > 0;
              const isZero = Math.abs(percentage) < 0.01;
              
              return (
                <td key={fee.field}>
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
      });
    }
  }
  
  return tableRows;
})()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PIDResultsTable;
