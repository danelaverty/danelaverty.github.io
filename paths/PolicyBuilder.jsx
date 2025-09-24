import React, { useState, useEffect } from 'react';

const PolicyBuilder = () => {
  const [policies, setPolicies] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
  const [policyGroups, setPolicyGroups] = useState([]);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isManagingGroups, setIsManagingGroups] = useState(false);
  const [policyFormData, setPolicyFormData] = useState({
    name: '',
    type: 'reduce_percentage',
    field: 'fee4',
    condition: '', // Store as raw string
    affects_direct: '',
    affects_inverse: '',
    policy_group_id: 1
  });
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPriority, setNewGroupPriority] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

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
      setPolicies(data);
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

  useEffect(() => {
    Promise.all([loadPolicies(), loadPolicyGroups()])
      .finally(() => setLoading(false));
  }, []);

  // Form state management
  const updatePolicy = (field, value) => {
    setPolicyFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetPolicyForm = () => {
    setPolicyFormData({
      name: '',
      type: 'reduce_percentage',
      field: 'fee4',
      condition: '', // Reset to empty string
      affects_direct: '',
      affects_inverse: '',
      policy_group_id: 1
    });
  };

  // Helper function to convert condition back to string for editing
  const conditionToString = (condition) => {
    if (!condition) return '';
    
    // If it has a parse error, return the original value
    if (condition._parseError) {
      return condition._originalValue || '';
    }
    
    // If it's an empty object, return empty string
    if (typeof condition === 'object' && Object.keys(condition).length === 0) {
      return '';
    }
    
    // If it's an object, stringify it
    if (typeof condition === 'object') {
      return JSON.stringify(condition);
    }
    
    // Otherwise return as string
    return String(condition);
  };

  // Policy CRUD operations
  const handleCreatePolicy = async () => {
    if (!policyFormData.name.trim()) return;
    
    try {
      // Send condition as raw string
      const dataToSend = {
        ...policyFormData,
        condition: policyFormData.condition // Send raw string
      };
      
      const newPolicy = await api('/api/policies', {
        method: 'POST',
        body: JSON.stringify(dataToSend)
      });
      setPolicies(prev => [newPolicy, ...prev]);
      resetPolicyForm();
      setIsCreatingPolicy(false);
      clearError('createPolicy');
    } catch (error) {
      handleError('createPolicy', error);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!policyFormData.name.trim() || !editingPolicy) return;
    
    try {
      // Send condition as raw string
      const dataToSend = {
        ...policyFormData,
        condition: policyFormData.condition // Send raw string
      };
      
      const updatedPolicy = await api(`/api/policies/${editingPolicy}`, {
        method: 'PUT',
        body: JSON.stringify(dataToSend)
      });
      setPolicies(prev => prev.map(p => p.id === editingPolicy ? updatedPolicy : p));
      setEditingPolicy(null);
      resetPolicyForm();
      clearError('updatePolicy');
    } catch (error) {
      handleError('updatePolicy', error);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    
    try {
      await api(`/api/policies/${id}`, { method: 'DELETE' });
      setPolicies(prev => prev.filter(p => p.id !== id));
      clearError('deletePolicy');
    } catch (error) {
      handleError('deletePolicy', error);
    }
  };

  const handleDuplicatePolicy = async (id) => {
    try {
      const duplicatedPolicy = await api(`/api/policies/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      setPolicies(prev => [duplicatedPolicy, ...prev]);
      clearError('duplicatePolicy');
    } catch (error) {
      handleError('duplicatePolicy', error);
    }
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy.id);
    setPolicyFormData({
      name: policy.name,
      type: policy.type,
      field: policy.field,
      condition: conditionToString(policy.condition), // Convert back to string for editing
      affects_direct: policy.affects_direct || '',
      affects_inverse: policy.affects_inverse || '',
      policy_group_id: policy.policy_group_id || 1
    });
    setIsCreatingPolicy(false);
  };

  // Policy Group CRUD operations
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const newGroup = await api('/api/policy-groups', {
        method: 'POST',
        body: JSON.stringify({
          name: newGroupName.trim(),
          priority: newGroupPriority
        })
      });
      setPolicyGroups(prev => [...prev, newGroup]);
      setNewGroupName('');
      setNewGroupPriority(0);
      clearError('createGroup');
    } catch (error) {
      handleError('createGroup', error);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group? Policies in this group will be moved to "Ungrouped".')) return;
    
    try {
      await api(`/api/policy-groups/${id}`, { method: 'DELETE' });
      setPolicyGroups(prev => prev.filter(g => g.id !== id));
      // Refresh policies to update group assignments
      loadPolicies();
      clearError('deleteGroup');
    } catch (error) {
      handleError('deleteGroup', error);
    }
  };

  // Handlers
  const handleCreateNew = () => {
    setIsCreatingPolicy(true);
    setEditingPolicy(null);
    resetPolicyForm();
  };

  const handleCancel = () => {
    setIsCreatingPolicy(false);
    setEditingPolicy(null);
    resetPolicyForm();
  };

  // Helper functions
  const formatCondition = (condition) => {
    if (!condition) return '';
    
    // If there's a parse error, show the error
    if (condition._parseError) {
      return `❌ ${condition._error}: "${condition._originalValue}"`;
    }
    
    // If it's an empty object, return empty
    if (typeof condition === 'object' && Object.keys(condition).length === 0) return '';
    
    // If it's an object, show a summary
    if (typeof condition === 'object') {
      const keys = Object.keys(condition);
      if (keys.length === 1 && condition.type) {
        return condition.type; // Simple case for backwards compatibility
      }
      return `${keys.length} condition${keys.length !== 1 ? 's' : ''}`;
    }
    
    return String(condition);
  };

  const getGroupedPolicies = () => {
    const grouped = {};
    policies.forEach(policy => {
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

  // Form fields configuration
  const policyFields = [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'Policy name' },
    { 
      key: 'policy_group_id', 
      label: 'Group', 
      type: 'select', 
      options: policyGroups.map(g => ({ value: g.id, label: g.name })) 
    },
    { 
      key: 'type', 
      label: 'Type', 
      type: 'select', 
      options: [
        { value: 'reduce_percentage', label: 'Reduce by %' },
        { value: 'set_value', label: 'Set Value' }
      ]
    },
    { 
      key: 'field', 
      label: 'Field', 
      type: 'select', 
      options: Array.from({ length: 17 }, (_, i) => ({ 
        value: `fee${i + 1}`, 
        label: `Fee ${i + 1} Amt` 
      })) 
    },
    { 
      key: 'condition', 
      label: 'Condition', 
      type: 'text', 
      placeholder: 'e.g., {"type":"Hat Felt","attr5":"Y"} or simple text',
    },
    { 
      key: 'affects_direct', 
      label: 'Apply (Direct)', 
      type: 'text', 
      placeholder: 'e.g., computed_fee1, computed_fee3' 
    },
    { 
      key: 'affects_inverse', 
      label: 'Apply (Inverse)', 
      type: 'text', 
      placeholder: 'e.g., computed_fee2' 
    }
  ];

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

  const renderField = (field) => (
    <div key={field.key} className="form-group">
      <label>
        {field.label}:
      </label>
      {field.type === 'select' ? (
        <select 
          value={policyFormData[field.key]} 
          onChange={(e) => updatePolicy(field.key, field.key === 'policy_group_id' ? parseInt(e.target.value) : e.target.value)}
        >
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          value={policyFormData[field.key]}
          onChange={(e) => updatePolicy(field.key, e.target.value)}
          placeholder={field.placeholder}
        />
      )}
    </div>
  );

  if (loading) {
    return <div className="loading">Loading policies...</div>;
  }

  return (
    <div className="policy-builder">
      <div className="builder-header">
        <h3>Policy Templates</h3>
        <div className="header-actions">
          <button 
              className="btn-secondary"
              onClick={() => setIsExpanded(!isExpanded)}
          >
              {isExpanded ? 'Collapse' : 'Expand'} Policies
          </button>
          <ActionButton 
            className="btn-secondary" 
            onClick={() => setIsManagingGroups(!isManagingGroups)}
          >
            {isManagingGroups ? 'Done Managing Groups' : 'Manage Groups'}
          </ActionButton>
          <ActionButton className="btn-primary" onClick={handleCreateNew}>
            + New Policy Template
          </ActionButton>
        </div>
      </div>

      <ErrorDisplay errors={errors} />

      {isExpanded && (
            <>
      {/* Group Management Section */}
      {isManagingGroups && (
        <div className="group-management">
          <h4>Policy Groups</h4>
          <div className="create-group">
            <input 
              type="text" 
              value={newGroupName} 
              onChange={(e) => setNewGroupName(e.target.value)} 
              placeholder="New group name" 
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()} 
            />
            <input 
              type="number" 
              value={newGroupPriority} 
              onChange={(e) => setNewGroupPriority(parseInt(e.target.value) || 0)} 
              placeholder="Priority" 
              min="0" 
            />
            <ActionButton 
              className="btn-primary" 
              onClick={handleCreateGroup} 
              disabled={!newGroupName.trim()}
            >
              Add Group
            </ActionButton>
          </div>
          <div className="groups-list">
            {policyGroups.map(group => (
              <div key={group.id} className="group-item">
                <span className="group-name">{group.name}</span>
                <span className="group-priority">Priority: {group.priority}</span>
                {group.id !== 1 && ( // Don't allow deleting the default "Ungrouped" group
                  <ActionButton 
                    className="btn-danger-small" 
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    Delete
                  </ActionButton>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Form */}
      {(isCreatingPolicy || editingPolicy) && (
        <div className="policy-form">
          <h4>{isCreatingPolicy ? 'Create New Policy Template' : 'Edit Policy Template'}</h4>
          <div className="policy-form-grid">
            {policyFields.map(renderField)}
          </div>
          <div className="form-actions">
            <ActionButton className="btn-secondary" onClick={handleCancel}>
              Cancel
            </ActionButton>
            <ActionButton 
              className="btn-primary" 
              onClick={isCreatingPolicy ? handleCreatePolicy : handleUpdatePolicy}
              disabled={!policyFormData.name.trim()}
            >
              {isCreatingPolicy ? 'Create Policy Template' : 'Update Policy Template'}
            </ActionButton>
          </div>
        </div>
      )}
      {/* Policies List */}
      <div className="policies-list">
        {getGroupedPolicies().map(group => (
          <div key={group.id} className="policy-group">
            <div className="group-header">
              <h5>{group.name}</h5>
              <span className="policy-count">
                ({group.policies.length} template{group.policies.length !== 1 ? 's' : ''})
              </span>
            </div>
            {group.policies.length === 0 ? (
              <p className="empty-state">No policy templates in this group</p>
            ) : (
              group.policies.map(policy => (
                <div key={policy.id} className="policy-item">
                  <div className="policy-content">
                    <h6>{policy.name}</h6>
                    <span className="policy-details">
                      {policy.type === 'reduce_percentage' 
                        ? `Reduce ${policy.field} by [value]%` 
                        : `Set ${policy.field} to [value]`}
                      {policy.condition && formatCondition(policy.condition) && (
                        <span className={`condition ${policy.condition._parseError ? 'condition-error' : ''}`}>
                          {' when '}{formatCondition(policy.condition)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="policy-actions">
                    <ActionButton 
                      className="btn-secondary-small" 
                      onClick={() => handleEditPolicy(policy)}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton 
                      className="btn-secondary-small" 
                      onClick={() => handleDuplicatePolicy(policy.id)}
                      title="Create a copy"
                    >
                      Copy
                    </ActionButton>
                    <ActionButton 
                      className="btn-danger-small" 
                      onClick={() => handleDeletePolicy(policy.id)}
                    >
                      Delete
                    </ActionButton>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
        {policies.length === 0 && (
          <div className="empty-state">
            <p>No policy templates created yet. Create your first policy template to get started.</p>
          </div>
        )}
      </div>
</>
)}
    </div>
  );
};

export default PolicyBuilder;
