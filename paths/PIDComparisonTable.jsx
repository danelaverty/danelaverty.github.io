import React, { useState } from 'react';

const PIDComparisonTable = ({ 
  resultsByPID, 
  computedFees, 
  groups,
  selectedPID, 
  onPIDSelect,
  getComputedFeeName,
  formatCurrency,
  formatPercentage 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('pid'); // 'pid', 'impact', 'baseline'

  // Get active computed fees marked for summary display only
  const getSummaryComputedFees = () => {
    if (!computedFees || !groups) return [];
    
    const activeSummary = computedFees.filter(fee => fee.active && fee.summary);
    
    return activeSummary.sort((a, b) => {
      const groupA = groups.find(g => g.id === (a.computed_fee_group_id || 1));
      const groupB = groups.find(g => g.id === (b.computed_fee_group_id || 1));
      
      const priorityA = groupA ? (groupA.priority || 0) : 999;
      const priorityB = groupB ? (groupB.priority || 0) : 999;
      
      if (priorityA === priorityB) {
        return (a.priority || 0) - (b.priority || 0);
      }
      
      return priorityA - priorityB;
    });
  };

  // Calculate impact for a PID (final value - baseline value for a specific computed fee)
  const calculatePIDImpact = (pid, computedFeeField = 'computed_fee3') => {
    if (!resultsByPID || !resultsByPID.results_by_pid[pid]) return 0;
    
    const pidResults = resultsByPID.results_by_pid[pid];
    if (pidResults.length < 2) return 0;
    
    const baseline = pidResults[0];
    const final = pidResults[pidResults.length - 1];
    const fieldKey = `total_${computedFeeField}`;
    
    return (final[fieldKey] || 0) - (baseline[fieldKey] || 0);
  };

  // Filter and sort PIDs
  const getFilteredAndSortedPIDs = () => {
    if (!resultsByPID) return [];
    
    let pidList = [...resultsByPID.pid_list];
    
    // Filter by search term
    if (searchTerm) {
      pidList = pidList.filter(pid => 
        pid.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort PIDs
    if (sortBy === 'pid') {
      pidList.sort((a, b) => a.toString().localeCompare(b.toString()));
    } else if (sortBy === 'impact') {
      pidList.sort((a, b) => {
        const impactA = calculatePIDImpact(a);
        const impactB = calculatePIDImpact(b);
        return Math.abs(impactB) - Math.abs(impactA); // Sort by absolute impact, largest first
      });
    } else if (sortBy === 'baseline') {
      pidList.sort((a, b) => {
        const baselineA = resultsByPID.results_by_pid[a]?.[0]?.total_computed_fee3 || 0;
        const baselineB = resultsByPID.results_by_pid[b]?.[0]?.total_computed_fee3 || 0;
        return baselineB - baselineA; // Sort by baseline value, largest first
      });
    }
    
    return pidList;
  };

  const filteredPIDs = getFilteredAndSortedPIDs();
  const summaryFees = getSummaryComputedFees();

  const clearPIDSelection = () => {
    onPIDSelect(null);
  };

  if (!resultsByPID) return null;

  return (
    <div className="pid-selection-panel">
      <div className="pid-controls">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search Producer IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="pid">Sort by PID</option>
            <option value="impact">Sort by Impact</option>
            <option value="baseline">Sort by Baseline</option>
          </select>
        </div>
        
        <div className="selection-controls">
          <span className="selection-count">
            {selectedPID ? `Selected: PID ${selectedPID}` : 'No producer selected'}
          </span>
          {selectedPID && (
            <button className="btn-secondary-small" onClick={clearPIDSelection}>
              Clear Selection
            </button>
          )}
        </div>
      </div>

      <div className="pid-list">
        {summaryFees.length === 0 ? (
          <div className="no-summary-fees">
            <p>No computed fees are marked for summary display. Set the "summary" property to 1 for computed fees you want to include in the producer comparison table.</p>
          </div>
        ) : (
          <div className="pid-table-container">
            <table className="pid-table">
              <thead>
                <tr>
                  <th rowSpan="2" className="pid-header">Producer ID</th>
                  {summaryFees.map(fee => (
                    <th key={fee.id} colSpan="4" className="fee-group-header">
                      {getComputedFeeName(`computed_fee${fee.id}`)}
                    </th>
                  ))}
                </tr>
                <tr className="sub-header-row">
                  {summaryFees.map(fee => (
                    <React.Fragment key={fee.id}>
                      <th className="sub-header">Baseline</th>
                      <th className="sub-header">Final</th>
                      <th className="sub-header">Delta $</th>
                      <th className="sub-header">Delta %</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPIDs.slice(0, 100).map(pid => { // Limit display to first 100 for performance
                  const isSelected = selectedPID === pid;
                    const pidData = resultsByPID.pid_summaries?.[pid];
                    if (!pidData) return null; // Skip if no data
                    const baseline = pidData.baseline || {};
                    const final = pidData.final || baseline;
                  
                  return (
                    <tr 
                          key={pid} 
                          className={`pid-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => onPIDSelect(pid)}
                        >
                      <td className="pid-cell">
                        <strong>PID {pid}</strong>
                      </td>
                      {summaryFees.map(fee => {
                        const fieldKey = `total_computed_fee${fee.id}`;
                        const baselineValue = baseline[fieldKey] || 0;
                        const finalValue = final[fieldKey] || 0;
                        const delta = finalValue - baselineValue;
                        const deltaPercent = baselineValue && Math.abs(baselineValue) > 0.01 ? ((delta / baselineValue) * 100) : 0;
                        
                        const isPositive = delta > 0;
                        const isZero = Math.abs(delta) < 0.01;
                        
                        return (
                          <React.Fragment key={fee.id}>
                            <td className="fee-value-cell">
                              {formatCurrency(baselineValue)}
                            </td>
                            <td className="fee-value-cell">
                              {formatCurrency(finalValue)}
                            </td>
                            <td className={`fee-value-cell delta-cell ${isZero ? 'no-change' : isPositive ? 'positive' : 'negative'}`}>
                              {isZero ? '$0' : `${isPositive ? '+' : ''}${formatCurrency(delta)}`}
                            </td>
                            <td className={`fee-value-cell delta-cell ${isZero ? 'no-change' : isPositive ? 'positive' : 'negative'}`}>
                              {isZero ? '0.0%' : `${isPositive ? '+' : ''}${formatPercentage(deltaPercent)}`}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {filteredPIDs.length > 100 && (
          <div className="pid-overflow-notice">
            Showing first 100 of {filteredPIDs.length} producers. Use search to narrow results.
          </div>
        )}
      </div>
    </div>
  );
};

export default PIDComparisonTable;
