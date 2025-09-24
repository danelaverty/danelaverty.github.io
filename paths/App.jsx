import React, { useState, useEffect } from 'react'
import PolicyBuilder from './PolicyBuilder'
import ScenarioBuilder from './ScenarioBuilder'
import ScenarioResults from './ScenarioResults'
import ScenarioResultsByID from './ScenarioResultsByID'
import FeeStats from './FeeStats'
import RawRows from './RawRows'
import ComputedFeeEditor from './ComputedFeeEditor'
import FiltersPanel from './FiltersPanel'
import UserDefinedNames from './UserDefinedNames'
import { ChartGallery } from './ChartGallery'
import './App.css'

function App() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [filteredStats, setFilteredStats] = useState(null);
  const [computedFees, setComputedFees] = useState([]);
  const [userDefinedNames, setUserDefinedNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('scenarios');
  const [errors, setErrors] = useState({});

  // API utilities
  const apiRequest = async (url, options = {}) => {
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`);
    }
    
    return response.json();
  };

  const handleError = (errorKey, message) => {
    setErrors(prev => ({ ...prev, [errorKey]: message }));
  };

  const clearError = (errorKey) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  };

  const createFetcher = (url, errorKey, errorPrefix) => async (payload = null) => {
    try {
      const options = payload ? { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      } : {};
      
      const data = await apiRequest(url, options);
      clearError(errorKey);
      return data;
    } catch (error) {
      console.error(`Error fetching ${errorKey}:`, error);
      handleError(errorKey, `${errorPrefix}: ${error.message}`);
      throw error;
    }
  };

  // Generic CRUD operations
  const handleCreate = (url, setState, errorKey, additionalActions = []) => async (payload) => {
    try {
      const data = await apiRequest(url, { method: 'POST', body: JSON.stringify(payload) });
      setState(prev => [data, ...prev]);
      additionalActions.forEach(action => action(data));
      clearError(errorKey);
      return data;
    } catch (error) {
      console.error(`Error creating:`, error);
      handleError(errorKey, `CREATE ERROR: ${error.message}`);
      throw error;
    }
  };

  const handleUpdate = (url, setState, errorKey, additionalActions = []) => async (id, payload) => {
    try {
      const data = await apiRequest(`${url}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setState(prev => prev.map(item => item.id === id ? data : item));
      additionalActions.forEach(action => action(data, id));
      clearError(errorKey);
      return data;
    } catch (error) {
      console.error(`Error updating:`, error);
      handleError(errorKey, `UPDATE ERROR: ${error.message}`);
      throw error;
    }
  };

  const handleDelete = (url, setState, errorKey, additionalActions = []) => async (id) => {
    try {
      await apiRequest(`${url}/${id}`, { method: 'DELETE' });
      setState(prev => prev.filter(item => item.id !== id));
      additionalActions.forEach(action => action(id));
      clearError(errorKey);
    } catch (error) {
      console.error(`Error deleting:`, error);
      handleError(errorKey, `DELETE ERROR: ${error.message}`);
      throw error;
    }
  };

  const handleBulkUpdate = (url, setState, errorKey, payloadWrapper, additionalActions = []) => async (payload) => {
    try {
      await apiRequest(url, { 
        method: 'PUT', 
        body: JSON.stringify(payloadWrapper ? payloadWrapper(payload) : payload) 
      });
      setState(payload);
      additionalActions.forEach(action => action(payload));
      clearError(errorKey);
    } catch (error) {
      console.error(`Error bulk updating:`, error);
      handleError(errorKey, `BULK UPDATE ERROR: ${error.message}`);
      throw error;
    }
  };

  // Fetch functions
  const fetchScenarios = createFetcher('/api/scenarios', 'scenarios', 'SCENARIOS API ERROR');
  const fetchFilterOptions = createFetcher('/api/filters/values', 'filterOptions', 'FILTER OPTIONS API ERROR');
  const fetchComputedFees = createFetcher('/api/computed-fees', 'computedFees', 'COMPUTED FEES API ERROR');
  const fetchUserDefinedNames = createFetcher('/api/user-defined-names', 'userDefinedNames', 'USER-DEFINED NAMES API ERROR');
  const fetchFilteredStats = createFetcher('/api/scenarios/baseline', 'filteredStats', 'FILTERED STATS API ERROR');

  // Refresh helpers
  const refreshDependentData = () => {
    fetchFilteredStats({ filters }).catch(() => {});
    fetchUserDefinedNames().catch(() => {});
  };

  // Scenario handlers
  const handleScenarioCreate = handleCreate(
    '/api/scenarios', setScenarios, 'scenarioCreate', 
      [(newScenario) => setActiveScenario(newScenario)]
  );

const handleScenarioUpdate = async (id, payload) => {
  try {
    // First update the scenario
    const data = await apiRequest(`/api/scenarios/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(payload) 
    });
    
    // Then fetch the full scenario with complete policy details
    const fullScenario = await apiRequest(`/api/scenarios/${id}`);
    
    // Update scenarios list with basic info
    setScenarios(prev => prev.map(item => item.id === id ? { 
      ...item, 
      name: fullScenario.name,
      description: fullScenario.description,
      filters: fullScenario.filters 
    } : item));
    
    // Update active scenario with full details
    if (activeScenario && activeScenario.id === id) {
      setActiveScenario(fullScenario);
    }
    
    clearError('scenarioUpdate');
    return data;
  } catch (error) {
    console.error(`Error updating:`, error);
    handleError('scenarioUpdate', `UPDATE ERROR: ${error.message}`);
    throw error;
  }
};

  const handleScenarioDelete = handleDelete(
    '/api/scenarios', setScenarios, 'scenarioDelete',
    [(id) => {
      if (activeScenario && activeScenario.id === id) {
        setActiveScenario(null);
      }
    }]
  );

  // Computed Fee handlers
  const handleComputedFeeCreate = handleCreate(
    '/api/computed-fees', setComputedFees, 'computedFeeCreate',
    [refreshDependentData]
  );

  const handleComputedFeeDelete = handleDelete(
    '/api/computed-fees', setComputedFees, 'computedFeeDelete',
    [refreshDependentData]
  );

  const handleSingleComputedFeeUpdate = handleUpdate(
    '/api/computed-fees', setComputedFees, 'singleComputedFeeUpdate',
    [refreshDependentData]
  );

  const handleComputedFeesUpdate = handleBulkUpdate(
    '/api/computed-fees', setComputedFees, 'computedFeesUpdate',
    (fees) => ({ computedFees: fees }),
    [refreshDependentData]
  );

  const handleUserDefinedNamesUpdate = handleBulkUpdate(
    '/api/user-defined-names', setUserDefinedNames, 'userDefinedNamesUpdate',
    (names) => ({ userDefinedNames: names })
  );

  // Effects
  useEffect(() => {
    Promise.all([
      fetchScenarios().then(setScenarios).catch(() => {}),
      fetchFilterOptions().then(setFilterOptions).catch(() => {}),
      fetchComputedFees().then(setComputedFees).catch(() => {}),
      fetchUserDefinedNames().then(setUserDefinedNames).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFilteredStats({ filters })
      .then(setFilteredStats)
      .catch(() => setFilteredStats(null)); // Fallback to null on error
  }, [filters]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return <div className="loading">Loading scenario calculator...</div>;
  }

  const ErrorDisplay = ({ errors }) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return null;

    return (
      <div className="error-section">
        {errorKeys.map(key => (
          <div key={key} className="error-message">
            <strong>{errors[key]}</strong>
            <button 
              className="error-dismiss"
              onClick={() => clearError(key)}
              title="Dismiss error"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  const statsToShow = filteredStats;
  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  return (
    <div className="App">
      <main className="App-main">
        <ErrorDisplay errors={errors} />
     {/* 
      <UserDefinedNames 
          userDefinedNames={userDefinedNames}
          onUserDefinedNamesUpdate={handleUserDefinedNamesUpdate}
          error={errors.userDefinedNames}
        />
  
        <RawRows 
          filters={filters} 
          userDefinedNames={userDefinedNames}
        />

        <FeeStats 
          stats={statsToShow} 
          computedFees={computedFees}
          userDefinedNames={userDefinedNames}
          onComputedFeesUpdate={handleComputedFeesUpdate}
          onSingleComputedFeeUpdate={handleSingleComputedFeeUpdate}
        />
        
        <ComputedFeeEditor
          computedFees={computedFees}
          onComputedFeesUpdate={handleComputedFeesUpdate}
          onSingleComputedFeeUpdate={handleSingleComputedFeeUpdate}
          onComputedFeeCreate={handleComputedFeeCreate}
          onComputedFeeDelete={handleComputedFeeDelete}
          filterOptions={filterOptions}
          userDefinedNames={userDefinedNames}
        />

        <FiltersPanel 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
          userDefinedNames={userDefinedNames}
          error={errors.filterOptions}
        />
*/}
        <PolicyBuilder />

        <ScenarioBuilder 
          scenarios={scenarios}
          activeScenario={activeScenario}
          onScenarioSelect={setActiveScenario}
          onScenarioCreate={handleScenarioCreate}
          onScenarioUpdate={handleScenarioUpdate}
          onScenarioDelete={handleScenarioDelete}
          userDefinedNames={userDefinedNames}
        />
        
        <div className="analysis-tab-navigation">
          <button 
            className={`analysis-tab-button ${activeAnalysisTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('scenarios')}
          >
            Scenario Analysis
          </button>
          <button 
            className={`analysis-tab-button ${activeAnalysisTab === 'producer-analysis' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('producer-analysis')}
          >
            Producer Analysis
          </button>
<button 
    className={`analysis-tab-button ${activeAnalysisTab === 'chart-gallery' ? 'active' : ''}`}
    onClick={() => setActiveAnalysisTab('chart-gallery')}
  >
    Chart Gallery
  </button>
        </div>
      
<div className="app-grid">
  {activeAnalysisTab === 'scenarios' ? (
    <ScenarioResults 
      scenario={activeScenario}
      filters={filters}
      computedFees={computedFees}
      userDefinedNames={userDefinedNames}
    />
  ) : activeAnalysisTab === 'producer-analysis' ? (
    <ScenarioResultsByID 
      scenario={activeScenario}
      filters={filters}
      computedFees={computedFees}
      userDefinedNames={userDefinedNames}
    />
  ) : (
    <ChartGallery 
      computedFees={computedFees}
      userDefinedNames={userDefinedNames}
    />
  )}
</div>
      </main>
    </div>
  )
}

export default App
