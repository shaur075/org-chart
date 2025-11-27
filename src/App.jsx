import React, { useState, useEffect, useMemo } from 'react';
import DataInput from './components/DataInput';
import OrgChartFlow from './components/OrgChartFlow';
import ExportControls from './components/ExportControls';
import ErrorBoundary from './components/ErrorBoundary';
import SearchBar from './components/SearchBar';
import StatsDashboard from './components/StatsDashboard';
import { saveChartToHistory, getHistory, clearHistory } from './utils/HistoryService';
import { History, Clock, Trash2, X } from 'lucide-react';
import './App.css';

import { generateShareLink, getSharedData } from './utils/shareUtils';

function App() {
  const [orgData, setOrgData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [currentNodes, setCurrentNodes] = useState([]);
  const [currentEdges, setCurrentEdges] = useState([]);
  const [focusNodeId, setFocusNodeId] = useState(null);
  const [layoutDirection, setLayoutDirection] = useState('TB'); // 'TB' (Top-Bottom) or 'LR' (Left-Right)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [showStats, setShowStats] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [loadedCostPercentage, setLoadedCostPercentage] = useState(125);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Check for shared data on load
  useEffect(() => {
    const shared = getSharedData();
    if (shared) {
      setOrgData(shared);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Extract unique departments
  const uniqueDepartments = useMemo(() => {
    if (!orgData) return [];
    const depts = new Set(orgData.map(d => d.function).filter(Boolean));
    return ['All', ...Array.from(depts).sort()];
  }, [orgData]);

  // Filter data based on selection
  const filteredData = useMemo(() => {
    if (!orgData) return null;
    if (selectedDepartment === 'All') return orgData;

    // 1. Find all nodes in the selected department
    const deptNodes = orgData.filter(d => d.function === selectedDepartment);

    // 2. We also need to include the hierarchy path (parents) so they aren't floating
    // But for a "Focus" view, maybe we just show the sub-tree? 
    // Or we show the whole tree but gray out others?
    // Let's try to show the sub-tree + root path.

    const nodesToKeep = new Set(deptNodes.map(d => d.id));

    // Add parents recursively
    deptNodes.forEach(node => {
      let current = node;
      while (current && current.parentId) {
        nodesToKeep.add(current.parentId);
        current = orgData.find(d => d.id === current.parentId);
      }
    });

    return orgData.filter(d => nodesToKeep.has(d.id));
  }, [orgData, selectedDepartment]);

  // Better approach:
  // When we click edit, we set a flag or just pass the data.
  // Since the render logic is `!orgData ? <DataInput /> : <Chart />`
  // We can't easily pass orgData to DataInput if orgData is null.
  // So let's use a ref or a separate state for "editingData".

  const [editingData, setEditingData] = useState(null);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    setHistoryItems(getHistory());
  }, []);

  const handleDataLoaded = (data) => {
    console.log("Data loaded:", data);
    setOrgData(data);
    const updatedHistory = saveChartToHistory(data);
    setHistoryItems(updatedHistory);
  };

  const loadFromHistory = (item) => {
    setOrgData(item.data);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearHistory();
      setHistoryItems([]);
    }
  };

  const onEditClick = () => {
    setEditingData(orgData);
    setOrgData(null);
  };

  const handleParentChange = (childId, newParentId) => {
    if (!orgData) return;

    // Prevent cycles (simple check: new parent cannot be the child itself)
    if (childId === newParentId) return;

    // Deep cycle check would be better, but for now let's rely on visual feedback or basic check
    // Update data
    const newData = orgData.map(emp => {
      if (emp.id === childId) {
        // Find new parent name for consistency if needed, though we mostly use IDs
        const newParent = orgData.find(p => p.id === newParentId);
        return {
          ...emp,
          parentId: newParentId,
          rawSupervisorId: newParentId,
          rawSupervisorName: newParent ? newParent.name : emp.rawSupervisorName
        };
      }
      return emp;
    });

    setOrgData(newData);
    const updatedHistory = saveChartToHistory(newData);
    setHistoryItems(updatedHistory);
  };

  // Text Nodes State
  const [textNodes, setTextNodes] = useState([]);

  const addTextNode = () => {
    const id = `text-${Date.now()}`;
    const newNode = {
      id,
      type: 'text',
      position: { x: 500, y: -100 },
      data: {
        text: 'New Text Note',
        fontSize: '24px',
        fontFamily: 'Arial',
        onChange: (id, updates) => updateTextNode(id, updates)
      },
    };
    setTextNodes((nds) => [...nds, newNode]);
  };

  const updateTextNode = (id, updates) => {
    setTextNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, ...updates } };
      }
      return n;
    }));
  };

  const handleNodeDataChange = (nodeId, field, value) => {
    if (!orgData) return;

    const newData = orgData.map(emp => {
      if (emp.id === nodeId) {
        return { ...emp, [field]: value };
      }
      return emp;
    });

    setOrgData(newData);
    // Debounce history save? For now, save on every change might be too much if typing. 
    // But since we use onBlur in CustomNode (planned), it's fine.
    const updatedHistory = saveChartToHistory(newData);
    setHistoryItems(updatedHistory);
  };

  return (
    <ErrorBoundary>
      <div className="container">
        <header className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                Org Chart Generator
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
                Create, visualize, and export professional organization charts.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" onClick={() => setShowHistory(true)} title="View History">
                <History size={16} style={{ marginRight: '5px' }} /> History
              </button>
              <button className="btn" onClick={() => setShowDebug(!showDebug)} style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
            </div>
          </div>
        </header>

        {/* History Modal */}
        {showHistory && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
            <div className="glass-panel" style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '20px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Chart History</h2>
                <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              {historyItems.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center' }}>No history yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historyItems.map((item) => (
                    <div key={item.id} style={{
                      padding: '15px', border: '1px solid #eee', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'background 0.2s'
                    }}
                      onClick={() => loadFromHistory(item)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{item.summary}</div>
                        <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                          <Clock size={12} style={{ marginRight: '4px' }} />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'blue' }}>Load</div>
                    </div>
                  ))}
                  <button
                    onClick={handleClearHistory}
                    style={{
                      marginTop: '10px', padding: '10px', border: '1px solid #fee2e2',
                      background: '#fef2f2', color: '#dc2626', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} style={{ marginRight: '5px' }} /> Clear History
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showDebug && orgData && (
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', overflowX: 'auto' }}>
            <h3>Debug Data View</h3>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th>ID</th>
                  <th>Name</th>
                  <th>ParentID</th>
                  <th>Designation</th>
                </tr>
              </thead>
              <tbody>
                {orgData.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td>{d.id}</td>
                    <td>{d.name}</td>
                    <td style={{ color: d.parentId ? 'black' : 'red' }}>{d.parentId || '(ROOT)'}</td>
                    <td>{d.designation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <main>
          {!orgData ? (
            <DataInput onDataLoaded={handleDataLoaded} initialData={editingData} />
          ) : (
            <>
              <div className="glass-panel" style={{
                marginBottom: 'var(--spacing-lg)',
                padding: 'var(--spacing-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: '10px',
                zIndex: 100,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)'
              }}>
                <h2 style={{ margin: 0 }}>Chart Loaded ({filteredData.length} employees)</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <SearchBar data={filteredData} onSelect={(id) => setFocusNodeId(id)} />

                  <button
                    className="btn"
                    onClick={() => setLayoutDirection(prev => prev === 'TB' ? 'LR' : 'TB')}
                    title="Toggle Layout"
                  >
                    {layoutDirection === 'TB' ? '↕️ Vertical' : '↔️ Horizontal'}
                  </button>

                  <button
                    className="btn"
                    onClick={() => setIsDarkMode(prev => !prev)}
                    title="Toggle Dark Mode"
                  >
                    {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                  </button>

                  <button
                    className="btn"
                    onClick={() => setShowSalary(prev => !prev)}
                    title={showSalary ? "Hide Salary" : "Show Salary"}
                  >
                    {showSalary ? '👁️ Hide Salary' : '👁️ Show Salary'}
                  </button>

                  {showSalary && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.05)', padding: '5px 10px', borderRadius: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Loaded Cost %:</span>
                      <input
                        type="number"
                        value={loadedCostPercentage}
                        onChange={(e) => setLoadedCostPercentage(Number(e.target.value))}
                        style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </div>
                  )}

                  <button
                    className="btn"
                    onClick={() => setShowStats(true)}
                    title="View Statistics"
                  >
                    📊 Stats
                  </button>

                  <button
                    className="btn"
                    onClick={() => {
                      const url = generateShareLink(orgData);
                      if (url) {
                        navigator.clipboard.writeText(url);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    title="Share Chart"
                  >
                    🔗 Share
                  </button>

                  {uniqueDepartments.length > 1 && (
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="btn"
                      style={{ paddingRight: '25px' }}
                    >
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  )}

                  <ExportControls
                    data={filteredData}
                    chartId="org-chart-container"
                    nodes={currentNodes}
                    edges={currentEdges}
                  />
                  <button className="btn" onClick={addTextNode}>Add Text</button>
                  <button className="btn" onClick={onEditClick}>Edit Data</button>
                  <button className="btn" onClick={() => { setOrgData(null); setEditingData(null); }}>Reset / New Chart</button>
                </div>
              </div>
              <div id="org-chart-container" className="glass-panel" style={{ padding: 'var(--spacing-md)', overflow: 'hidden', height: '80vh' }}>
                <OrgChartFlow
                  data={filteredData}
                  focusNodeId={focusNodeId}
                  direction={layoutDirection}
                  showSalary={showSalary}
                  loadedCostPercentage={loadedCostPercentage}
                  textNodes={textNodes}
                  onParentChange={handleParentChange}
                  onNodeDataChange={handleNodeDataChange}
                  onLayoutChange={(nodes, edges) => {
                    setCurrentNodes(nodes);
                    setCurrentEdges(edges);
                  }}
                />
              </div>
              {showStats && (
                <StatsDashboard
                  data={filteredData}
                  onClose={() => setShowStats(false)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
