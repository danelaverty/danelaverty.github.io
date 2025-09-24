import React, { useState, useEffect } from 'react';
import SBScenarioForm from './SBScenarioForm';
import SBScenarioList from './SBScenarioList';

const ScenarioBuilder = ({ 
  scenarios, 
  activeScenario, 
  onScenarioSelect, 
  onScenarioCreate, 
  onScenarioUpdate, 
  onScenarioDelete,
    userDefinedNames
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
    const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);

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

const loadFilterOptions = async () => {
  try {
    const data = await api('/api/data/filters/values');
    setFilterOptions(data);
  } catch (error) {
    console.error('Error loading filter options:', error);
    setFilterOptions({});
  }
};

useEffect(() => {
  loadFilterOptions().finally(() => setLoading(false));
}, []);

  // Handlers
  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingScenario(null);
  };

  const handleEdit = (scenario) => {
    setEditingScenario(scenario);
    setIsCreating(false);
  };

  const handleCopy = async (scenario) => {
    try {
      const fullScenario = await api(`/api/scenarios/${scenario.id}`);
      const scenarioWithPolicies = {
        ...scenario,
        name: `${scenario.name} (Copy)`,
        policies: fullScenario.policies
      };
      setEditingScenario(scenarioWithPolicies);
      setIsCreating(true);
    } catch (error) {
      console.error('Error copying scenario:', error);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingScenario(null);
  };

  const handleSave = async (formData) => {
    try {
      if (isCreating) {
        await onScenarioCreate(formData);
      } else if (editingScenario) {
        await onScenarioUpdate(editingScenario.id, formData);
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  const ActionButton = ({ className, onClick, children, ...props }) => (
    <button className={className} onClick={onClick} {...props}>{children}</button>
  );

if (loading) {
      return <div className="loading">Loading scenario builder...</div>;
}

  return (
    <div className="scenario-builder">
      <div className="builder-header">
        <h3>Scenarios</h3>
        <div className="header-actions">
          <ActionButton className="btn-primary" onClick={handleCreateNew}>
            + New Scenario
          </ActionButton>
        </div>
      </div>

      {/* Scenario Form */}
      {(isCreating || editingScenario) && (
        <SBScenarioForm
          scenario={editingScenario}
          isCreating={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
          filterOptions={filterOptions}
          userDefinedNames={userDefinedNames}
        />
      )}

      {/* Scenarios List */}
      <SBScenarioList
        scenarios={scenarios}
        activeScenario={activeScenario}
        onSelect={onScenarioSelect}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={onScenarioDelete}
      />
    </div>
  );
};

export default ScenarioBuilder;
