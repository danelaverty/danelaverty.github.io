import React, { useState, useEffect } from 'react';

const SBScenarioList = ({ 
  scenarios, 
  activeScenario, 
  onSelect, 
  onEdit, 
  onCopy, 
  onDelete 
}) => {
  const [scenarioPolicyCounts, setScenarioPolicyCounts] = useState({});
  const [loading, setLoading] = useState(false);

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

const reorderScenario = async (scenarioId, direction) => {
  try {
    const currentIndex = scenarios.findIndex(s => s.id === scenarioId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= scenarios.length) return;
    
    // Update display orders
    await api(`/api/scenarios/${scenarioId}/order`, {
      method: 'PUT',
      body: JSON.stringify({ newOrder: newIndex })
    });
    
    const otherScenario = scenarios[newIndex];
    await api(`/api/scenarios/${otherScenario.id}/order`, {
      method: 'PUT',
      body: JSON.stringify({ newOrder: currentIndex })
    });
    
    // Refresh the scenarios list
    window.location.reload(); // Or call a parent refresh function
  } catch (error) {
    console.error('Error reordering scenarios:', error);
  }
};

  // Load policy counts for all scenarios
  const loadPolicyCounts = async () => {
    if (scenarios.length === 0) return;
    
    setLoading(true);
    try {
      const counts = {};
      await Promise.all(
        scenarios.map(async (scenario) => {
          try {
            const policies = await api(`/api/policies/scenario/${scenario.id}`);
            counts[scenario.id] = policies.length;
          } catch (error) {
            console.error(`Error loading policies for scenario ${scenario.id}:`, error);
            counts[scenario.id] = 0;
          }
        })
      );
      setScenarioPolicyCounts(counts);
    } catch (error) {
      console.error('Error loading policy counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicyCounts();
  }, [scenarios]);

  const ActionButton = ({ className, onClick, children, ...props }) => (
    <button className={className} onClick={onClick} {...props}>{children}</button>
  );

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  const getPolicyCount = (scenarioId) => {
    return scenarioPolicyCounts[scenarioId] || 0;
  };

  if (scenarios.length === 0) {
    return (
      <div className="scenarios-list">
        <p className="empty-state">No scenarios created yet</p>
      </div>
    );
  }

  return (
    <div className="scenarios-list">
      {loading && (
        <div className="loading-indicator">Loading policy counts...</div>
      )}
      {scenarios.map(scenario => {
        const policyCount = getPolicyCount(scenario.id);
        return (
          <div 
            key={scenario.id} 
            className={`scenario-item ${activeScenario?.id === scenario.id ? 'active' : ''}`} 
            onClick={() => onSelect(scenario)}
          >
            <div className="scenario-content">
              <h4>{scenario.name}</h4>
              <div className="scenario-details">
                <span className="policy-count">
                  {policyCount} {policyCount === 1 ? 'policy' : 'policies'}
                </span>
              </div>
            </div>
            <div className="scenario-actions">
<ActionButton 
    className="btn-secondary-small" 
    onClick={(e) => handleAction(e, () => reorderScenario(scenario.id, 'up'))}
    disabled={scenarios.findIndex(s => s.id === scenario.id) === 0}
    title="Move up"
  >
    ↑
  </ActionButton>
  <ActionButton 
    className="btn-secondary-small" 
    onClick={(e) => handleAction(e, () => reorderScenario(scenario.id, 'down'))}
    disabled={scenarios.findIndex(s => s.id === scenario.id) === scenarios.length - 1}
    title="Move down"
  >
    ↓
  </ActionButton>
              <ActionButton 
                className="btn-secondary-small" 
                onClick={(e) => handleAction(e, () => onEdit(scenario))}
                title="Edit scenario"
              >
                Edit
              </ActionButton>
              <ActionButton 
                className="btn-secondary-small" 
                onClick={(e) => handleAction(e, () => onCopy(scenario))} 
                title="Create a copy of this scenario"
              >
                Copy
              </ActionButton>
              <ActionButton 
                className="btn-danger-small" 
                onClick={(e) => handleAction(e, () => {
                  if (confirm(`Delete "${scenario.name}"?`)) {
                    onDelete(scenario.id);
                  }
                })}
                title="Delete scenario"
              >
                Delete
              </ActionButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SBScenarioList;
