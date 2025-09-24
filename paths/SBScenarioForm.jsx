import React, { useState, useEffect } from 'react';

const SBScenarioForm = ({ 
  scenario, 
  isCreating, 
  onSave, 
  onCancel,
  filterOptions,
  userDefinedNames
}) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    filters: {}, 
    policies: []
  });
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [policyGroups, setPolicyGroups] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Helper function to get user-defined name for a column
  const getUserDefinedName = (actualName) => {
    if (!userDefinedNames) return actualName;
    const nameObj = userDefinedNames.find(n => n.actual_name === actualName);
    return nameObj ? nameObj.user_defined_name : actualName;
  };

  // API utilities
  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  };

  const updateFilter = (filterKey, value) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterKey]: value || undefined
      }
    }));
  };

  const clearAllFilters = () => {
    setFormData(prev => ({ ...prev, filters: {} }));
  };

  const getActiveFilterCount = () => {
    return Object.values(formData.filters).filter(value => value && value !== '').length;
  };

  const handleError = (operation, error) => {
    console.error(`Error ${operation}:`, error);
    setErrors(prev => ({ ...prev, [operation]: error.message }));
  };

  const clearError = (operation) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[operation];
      return newErrors;
    });
  };

  // Data fetchers
  const loadPolicies = async () => {
    try {
      const data = await api('/api/policies');
      setAvailablePolicies(data);
      clearError('loadPolicies');
    } catch (error) {
      handleError('loadPolicies', error);
    }
  };

  const loadPolicyGroups = async () => {
    try {
      const data = await api('/api/policy-groups');
      setPolicyGroups(data);
      clearError('loadPolicyGroups');
    } catch (error) {
      handleError('loadPolicyGroups', error);
    }
  };

  const loadScenarioPolicies = async (scenarioId) => {
    try {
      const data = await api(`/api/policies/scenario/${scenarioId}`);
      const policiesWithValues = data.map(p => ({
        policy_id: p.id,
        value: p.scenario_value !== null ? p.scenario_value : p.value
      }));
      setSelectedPolicies(policiesWithValues);
      setFormData(prev => ({ ...prev, policies: policiesWithValues }));
      clearError('loadScenarioPolicies');
    } catch (error) {
      handleError('loadScenarioPolicies', error);
    }
  };

  const updateScenario = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    Promise.all([loadPolicies(), loadPolicyGroups()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (scenario && !isCreating) {
      setFormData({
        name: scenario.name,
        description: scenario.description,
        filters: scenario.filters || {},
        policies: []
      });
      loadScenarioPolicies(scenario.id);
    } else if (isCreating && scenario && scenario.policies) {
      setFormData({
        name: scenario.name || '',
        description: scenario.description || '',
        filters: scenario.filters || {},
        policies: []
      });
      const policiesWithValues = scenario.policies.map(p => ({
        policy_id: p.id,
        value: p.scenario_value !== undefined ? p.scenario_value : p.value
      }));
      setSelectedPolicies(policiesWithValues);
      updateScenario('policies', policiesWithValues);
    } else if (isCreating) {
      setFormData({ name: '', description: '', filters: {}, policies: [] });
      setSelectedPolicies([]);
    }
  }, [scenario, isCreating]);

  const getGroupedPolicies = () => {
    const grouped = {};
    availablePolicies.forEach(policy => {
      const groupId = policy.policy_group_id || 1;
      const group = policyGroups.find(g => g.id === groupId);
      if (!grouped[groupId]) {
        grouped[groupId] = {
          id: groupId, 
          name: group?.name || 'Ungrouped', 
          priority: group?.priority || 999, 
          policies: []
        };
      }
      grouped[groupId].policies.push(policy);
    });
    return Object.values(grouped).sort((a, b) => 
      a.id === 1 ? -1 : b.id === 1 ? 1 : a.priority - b.priority
    );
  };

  const togglePolicy = (id) => {
    setSelectedPolicies(prev => {
      const existing = prev.find(p => p.policy_id === id);
      if (existing) {
        const newSelection = prev.filter(p => p.policy_id !== id);
        updateScenario('policies', newSelection);
        return newSelection;
      } else {
        const policy = availablePolicies.find(p => p.id === id);
        const defaultValue = policy?.type === 'reduce_percentage' ? 20 : 100;
        const newPolicy = {
          policy_id: id,
          value: defaultValue
        };
        const newSelection = [...prev, newPolicy];
        updateScenario('policies', newSelection);
        return newSelection;
      }
    });
  };

  const updatePolicyValue = (policyId, newValue) => {
    setSelectedPolicies(prev => {
      const newSelection = prev.map(p => 
        p.policy_id === policyId ? { ...p, value: parseFloat(newValue) || 0 } : p
      );
      updateScenario('policies', newSelection);
      return newSelection;
    });
  };

  const movePolicy = (fromIndex, toIndex) => {
    const newSelection = [...selectedPolicies];
    const [movedPolicy] = newSelection.splice(fromIndex, 1);
    newSelection.splice(toIndex, 0, movedPolicy);
    setSelectedPolicies(newSelection);
    updateScenario('policies', newSelection);
  };

  const getSelectedPoliciesInfo = () => {
    return selectedPolicies.map(sp => {
      const policy = availablePolicies.find(p => p.id === sp.policy_id);
      return {
        ...policy,
        scenario_value: sp.value,
        policy_id: sp.policy_id
      };
    });
  };

  const formatPolicyDescription = (policy, scenarioValue) => {
    const value = scenarioValue !== undefined ? scenarioValue : policy?.value;
    if (policy?.type === 'reduce_percentage') {
      return `Reduce ${policy.field} by ${value}%`;
    } else if (policy?.type === 'set_value') {
      return `Set ${policy.field} to ${value}`;
    }
    return `${policy?.type}: ${policy?.field} = ${value}`;
  };

  const formatCondition = (condition) => {
    if (!condition || typeof condition !== 'object' || !Object.keys(condition).length) {
      return '';
    }
    return Object.keys(condition).length === 1 && condition.type 
      ? condition.type 
      : JSON.stringify(condition);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      handleError('validation', new Error('Scenario name is required'));
      return;
    }
    
    const dataToSave = { 
      ...formData, 
      policies: selectedPolicies 
    };
    
    console.log('Saving scenario with data:', dataToSave);
    console.log('Selected policies:', selectedPolicies);
    
    onSave(dataToSave);
  };

  const ActionButton = ({ className, onClick, children, disabled, ...props }) => (
    <button className={className} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );

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

  if (loading) {
    return <div className="loading">Loading policies...</div>;
  }

  return (
    <div className="scenario-form">
      <h4>{isCreating ? 'Create New Scenario' : 'Edit Scenario'}</h4>
      
      <ErrorDisplay errors={errors} />
      
      <div className="form-group">
        <label>Name:</label>
        <input 
          type="text" 
          value={formData.name} 
          onChange={(e) => updateScenario('name', e.target.value)} 
          placeholder="Scenario name" 
        />
      </div>

      <div className="filter-selection-section">
        <div className="filters-header">
          <h4>Scenario Filters</h4>
          <span className="filter-count">{getActiveFilterCount()} active</span>
          {getActiveFilterCount() > 0 && (
            <ActionButton className="btn-secondary-small" onClick={clearAllFilters}>
              Clear All
            </ActionButton>
          )}
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Type:</label>
            <select 
              value={formData.filters.type || ''} 
              onChange={(e) => updateFilter('type', e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.type?.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Sub-Type:</label>
            <select 
              value={formData.filters.subtype || ''} 
              onChange={(e) => updateFilter('subtype', e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.subtype?.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>{getUserDefinedName('attr1')}:</label>
            <select 
              value={formData.filters.attr1 || ''} 
              onChange={(e) => updateFilter('attr1', e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.attr1?.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>{getUserDefinedName('attr2')}:</label>
            <select 
              value={formData.filters.attr2 || ''} 
              onChange={(e) => updateFilter('attr2', e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.attr2?.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>{getUserDefinedName('attr3')}:</label>
            <select 
              value={formData.filters.attr3 || ''} 
              onChange={(e) => updateFilter('attr3', e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.attr3?.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>{getUserDefinedName('attr4')}:</label>
            <select 
              value={formData.filters.attr4 || ''} 
              onChange={(e) => updateFilter('attr4', e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.attr4?.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>{getUserDefinedName('attr5')}:</label>
            <select 
              value={formData.filters.attr5 || ''} 
              onChange={(e) => updateFilter('attr5', e.target.value)}
            >
              <option value="">All</option>
              {filterOptions.attr5?.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        {getActiveFilterCount() > 0 && (
          <div className="active-filters-summary">
            <h5>Active Filters:</h5>
            <div className="filter-tags">
              {Object.entries(formData.filters).map(([key, value]) => {
                if (!value || value === '') return null;
                return (
                  <span key={key} className="filter-tag">
                    {getUserDefinedName(key)}: {value}
                    <button 
                      className="filter-remove"
                      onClick={() => updateFilter(key, '')}
                      title="Remove filter"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="policy-selection-section">
        <div className="policies-header">
          <h4>Select Policies</h4>
          <span className="selected-count">{selectedPolicies.length} selected</span>
        </div>

        {selectedPolicies.length > 0 && (
          <div className="selected-policies-summary">
            <h5>Selected Policies (Execution Order):</h5>
            <div className="selected-policies-list">
              {getSelectedPoliciesInfo().map((policy, index) => (
                <div key={policy.policy_id} className="selected-policy-item">
                  <div className="policy-order-controls">
                    <ActionButton 
                      className="btn-small"
                      onClick={() => movePolicy(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </ActionButton>
                    <span className="execution-order">{index + 1}</span>
                    <ActionButton 
                      className="btn-small"
                      onClick={() => movePolicy(index, Math.min(selectedPolicies.length - 1, index + 1))}
                      disabled={index === selectedPolicies.length - 1}
                      title="Move down"
                    >
                      ↓
                    </ActionButton>
                  </div>
                  <div className="policy-info">
                    <span className="policy-name">{policy.name}</span>
                    <span className="policy-details">{formatPolicyDescription(policy, policy.scenario_value)}</span>
                    {policy.condition && Object.keys(policy.condition).length > 0 && (
                      <span className="policy-condition"> when {formatCondition(policy.condition)}</span>
                    )}
                  </div>
                  <div className="policy-value-control">
                    <label>Value:</label>
                    <input
                      type="number"
                      value={policy.scenario_value}
                      onChange={(e) => updatePolicyValue(policy.policy_id, e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <ActionButton 
                    className="btn-danger-small" 
                    onClick={() => togglePolicy(policy.policy_id)}
                  >
                    Remove
                  </ActionButton>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="available-policies">
          <h5>Available Policies:</h5>
          {getGroupedPolicies().map(group => (
            <div key={group.id} className="policy-group">
              <div className="group-header">
                <h6>{group.name}</h6>
                <span className="policy-count">
                  ({group.policies.length} polic{group.policies.length !== 1 ? 'ies' : 'y'})
                </span>
              </div>
              {group.policies.map(policy => {
                const isSelected = selectedPolicies.some(sp => sp.policy_id === policy.id);
                return (
                  <div key={policy.id} className="policy-selection-item">
                    <input 
                      type="checkbox" 
                      id={`policy-${policy.id}`} 
                      checked={isSelected} 
                      onChange={() => togglePolicy(policy.id)} 
                    />
                    <label htmlFor={`policy-${policy.id}`} className="policy-checkbox-label">
                      <div className="policy-name">{policy.name}</div>
                      <div className="policy-details">
                        {formatPolicyDescription(policy)}
                        {policy.condition && Object.keys(policy.condition).length > 0 && (
                          <span className="policy-condition"> when {formatCondition(policy.condition)}</span>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          ))}
          {availablePolicies.length === 0 && (
            <p className="empty-state">
              No policies available. Create policies in the Policy Builder first.
            </p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <ActionButton className="btn-secondary" onClick={onCancel}>
          Cancel
        </ActionButton>
        <ActionButton 
          className="btn-primary" 
          onClick={handleSave} 
          disabled={!formData.name.trim()}
        >
          {isCreating ? 'Create Scenario' : 'Save Changes'}
        </ActionButton>
      </div>
    </div>
  );
};

export default SBScenarioForm;
