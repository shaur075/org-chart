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
  const [selectedLayout, setSelectedLayout] = useState('horizontal');

  // Viewport controls from React Flow
  const [viewportControls, setViewportControls] = useState(null);
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
        id,  // CRITICAL: pass id to data so onChange can use it
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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Org Chart Generator
            </h1>
            <p className="text-muted mt-1">
              Create, visualize, and export professional organization charts.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setShowHistory(true)} title="View History">
              <History size={18} /> History
            </button>
            <button className="btn btn-ghost text-sm" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
        </header>

        {/* History Modal */}
        {showHistory && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }} className="flex-center">
            <div className="card bg-white p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl" style={{ width: '500px', padding: '1.5rem' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chart History</h2>
                <button onClick={() => setShowHistory(false)} className="btn btn-ghost p-1">
                  <X size={20} />
                </button>
              </div>

              {historyItems.length === 0 ? (
                <p className="text-muted text-center py-8">No history yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {historyItems.map((item) => (
                    <div key={item.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div>
                        <div className="font-medium text-slate-800">{item.summary}</div>
                        <div className="text-xs text-muted flex items-center mt-1">
                          <Clock size={12} className="mr-1" />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Load</div>
                    </div>
                  ))}
                  <button
                    onClick={handleClearHistory}
                    className="btn w-full mt-4 text-red-600 hover:bg-red-50 border-red-100"
                    style={{ color: '#dc2626', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}
                  >
                    <Trash2 size={16} className="mr-2" /> Clear History
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
              <div className="glass-panel sticky top-4 z-50 mb-6 p-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold whitespace-nowrap">
                  Chart Loaded <span className="text-muted font-normal text-sm">({filteredData.length} employees)</span>
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-64">
                    <SearchBar data={filteredData} onSelect={(id) => setFocusNodeId(id)} />
                  </div>

                  <div className="h-8 w-px bg-slate-200 mx-1"></div>

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
                    {isDarkMode ? '☀️' : '🌙'}
                  </button>

                  <button
                    className={`btn ${showSalary ? 'bg-slate-100' : ''}`}
                    onClick={() => setShowSalary(prev => !prev)}
                    title={showSalary ? "Hide Salary" : "Show Salary"}
                  >
                    {showSalary ? 'Hide Salary' : 'Show Salary'}
                  </button>

                  {showSalary && (
                    <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      <span className="text-xs font-semibold text-slate-600">Cost %:</span>
                      <input
                        type="number"
                        value={loadedCostPercentage}
                        onChange={(e) => setLoadedCostPercentage(Number(e.target.value))}
                        className="w-16 h-7 text-sm px-1 py-0 border-slate-300"
                      />
                    </div>
                  )}

                  <div className="h-8 w-px bg-slate-200 mx-1"></div>

                  <button className="btn" onClick={() => setShowStats(true)}>
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
                  >
                    🔗 Share
                  </button>

                  {uniqueDepartments.length > 1 && (
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="h-9 border-slate-200 rounded-md text-sm min-w-[120px]"
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
                    getViewport={viewportControls?.getViewport}
                    setViewport={viewportControls?.setViewport}
                    fitView={viewportControls?.fitView}
                  />

                  <div className="h-8 w-px bg-slate-200 mx-1"></div>

                  <button className="btn" onClick={addTextNode}>+ Text</button>
                  <button className="btn" onClick={onEditClick}>Edit Data</button>
                  <button className="btn text-red-600 hover:bg-red-50" onClick={() => { setOrgData(null); setEditingData(null); }}>Reset</button>
                </div>
              </div>
              <div id="org-chart-container" className="glass-panel overflow-hidden h-[80vh] border border-slate-200 shadow-inner bg-slate-50/50" style={{ height: '80vh' }}>
                <OrgChartFlow
                  data={filteredData}
                  focusNodeId={focusNodeId}
                  direction={layoutDirection}
                  showSalary={showSalary}
                  loadedCostPercentage={loadedCostPercentage}
                  onViewportReady={setViewportControls}
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
