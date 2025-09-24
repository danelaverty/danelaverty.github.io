import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const ChartGallery = ({ computedFees, userDefinedNames }) => {
  const [savedHistograms, setSavedHistograms] = useState([]);
  const [savedGrids, setSavedGrids] = useState([]);
  const [selectedHistograms, setSelectedHistograms] = useState([]);
  const [currentGridId, setCurrentGridId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Grid display settings
  const [columns, setColumns] = useState(2);
  const [gridWidth, setGridWidth] = useState('100%');
  const [rowHeight, setRowHeight] = useState(250);
  
  // Global histogram settings
  const [underflowThreshold, setUnderflowThreshold] = useState(-50);
  const [overflowThreshold, setOverflowThreshold] = useState(50);
  const [numberOfBins, setNumberOfBins] = useState(10);
  
  // Input state for validation
  const [underflowInput, setUnderflowInput] = useState('-50');
  const [overflowInput, setOverflowInput] = useState('50');
  const [binsInput, setBinsInput] = useState('10');
  
  // Save dialog state
  const [showSaveGridDialog, setShowSaveGridDialog] = useState(false);
  const [gridSaveName, setGridSaveName] = useState('');
  
  // Hover state for reordering
  const [hoveredHistogramId, setHoveredHistogramId] = useState(null);
  
  // Toggle state for count vs percentage
  const [showPercentage, setShowPercentage] = useState(false);

  useEffect(() => {
    loadSavedHistograms();
    loadSavedGrids();
  }, []);

  const loadSavedHistograms = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/saved-histograms');
      if (response.ok) {
        const data = await response.json();
        setSavedHistograms(data);
      }
    } catch (error) {
      console.error('Error loading saved histograms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedGrids = async () => {
    try {
      const response = await fetch('/api/histogram-grids');
      if (response.ok) {
        const data = await response.json();
        setSavedGrids(data);
      }
    } catch (error) {
      console.error('Error loading saved grids:', error);
    }
  };

  const handleDeleteHistogram = async (id) => {
    if (!confirm('Delete this saved histogram?')) return;
    
    try {
      const response = await fetch(`/api/saved-histograms/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedHistograms(prev => prev.filter(h => h.id !== id));
        setSelectedHistograms(prev => prev.filter(hId => hId !== id));
      }
    } catch (error) {
      console.error('Error deleting histogram:', error);
    }
  };

  const handleDeleteGrid = async (id) => {
    if (!confirm('Delete this saved grid?')) return;
    
    try {
      const response = await fetch(`/api/histogram-grids/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedGrids(prev => prev.filter(g => g.id !== id));
        if (currentGridId === id) {
          setCurrentGridId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting grid:', error);
    }
  };

  const toggleHistogramSelection = (id) => {
    setSelectedHistograms(prev => 
      prev.includes(id) 
        ? prev.filter(hId => hId !== id)
        : [...prev, id]
    );
    setCurrentGridId(null); // Deselect grid when manually toggling
  };

  const loadGrid = (grid) => {
    setCurrentGridId(grid.id);
    setSelectedHistograms(grid.histogramIds);
    setColumns(grid.columns);
    setGridWidth(grid.gridWidth);
    setRowHeight(grid.rowHeight);
  };

  const handleSaveGrid = async () => {
    if (!gridSaveName.trim()) {
      alert('Please enter a name for the grid');
      return;
    }

    const payload = {
      name: gridSaveName.trim(),
      columns,
      gridWidth,
      rowHeight,
      histogramIds: selectedHistograms
    };

    try {
      const response = await fetch('/api/histogram-grids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newGrid = await response.json();
        setSavedGrids(prev => [newGrid, ...prev]);
        setShowSaveGridDialog(false);
        setGridSaveName('');
        setCurrentGridId(newGrid.id);
        alert('Grid saved successfully!');
      } else {
        alert('Failed to save grid');
      }
    } catch (error) {
      console.error('Error saving grid:', error);
      alert('Error saving grid');
    }
  };

  const moveHistogram = (id, direction) => {
    setSelectedHistograms(prev => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'left' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newOrder = [...prev];
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      return newOrder;
    });
    setCurrentGridId(null); // Mark grid as modified
  };

  const calculateHistogramData = (impactData) => {
    if (!impactData || impactData.length === 0) return [];
    
    const totalCount = impactData.length;
    const binWidth = (overflowThreshold - underflowThreshold) / numberOfBins;
    const binData = [];
    
    binData.push({
      bin: `< ${underflowThreshold >= 0 ? '+' : ''}${underflowThreshold}%`,
      count: 0,
      isUnderflow: true
    });
    
    for (let i = 0; i < numberOfBins; i++) {
      const binStart = underflowThreshold + (i * binWidth);
      const binEnd = underflowThreshold + ((i + 1) * binWidth);
      const startLabel = binStart >= 0 ? `+${binStart.toFixed(0)}` : binStart.toFixed(0);
      const endLabel = binEnd >= 0 ? `+${binEnd.toFixed(0)}` : binEnd.toFixed(0);
      binData.push({
        bin: `${startLabel}% to ${endLabel}%`,
        count: 0,
        binStart,
        binEnd
      });
    }
    
    binData.push({
      bin: `> ${overflowThreshold >= 0 ? '+' : ''}${overflowThreshold}%`,
      count: 0,
      isOverflow: true
    });
    
    impactData.forEach(impact => {
      if (impact < underflowThreshold) {
        binData[0].count++;
      } else if (impact > overflowThreshold) {
        binData[binData.length - 1].count++;
      } else {
        const binIndex = Math.floor((impact - underflowThreshold) / binWidth);
        const adjustedIndex = Math.min(Math.max(binIndex, 0), numberOfBins - 1) + 1;
        binData[adjustedIndex].count++;
      }
    });
    
    // Add percentage to each bin
    binData.forEach(bin => {
      bin.percentage = totalCount > 0 ? (bin.count / totalCount) * 100 : 0;
    });
    
    return binData;
  };

  const handleUnderflowBlur = () => {
    const value = parseFloat(underflowInput);
    if (!isNaN(value)) {
      setUnderflowThreshold(value);
    } else {
      setUnderflowInput(underflowThreshold.toString());
    }
  };

  const handleOverflowBlur = () => {
    const value = parseFloat(overflowInput);
    if (!isNaN(value)) {
      setOverflowThreshold(value);
    } else {
      setOverflowInput(overflowThreshold.toString());
    }
  };

  const handleBinsBlur = () => {
    const value = parseInt(binsInput);
    if (!isNaN(value) && value >= 1 && value <= 20) {
      setNumberOfBins(value);
    } else {
      setBinsInput(numberOfBins.toString());
    }
  };

  const selectedHistogramObjects = savedHistograms
    .filter(h => selectedHistograms.includes(h.id))
    .sort((a, b) => selectedHistograms.indexOf(a.id) - selectedHistograms.indexOf(b.id));

  return (
    <div className="chart-gallery">
      <div className="gallery-header">
        <h3>Chart Gallery</h3>
        <div className="gallery-controls">
          <button
            className="btn-secondary-small"
            onClick={() => setShowPercentage(!showPercentage)}
            style={{ marginRight: '16px' }}
          >
            {showPercentage ? 'Show Counts' : 'Show %'}
          </button>
          
          <div className="control-group">
            <label>Underflow:</label>
            <input 
              type="text" 
              value={underflowInput}
              onChange={(e) => setUnderflowInput(e.target.value)}
              onBlur={handleUnderflowBlur}
            />
            <small>%</small>
          </div>
          
          <div className="control-group">
            <label>Overflow:</label>
            <input 
              type="text" 
              value={overflowInput}
              onChange={(e) => setOverflowInput(e.target.value)}
              onBlur={handleOverflowBlur}
            />
            <small>%</small>
          </div>
          
          <div className="control-group">
            <label>Bins:</label>
            <input 
              type="text" 
              value={binsInput}
              onChange={(e) => setBinsInput(e.target.value)}
              onBlur={handleBinsBlur}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading saved histograms...</div>
      ) : (
        <>
          <div className="gallery-sidebar">
            <div className="histogram-list">
              <h4>Saved Histograms</h4>
              {savedHistograms.length === 0 ? (
                <div className="empty-state-small">
                  <p>No saved histograms yet.</p>
                </div>
              ) : (
                savedHistograms.map(histogram => (
                  <div 
                    key={histogram.id} 
                    className={`histogram-list-item ${selectedHistograms.includes(histogram.id) ? 'selected' : ''}`}
                    onClick={() => toggleHistogramSelection(histogram.id)}
                  >
                    <div className="histogram-info">
                      <h5>{histogram.name}</h5>
                      <div className="histogram-meta">
                        <span className="meta-item">{histogram.scenario_name}</span>
                        <span className="meta-item">{histogram.computed_fee_name}</span>
                      </div>
                    </div>
                    <button 
                      className="btn-danger-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistogram(histogram.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="grid-list">
              <h4>Saved Grids</h4>
              {savedGrids.length === 0 ? (
                <div className="empty-state-small">
                  <p>No saved grids yet.</p>
                </div>
              ) : (
                savedGrids.map(grid => (
                  <div 
                    key={grid.id} 
                    className={`grid-list-item ${currentGridId === grid.id ? 'active' : ''}`}
                  >
                    <div className="grid-info" onClick={() => loadGrid(grid)}>
                      <h5>{grid.name}</h5>
                      <small>{grid.histogramIds.length} charts</small>
                    </div>
                    <button 
                      className="btn-danger-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGrid(grid.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="gallery-main">
            {selectedHistogramObjects.length > 0 && (
              <>
                <div className="grid-controls">
                  <div className="control-group">
                    <label>Columns:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="6" 
                      value={columns}
                      onChange={(e) => {
                        setColumns(parseInt(e.target.value) || 1);
                        setCurrentGridId(null);
                      }}
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>Grid Width:</label>
                    <input 
                      type="text" 
                      value={gridWidth}
                      onChange={(e) => {
                        setGridWidth(e.target.value);
                        setCurrentGridId(null);
                      }}
                      placeholder="100%"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>Row Height:</label>
                    <input 
                      type="number" 
                      min="150" 
                      max="600" 
                      value={rowHeight}
                      onChange={(e) => {
                        setRowHeight(parseInt(e.target.value) || 250);
                        setCurrentGridId(null);
                      }}
                    />
                    <small>px</small>
                  </div>
                  
                  <button 
                    className="btn-primary"
                    onClick={() => setShowSaveGridDialog(true)}
                  >
                    Save Gallery Set
                  </button>
                </div>

                {showSaveGridDialog && (
                  <div className="save-dialog">
                    <input
                      type="text"
                      placeholder="Enter grid name..."
                      value={gridSaveName}
                      onChange={(e) => setGridSaveName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveGrid()}
                    />
                    <button className="btn-primary-small" onClick={handleSaveGrid}>
                      Save
                    </button>
                    <button className="btn-secondary-small" onClick={() => {
                      setShowSaveGridDialog(false);
                      setGridSaveName('');
                    }}>
                      Cancel
                    </button>
                  </div>
                )}

                <div 
                  className="histogram-grid"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    width: gridWidth
                  }}
                >
                  {selectedHistogramObjects.map((histogram, index) => {
                    const histogramData = calculateHistogramData(histogram.impact_data);
                    const isHovered = hoveredHistogramId === histogram.id;
                    
                    return (
                      <div 
                        key={histogram.id} 
                        className="histogram-grid-item"
                        onMouseEnter={() => setHoveredHistogramId(histogram.id)}
                        onMouseLeave={() => setHoveredHistogramId(null)}
                      >
                        {isHovered && (
                          <div className="reorder-controls">
                            {index > 0 && (
                              <button 
                                className="reorder-btn"
                                onClick={() => moveHistogram(histogram.id, 'left')}
                                title="Move left"
                              >
                                ◀
                              </button>
                            )}
                            {index < selectedHistogramObjects.length - 1 && (
                              <button 
                                className="reorder-btn"
                                onClick={() => moveHistogram(histogram.id, 'right')}
                                title="Move right"
                              >
                                ▶
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div className="grid-item-header">
                          <h5>{histogram.name}</h5>
                          <small>{histogram.scenario_name} - {histogram.computed_fee_name}</small>
                        </div>
                        
                        <ResponsiveContainer width="100%" height={rowHeight}>
                          <BarChart data={histogramData} margin={{ top: 30, right: 10, left: 10, bottom: 50 }}>
                            <XAxis 
                              dataKey="bin" 
                              angle={-45}
                              textAnchor="end"
                              height={60}
                              fontSize={10}
                            />
                            <Tooltip 
                              formatter={(value) => {
                                if (showPercentage) {
                                  return [value.toFixed(1) + '%', 'Percentage'];
                                }
                                return [value, 'Producers'];
                              }}
                              labelFormatter={(label) => `Range: ${label}`}
                            />
                            <Bar 
                              dataKey={showPercentage ? "percentage" : "count"}
                              fill="#3b82f6"
                              stroke="#1d4ed8"
                              strokeWidth={1}
                            >
                              <LabelList 
                                dataKey={showPercentage ? "percentage" : "count"}
                                position="top" 
                                fontSize={10}
                                formatter={(value) => showPercentage ? value.toFixed(1) + '%' : value}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            
            {selectedHistogramObjects.length === 0 && (
              <div className="empty-state">
                <p>Select histograms from the sidebar to display them in the gallery.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export { ChartGallery };
