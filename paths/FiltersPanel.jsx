import React from 'react';

const FiltersPanel = ({ 
  filters, 
  onFiltersChange, 
  filterOptions, 
  userDefinedNames,
  error 
}) => {
  const handleFilterChange = (filterKey, value) => {
    onFiltersChange(prev => ({ ...prev, [filterKey]: value }));
  };
    console.log(filterOptions);

  // Helper function to get user-defined name for a column
  const getUserDefinedName = (actualName) => {
    if (!userDefinedNames) return actualName;
    const nameObj = userDefinedNames.find(n => n.actual_name === actualName);
    return nameObj ? nameObj.user_defined_name : actualName;
  };

  return (
    <div className="filters-section">
      <div className="filters-panel">
        <h3>Filters</h3>
        {error ? (
          <div className="api-error-placeholder">
            <strong>FILTERS UNAVAILABLE: {error}</strong>
          </div>
        ) : (
          <div className="filters-grid">
<div className="filter-group">
              <label>Type:</label>
              <select 
                value={filters.type || ''} 
                onChange={(e) => handleFilterChange('type', e.target.value)}
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
                value={filters.subtype || ''} 
                onChange={(e) => handleFilterChange('subtype', e.target.value)}
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
                value={filters.attr1 || ''} 
                onChange={(e) => handleFilterChange('attr1', e.target.value)}
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
                value={filters.attr2 || ''} 
                onChange={(e) => handleFilterChange('attr2', e.target.value)}
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
                value={filters.attr3 || ''} 
                onChange={(e) => handleFilterChange('attr3', e.target.value)}
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
                value={filters.attr4 || ''} 
                onChange={(e) => handleFilterChange('attr4', e.target.value)}
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
                value={filters.attr5 || ''} 
                onChange={(e) => handleFilterChange('attr5', e.target.value)}
              >
                <option value="">All</option>
                {filterOptions.attr5?.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltersPanel;
