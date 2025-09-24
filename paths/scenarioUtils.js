// Utility functions shared across scenario components

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value || 0);
};

export const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

// Helper function to format policy name with value
export const formatPolicyNameWithValue = (policyName, policyData, formatCurrency) => {
  if (!policyData) return policyName;
  
  if (policyData.type == 'set_value') {
    return `${policyName} (${formatCurrency(policyData.value)})`;
  }
  
  if (policyData.type == 'reduce_percentage') {
    return `${policyName} (-${policyData.value}%)`;
  }
  
  return policyName;
};

// Helper function to get user-defined name for a column
export const getUserDefinedName = (actualName, userDefinedNames) => {
  if (!userDefinedNames) return actualName;
  const nameObj = userDefinedNames.find(n => n.actual_name === actualName);
  return nameObj ? nameObj.user_defined_name : actualName;
};

// Get computed fee names for display - prioritize user-defined names
export const getComputedFeeName = (fieldName, computedFees, userDefinedNames) => {
  if (fieldName && fieldName.startsWith('computed_fee')) {
    const feeId = fieldName.replace('computed_fee', '');
    const fee = computedFees?.find(f => f.id.toString() === feeId);
    if (fee) {
      const userDefinedName = getUserDefinedName('computed_fee' + fee.id, userDefinedNames);
      return userDefinedName !== fee.name ? userDefinedName : fee.name;
    }
  }
  
  const userDefinedName = getUserDefinedName(fieldName, userDefinedNames);
  if (userDefinedName !== fieldName) {
    return userDefinedName;
  }
  
  const fee = computedFees?.find(f => f.field === fieldName);
  return fee ? fee.name : fieldName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get regular fee name
export const getRegularFeeName = (fieldName, userDefinedNames) => {
  const userDefinedName = getUserDefinedName(fieldName, userDefinedNames);
  return userDefinedName !== fieldName ? userDefinedName : fieldName.replace('fee', 'Fee ');
};

// Hardcoded color scheme for groups
export const getGroupColors = () => [
  { primary: '#3b82f6', light: '#dbeafe' }, // blue
  { primary: '#f97316', light: '#fed7aa' }, // orange  
  { primary: '#22c55e', light: '#dcfce7' }, // green
  { primary: '#d2b48c', light: '#f5f0e6' }, // tan
  { primary: '#a855f7', light: '#f3e8ff' }, // lavender/purple
  { primary: '#14b8a6', light: '#ccfbf1' }, // teal
  { primary: '#eab308', light: '#fef3c7' }, // yellow
  { primary: '#ec4899', light: '#fce7f3' }  // pink
];

// Get active computed fees sorted by group priority, then fee priority
export const getActiveComputedFees = (computedFees, groups) => {
  if (!computedFees || !groups) return [];
  
  const active = computedFees.filter(fee => fee.active);
  
  return active.sort((a, b) => {
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

// Get regular fees (fee1 through fee17)
export const getRegularFees = () => {
  const fees = [];
  for (let i = 1; i <= 17; i++) {
    fees.push(`fee${i}`);
  }
  return fees;
};

// Get fees to display based on toggle
export const getFeesToDisplay = (showAllFees, computedFees, groups) => {
  const regularFees = getRegularFees();
  const activeComputedFees = getActiveComputedFees(computedFees, groups);
  
  if (showAllFees) {
    return [
      ...regularFees.map(fee => ({ field: fee, type: 'regular' })),
      ...activeComputedFees.map(fee => ({ 
        field: `computed_fee${fee.id}`,
        type: 'computed', 
        feeData: fee 
      }))
    ];
  } else {
    return activeComputedFees.map(fee => ({ 
      field: `computed_fee${fee.id}`,
      type: 'computed', 
      feeData: fee 
    }));
  }
};

// Group computed fees by group for header generation
export const getGroupedComputedFees = (showAllFees, computedFees, groups) => {
  const feesToDisplay = getFeesToDisplay(showAllFees, computedFees, groups);
  const computedFeesOnly = feesToDisplay.filter(fee => fee.type === 'computed');
  const colors = getGroupColors();
  
  if (!computedFeesOnly.length || !groups.length) {
    return [];
  }
  
  const grouped = {};
  
  computedFeesOnly.forEach(fee => {
    const groupId = fee.feeData.computed_fee_group_id || 1;
    if (!grouped[groupId]) {
      const group = groups.find(g => g.id === groupId);
      grouped[groupId] = {
        id: groupId,
        name: group ? group.name : 'Ungrouped',
        priority: group ? (group.priority || 0) : 999,
        fees: []
      };
    }
    grouped[groupId].fees.push(fee);
  });
  
  const sortedGroups = Object.values(grouped).sort((a, b) => a.priority - b.priority);
  
  return sortedGroups.map((group, index) => ({
    ...group,
    color: colors[index % colors.length] || { primary: '#6b7280', light: '#f3f4f6' }
  }));
};

// Group scenario policies by policy group for table display
export const getGroupedPolicies = (scenario, policyGroups) => {
  if (!scenario || !scenario.policies || !policyGroups.length) {
    return [];
  }

  const grouped = {};
  
  scenario.policies.forEach(policy => {
    const groupId = policy.policy_group_id || 1;
    if (!grouped[groupId]) {
      const group = policyGroups.find(g => g.id === groupId);
      grouped[groupId] = {
        id: groupId,
        name: group ? group.name : 'Ungrouped',
        priority: group ? (group.priority || 0) : 999,
        policies: []
      };
    }
    grouped[groupId].policies.push(policy);
  });
  
  // Sort groups by priority
  return Object.values(grouped).sort((a, b) => {
    if (a.id === 1) return -1; // Ungrouped first
    if (b.id === 1) return 1;
    return a.priority - b.priority;
  });
};
