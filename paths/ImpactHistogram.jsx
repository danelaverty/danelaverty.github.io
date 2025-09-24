import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const ImpactHistogram = ({ 
  selectedFeeId, 
  setSelectedFeeId, 
  computedFees, 
  groups, 
  resultsByPID,
  getComputedFeeName 
}) => {
  // Define histogram presets
  const HISTOGRAM_PRESETS = [
    { name: 'Default', underflow: -50, overflow: 50, bins: 10 },
    { name: 'Narrow Range', underflow: -10, overflow: 10, bins: 3 },
    { name: 'Positive Focus', underflow: -20, overflow: 50, bins: 2 }
  ];

  const [underflowThreshold, setUnderflowThreshold] = useState(-50);
  const [overflowThreshold, setOverflowThreshold] = useState(50);
  const [numberOfBins, setNumberOfBins] = useState(10);
  
  // Local state for input fields to avoid validation issues during typing
  const [underflowInput, setUnderflowInput] = useState('-50');
  const [overflowInput, setOverflowInput] = useState('50');
  const [binsInput, setBinsInput] = useState('10');

  // Get active computed fees marked for summary display only
  const getSummaryComputedFees = () => {
    if (!computedFees || !groups) return [];
    
    const activeSummary = computedFees.filter(fee => fee.active && fee.summary);
    
    return activeSummary.sort((a, b) => {
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

  // Calculate histogram data for selected computed fee
  const calculateHistogramData = () => {
    if (!selectedFeeId || !resultsByPID) return [];
    
    const impacts = [];
    
    // Calculate percentage impacts for all PIDs
        Object.keys(resultsByPID.pid_summaries || {}).forEach(pid => {
            const pidData = resultsByPID.pid_summaries[pid];

if (pidData) {
      const baseline = pidData.baseline;
      const final = pidData.final || baseline;
      const fieldKey = `total_computed_fee${selectedFeeId}`;
      
      const baselineValue = baseline[fieldKey] || 0;
      const finalValue = final[fieldKey] || 0;
      const delta = finalValue - baselineValue;
      const deltaPercent = baselineValue && Math.abs(baselineValue) > 0.01 
        ? ((delta / baselineValue) * 100) 
        : 0;
      
      impacts.push(deltaPercent);
    }
  });

    if (impacts.length === 0) return [];
    
    // Create bins
    const binWidth = (overflowThreshold - underflowThreshold) / numberOfBins;
    const binData = [];
    
    // Underflow bin
    binData.push({
      bin: `< ${underflowThreshold >= 0 ? '+' : ''}${underflowThreshold}%`,
      count: 0,
      isUnderflow: true
    });
    
    // Regular bins
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
    
    // Overflow bin
    binData.push({
      bin: `> ${overflowThreshold >= 0 ? '+' : ''}${overflowThreshold}%`,
      count: 0,
      isOverflow: true
    });
    
    // Count impacts into bins
    impacts.forEach(impact => {
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
    
    return binData;
  };

  // Auto-select first summary computed fee for histogram
  useEffect(() => {
    const summaryFees = getSummaryComputedFees();
    if (summaryFees.length > 0 && !selectedFeeId) {
      setSelectedFeeId(summaryFees[0].id);
    }
  }, [computedFees, groups, selectedFeeId, setSelectedFeeId]);

  // Handler function to apply a preset
  const applyPreset = (preset) => {
    setUnderflowThreshold(preset.underflow);
    setOverflowThreshold(preset.overflow);
    setNumberOfBins(preset.bins);
    setUnderflowInput(preset.underflow.toString());
    setOverflowInput(preset.overflow.toString());
    setBinsInput(preset.bins.toString());
  };

  // Handler functions for blur-based validation
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

  const histogramData = calculateHistogramData();

  return (
    <div className="impact-histogram-section">
      <div className="histogram-card">
        <h4>Impact Distribution</h4>
        
        <div className="histogram-controls">
        <div className="histogram-controls-row">
          <div className="control-group">
            <label>Computed Fee:</label>
            <select 
              className="histogram-select" 
              value={selectedFeeId || ''}
              onChange={(e) => setSelectedFeeId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select computed fee...</option>
              {getSummaryComputedFees().map(fee => (
                <option key={fee.id} value={fee.id}>
                  {getComputedFeeName(`computed_fee${fee.id}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Presets:</label>
            <div className="preset-buttons">
              {HISTOGRAM_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  className="preset-button btn-secondary-small"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          </div>
        <div className="histogram-controls-row">
          <div className="control-group">
            <label>Underflow Threshold:</label>
            <input 
              type="text" 
              className="histogram-input" 
              value={underflowInput}
              onChange={(e) => setUnderflowInput(e.target.value)}
              onBlur={handleUnderflowBlur}
            />
            <small className="input-unit">%</small>
          </div>
          
          <div className="control-group">
            <label>Overflow Threshold:</label>
            <input 
              type="text" 
              className="histogram-input" 
              value={overflowInput}
              onChange={(e) => setOverflowInput(e.target.value)}
              onBlur={handleOverflowBlur}
            />
            <small className="input-unit">%</small>
          </div>
          
          <div className="control-group">
            <label>Number of Bins:</label>
            <input 
              type="text" 
              className="histogram-input" 
              value={binsInput}
              onChange={(e) => setBinsInput(e.target.value)}
              onBlur={handleBinsBlur}
            />
          </div>
          </div>
        </div>
        
        {selectedFeeId && histogramData.length > 0 ? (
          <div className="histogram-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={histogramData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
                <XAxis 
                  dataKey="bin" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  axisLine={true}
                  tickLine={true}
                />
                <Tooltip 
                  formatter={(value, name) => [value, 'Producers']}
                  labelFormatter={(label) => `Range: ${label}`}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6"
                  stroke="#1d4ed8"
                  strokeWidth={1}
                >
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    fontSize={12}
                    fill="#374151"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="histogram-chart-placeholder">
            {selectedFeeId ? (
              <p>No data available for the selected computed fee</p>
            ) : (
              <p>Select a computed fee to view impact distribution</p>
            )}
            <div className="chart-dimensions">800px × 300px</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactHistogram;
