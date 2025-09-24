import React, { useState, useEffect } from 'react';
import ImpactHistogramWithSave from './ImpactHistogramWithSave';
import PIDComparisonTable from './PIDComparisonTable';
import PIDResultsTable from './PIDResultsTable';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage,
  getComputedFeeName,
  getRegularFeeName,
  getFeesToDisplay,
  getGroupedComputedFees,
  getGroupedPolicies
} from './scenarioUtils';

const ScenarioResultsByID = ({ scenario, filters, computedFees, userDefinedNames }) => {
  const [resultsByPID, setResultsByPID] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAllFees, setShowAllFees] = useState(false);
  const [groups, setGroups] = useState([]);
  const [policyGroups, setPolicyGroups] = useState([]);
  const [selectedPID, setSelectedPID] = useState(null);
    const [calculationTime, setCalculationTime] = useState(null);
const [pidDetailCache, setPidDetailCache] = useState({});

console.log('App-level filters:', filters);
  console.log('Scenario filters:', scenario?.filters);
  
  // Use scenario's filters, falling back to app-level filters
  const effectiveFilters = scenario?.filters || filters || {};
  
  console.log('Effective filters being used:', effectiveFilters);

const loadPIDDetails = async (pid) => {
  // Check cache first
  if (pidDetailCache[pid]) {
    return pidDetailCache[pid];
  }
  
  try {
    const response = await fetch('/api/scenarios/calculate-by-pid-batch-aggregated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policies: scenario.policies,
        filters: effectiveFilters,
        mode: 'single_pid',
        pid: pid
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load PID details: HTTP ${response.status}`);
    }
    
    const pidDetails = await response.json();
    
    // Cache the result
    setPidDetailCache(prev => ({
      ...prev,
      [pid]: pidDetails.results
    }));
    
    return pidDetails.results;
  } catch (error) {
    console.error('Error loading PID details:', error);
    return null;
  }
};

const handlePIDSelect = async (pid) => {
  setSelectedPID(pid);
  if (pid) {
    await loadPIDDetails(pid);
  }
};

  
  // Histogram controls
  const [selectedFeeId, setSelectedFeeId] = useState(null);

  useEffect(() => {
    if (scenario) {
      calculateScenarioByPID();
    }
  }, [scenario, effectiveFilters, computedFees]);

  useEffect(() => {
    loadGroups();
    loadPolicyGroups();
  }, []);

  // Load computed fee groups
  const loadGroups = async () => {
    try {
      const response = await fetch('/api/computed-fee-groups');
      if (response.ok) {
        const groupsData = await response.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  // Load policy groups
  const loadPolicyGroups = async () => {
    try {
      const response = await fetch('/api/policy-groups');
      if (response.ok) {
        const groupsData = await response.json();
        setPolicyGroups(groupsData);
      }
    } catch (error) {
      console.error('Error loading policy groups:', error);
    }
  };

const calculateScenarioByPID = async () => {
  if (!scenario) return;
  
  setLoading(true);
  
  try {
    console.log('=== FRONTEND: Starting batch PID calculation (summary mode) ===');
    const startTime = Date.now();
    
    // Request summary mode - only baseline + final for each PID
    const response = await fetch('/api/scenarios/calculate-by-pid-batch-aggregated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policies: scenario.policies,
        filters: effectiveFilters,
        mode: 'summary' // Request summary mode
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to calculate scenario by PID: HTTP ${response.status}`);
    }
    
    const summaryResult = await response.json();
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log('=== FRONTEND: Summary calculation complete ===');
    console.log(`Total time: ${totalTime}ms`);
    console.log(`PIDs processed: ${summaryResult.total_pids}`);
    
    setResultsByPID(summaryResult);
    setCalculationTime(totalTime);
    
    if (summaryResult.pid_list?.length > 0) {
      setSelectedPID(summaryResult.pid_list[0]);
    }
    
  } catch (error) {
    console.error('Error in batch PID calculation:', error);
  } finally {
    setLoading(false);
  }
};

// Update the results-header to show calculation time
// In the JSX return, update the results-header section:
<div className="results-header">
  <h3>Producer Analysis: {scenario?.name}</h3>
  <div className="results-controls">
    <button 
      className={`btn-toggle ${showAllFees ? 'active' : ''}`}
      onClick={() => setShowAllFees(!showAllFees)}
    >
      {showAllFees ? 'Show Computed Fees Only' : 'Show All Fees'}
    </button>
    <button className="btn-secondary" onClick={calculateScenarioByPID}>
      Refresh
    </button>
    {calculationTime && (
      <span className="calculation-time">
        Calculated in {calculationTime}ms
      </span>
    )}
  </div>
</div>
  // Clear PID selection
  const clearPIDSelection = () => {
    setSelectedPID(null);
  };

  // Create wrapper functions for utility functions that need additional parameters
  const getComputedFeeNameWrapper = (fieldName) => {
    return getComputedFeeName(fieldName, computedFees, userDefinedNames);
  };

  const getRegularFeeNameWrapper = (fieldName) => {
    return getRegularFeeName(fieldName, userDefinedNames);
  };

  if (!scenario) {
    return (
      <div className="scenario-results-by-id">
        <div className="results-header">
          <h3>Producer Analysis</h3>
        </div>
        <div className="no-scenario">
          <p>Select a scenario to see producer-level results</p>
        </div>
      </div>
    );
  }

if (loading) {
  return (
    <div className="scenario-results-by-id">
      <div className="results-header">
        <h3>Producer Analysis</h3>
      </div>
      <div className="loading">
        <p>Calculating scenario</p>
      </div>
    </div>
  );
}

  if (!resultsByPID) {
    return (
      <div className="scenario-results-by-id">
        <div className="results-header">
          <h3>Producer Analysis</h3>
        </div>
        <div className="error">
          <p>Error calculating results by Producer ID</p>
          <button className="btn-secondary" onClick={calculateScenarioByPID}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const feesToDisplay = getFeesToDisplay(showAllFees, computedFees, groups);
  const groupedComputedFees = getGroupedComputedFees(showAllFees, computedFees, groups);
  const groupedPolicies = getGroupedPolicies(scenario, policyGroups);

  return (
    <div className="scenario-results-by-id">

<div className="results-header">
  <h3>Producer Analysis: {scenario.name}</h3>
  <div className="results-controls">
    <button 
      className={`btn-toggle ${showAllFees ? 'active' : ''}`}
      onClick={() => setShowAllFees(!showAllFees)}
    >
      {showAllFees ? 'Show Computed Fees Only' : 'Show All Fees'}
    </button>
    <button className="btn-secondary" onClick={calculateScenarioByPID}>
      Refresh
    </button>
    {calculationTime && (
      <span className="calculation-time">
        Calculated in {calculationTime}ms
      </span>
    )}
  </div>
</div>

      <div className="results-summary">
        <div className="summary-card">
          <p><strong>{resultsByPID.total_pids}</strong> producers analyzed</p>
          {Object.entries(effectiveFilters).filter(([k, v]) => v).length > 0 && (
            <div className="active-filters">
              <strong>Filters:</strong>
              {Object.entries(effectiveFilters)
                .filter(([key, value]) => value)
                .map(([key, value]) => (
                  <span key={key} className="filter-tag">
                    {key}: {value}
                  </span>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Impact Distribution Histogram */}
<ImpactHistogramWithSave
  selectedFeeId={selectedFeeId}
  setSelectedFeeId={setSelectedFeeId}
  computedFees={computedFees}
  groups={groups}
  resultsByPID={resultsByPID}
  getComputedFeeName={getComputedFeeNameWrapper}
  scenario={scenario}
  filters={effectiveFilters}
/>

      {/* PID Selection Panel */}
      <PIDComparisonTable
        resultsByPID={resultsByPID}
        computedFees={computedFees}
        groups={groups}
        selectedPID={selectedPID}
        onPIDSelect={handlePIDSelect}
        getComputedFeeName={getComputedFeeNameWrapper}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />

      {/* Results Tables */}
      <PIDResultsTable
        selectedPID={selectedPID}
        resultsByPID={resultsByPID}
      pidDetailCache={pidDetailCache}
        feesToDisplay={feesToDisplay}
        groupedComputedFees={groupedComputedFees}
        groupedPolicies={groupedPolicies}
        showAllFees={showAllFees}
        getComputedFeeName={getComputedFeeNameWrapper}
        getRegularFeeName={getRegularFeeNameWrapper}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />
    </div>
  );
};

export default ScenarioResultsByID;
