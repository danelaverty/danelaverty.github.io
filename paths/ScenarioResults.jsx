import React, { useState, useEffect } from 'react';
import SRRowsAndFiltersSummary from './SRRowsAndFiltersSummary';
import SRScenarioResultsTable from './SRScenarioResultsTable';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage,
  formatPolicyNameWithValue,
  getComputedFeeName,
  getRegularFeeName,
  getFeesToDisplay,
  getGroupedComputedFees,
  getGroupedPolicies,
  getActiveComputedFees
} from './scenarioUtils';

const ScenarioResults = ({ scenario, filters, computedFees, userDefinedNames }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
    const [refreshingCache, setRefreshingCache] = useState(false);
  const [showAllFees, setShowAllFees] = useState(false);
  const [groups, setGroups] = useState([]);
  const [policyGroups, setPolicyGroups] = useState([]);
  const [calculationTime, setCalculationTime] = useState(null);
const [cacheProgress, setCacheProgress] = useState({ processed: 0, total: 0 });

  const effectiveFilters = scenario?.filters || filters || {};


  // Generic API utility
  const apiRequest = async (url, options = {}) => {
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  };

  // Generic loading wrapper
  const withLoading = (operation, setLoadingState) => async (...args) => {
    setLoadingState(true);
    try {
      return await operation(...args);
    } finally {
      setLoadingState(false);
    }
  };

const refreshComputedFeeCache = withLoading(
  async () => {
    try {
      // Start the refresh
      const refreshPromise = apiRequest('/api/scenarios/refresh-cache', {
        method: 'POST'
      });
      
      // Poll for progress every 2 seconds
      const progressInterval = setInterval(async () => {
        try {
          const progress = await apiRequest('/api/scenarios/refresh-cache/status');
          setCacheProgress(progress);
        } catch (error) {
          console.error('Error getting cache status:', error);
        }
      }, 2000);
      
      // Wait for refresh to complete
      await refreshPromise;
      
      // Stop polling
      clearInterval(progressInterval);
      setCacheProgress({ processed: 0, total: 0 });
      
      // Recalculate scenario
      await calculateScenario();
      
    } catch (error) {
      console.error('Error refreshing computed fee cache:', error);
      alert('Failed to refresh computed fee cache');
    }
  },
  setRefreshingCache
);

  // Generic data fetcher with error handling
  const createDataFetcher = (url, setter, errorMessage) => async () => {
    try {
      const data = await apiRequest(url);
      setter(data);
    } catch (error) {
      console.error(errorMessage, error);
    }
  };

  // Generic calculation timer wrapper
  const withTiming = (operation, setTimer) => async (...args) => {
    const startTime = Date.now();
    try {
      const result = await operation(...args);
      setTimer(Date.now() - startTime);
      return result;
    } catch (error) {
      setTimer(Date.now() - startTime);
      throw error;
    }
  };

  // Data fetchers
  const loadGroups = createDataFetcher('/api/computed-fee-groups', setGroups, 'Error loading groups:');
  const loadPolicyGroups = createDataFetcher('/api/policy-groups', setPolicyGroups, 'Error loading policy groups:');

  // Calculation functions
  const calculateBatch = async (policies, filters) => {
    const batchResult = await apiRequest('/api/scenarios/calculate-batch-aggregated', {
      method: 'POST',
      body: JSON.stringify({ policies, filters })
    });
    
    return batchResult.results;
  };

  // Main calculation function with timing and loading
  const calculateScenario = withLoading(
    withTiming(async () => {
      if (!scenario) return;
      
      setCalculationTime(null);

      const results = await calculateBatch(scenario.policies, effectiveFilters);

      setResults(results);
    }, setCalculationTime),
    setLoading
  );

  // Wrapper functions for utility functions
  const createUtilityWrapper = (utilityFn, ...additionalArgs) => 
    (fieldName) => utilityFn(fieldName, ...additionalArgs);

  const getComputedFeeNameWrapper = createUtilityWrapper(getComputedFeeName, computedFees, userDefinedNames);
  const getRegularFeeNameWrapper = createUtilityWrapper(getRegularFeeName, userDefinedNames);

  // Effects
  useEffect(() => {
    if (scenario) {
      calculateScenario();
    }
  }, [scenario, effectiveFilters, computedFees]);

  useEffect(() => {
    Promise.all([loadGroups(), loadPolicyGroups()]);
  }, []);

  // Render helpers
  const renderEmptyState = (message) => (
    <div className="scenario-results">
      <div className="results-header">
        <h3>Results</h3>
      </div>
      <div className="no-scenario">
        <p>{message}</p>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="scenario-results">
      <div className="results-header">
        <h3>Results</h3>
      </div>
      <div className="loading">
        <p>Calculating scenario</p>
      </div>
    </div>
  );

  // Early returns
  if (!scenario) {
    return renderEmptyState("Select a scenario to see results");
  }

  if (loading) {
    return renderLoadingState();
  }

  // Derived data
  const baseline = results[0];
  const activeComputedFees = getActiveComputedFees(computedFees, groups);
  const feesToDisplay = getFeesToDisplay(showAllFees, computedFees, groups);
  const groupedComputedFees = getGroupedComputedFees(showAllFees, computedFees, groups);
  const groupedPolicies = getGroupedPolicies(scenario, policyGroups);

  return (
    <div className="scenario-results">
      <div className="results-header">
        <h3>Scenario: "{scenario.name}"</h3>
        <div className="results-controls">
          <button 
            className={`btn-toggle ${showAllFees ? 'active' : ''}`}
            onClick={() => setShowAllFees(!showAllFees)}
          >
            {showAllFees ? 'Show Computed Fees Only' : 'Show All Fees'}
          </button>
<button 
    className="btn-secondary" 
    onClick={refreshComputedFeeCache}
    disabled={refreshingCache}
>
    {refreshingCache ? 
        `Refreshing Cache... ${cacheProgress.processed.toLocaleString()} of ${cacheProgress.total.toLocaleString()} rows (${cacheProgress.percentage || 0}%)` : 
        'Refresh Computed Fees Cache'
    }
</button>
          <button className="btn-secondary" onClick={calculateScenario}>
            Refresh
          </button>
          {calculationTime && (
            <span className="calculation-time">
              Calculated in {calculationTime}ms
            </span>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <>
          <SRRowsAndFiltersSummary 
            baseline={baseline}
            filters={filters}
            formatNumber={formatNumber}
          />

          <SRScenarioResultsTable
            results={results}
            feesToDisplay={feesToDisplay}
            groupedComputedFees={groupedComputedFees}
            groupedPolicies={groupedPolicies}
            showAllFees={showAllFees}
            formatPolicyNameWithValue={(name, data) => formatPolicyNameWithValue(name, data, formatCurrency)}
            getComputedFeeName={getComputedFeeNameWrapper}
            getRegularFeeName={getRegularFeeNameWrapper}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        </>
      )}
    </div>
  );
};

export default ScenarioResults;
