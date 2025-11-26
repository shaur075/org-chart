import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    addEdge,
    Panel,
    ReactFlowProvider,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import CustomNode from './CustomNode';

const nodeWidth = 250;
const nodeHeight = 160; // Increased height for salary

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        // Calculate dynamic height based on data
        // Base height 160px (covers avatar, name, role, band, function, salary)
        // If salary is hidden, reduce height by approx 20px
        const baseHeight = node.data.showSalary ? 160 : 140;

        // Each custom field adds approx 20px
        const standardKeys = ['name', 'designation', 'band', 'function', 'salary', 'parentId', 'id', 'rawSupervisorId', 'rawSupervisorName', 'reportingType', 'type', 'showSalary'];
        const customFields = Object.entries(node.data).filter(([key, value]) =>
            !standardKeys.includes(key) && value
        );
        const dynamicHeight = baseHeight + (customFields.length * 20);

        dagreGraph.setNode(node.id, { width: nodeWidth, height: dynamicHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'LR' ? 'left' : 'top';
        node.sourcePosition = direction === 'LR' ? 'right' : 'bottom';

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        // We need to use the SAME height we calculated for the graph
        const baseHeight = node.data.showSalary ? 160 : 140;
        const standardKeys = ['name', 'designation', 'band', 'function', 'salary', 'parentId', 'id', 'rawSupervisorId', 'rawSupervisorName', 'reportingType', 'type', 'showSalary'];
        const customFields = Object.entries(node.data).filter(([key, value]) =>
            !standardKeys.includes(key) && value
        );
        const dynamicHeight = baseHeight + (customFields.length * 20);

        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - dynamicHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

const nodeTypes = {
    custom: CustomNode,
};

const OrgChartInner = (props) => {
    const { data, onLayoutChange, focusNodeId, direction = 'TB' } = props;
    const { setCenter, fitView } = useReactFlow();

    // Transform flat data to React Flow nodes and edges
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        if (!data) return { nodes: [], edges: [] };

        const nodes = data.map((emp) => ({
            id: emp.id,
            type: 'custom',
            data: {
                ...emp, // Pass all properties
                name: emp.name,
                designation: emp.designation,
                band: emp.band,
                function: emp.function,
                salary: emp.salary,
                showSalary: props.showSalary
            },
            position: { x: 0, y: 0 }, // Initial position, will be set by dagre
        }));

        const edges = data
            .filter((emp) => emp.parentId) // Only create edges for nodes with parents
            .map((emp) => ({
                id: `e${emp.parentId}-${emp.id}`,
                source: emp.parentId,
                target: emp.id,
                type: 'smoothstep',
                animated: emp.reportingType === 'Dotted',
                style: {
                    stroke: emp.reportingType === 'Dotted' ? '#666' : '#000',
                    strokeWidth: 2,
                    strokeDasharray: emp.reportingType === 'Dotted' ? '5,5' : '0'
                },
            }));

        return getLayoutedElements(nodes, edges, direction);
    }, [data, direction, props.showSalary]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update layout when data changes
    useEffect(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges,
            direction
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);

        if (onLayoutChange) {
            onLayoutChange(layoutedNodes, layoutedEdges);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges, onLayoutChange, direction]);

    // Handle Focus Node
    useEffect(() => {
        if (focusNodeId && nodes.length > 0) {
            const node = nodes.find(n => n.id === focusNodeId);
            if (node) {
                // Center the view on the node
                const x = node.position.x + nodeWidth / 2;
                const y = node.position.y + nodeHeight / 2;
                const zoom = 1.2;

                setCenter(x, y, { zoom, duration: 1000 });

                // Highlight the node (optional: could add a class or style)
                setNodes(nds => {
                    // Check if update is strictly needed to avoid infinite loop
                    const needsUpdate = nds.some(n => (n.id === focusNodeId && !n.selected) || (n.id !== focusNodeId && n.selected));
                    if (!needsUpdate) return nds;

                    return nds.map(n => ({
                        ...n,
                        selected: n.id === focusNodeId
                    }));
                });
            }
        }
    }, [focusNodeId, nodes, setCenter, setNodes]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodeDragStop = useCallback((event, node) => {
        // Check if dropped on another node
        // We need to find if the dragged node overlaps with any other node
        const draggedNodeRect = {
            x: node.position.x,
            y: node.position.y,
            width: nodeWidth,
            height: nodeHeight
        };

        const targetNode = nodes.find(n => {
            if (n.id === node.id) return false; // Don't check against self

            // Calculate dynamic height for target node
            const baseHeight = n.data.showSalary ? 160 : 140;
            const standardKeys = ['name', 'designation', 'band', 'function', 'salary', 'parentId', 'id', 'rawSupervisorId', 'rawSupervisorName', 'reportingType', 'type', 'showSalary'];
            const customFields = Object.entries(n.data).filter(([key, value]) =>
                !standardKeys.includes(key) && value
            );
            const targetHeight = baseHeight + (customFields.length * 20);

            const nRect = {
                x: n.position.x,
                y: n.position.y,
                width: nodeWidth,
                height: targetHeight
            };

            // Simple AABB collision detection
            return (
                draggedNodeRect.x < nRect.x + nRect.width &&
                draggedNodeRect.x + draggedNodeRect.width > nRect.x &&
                draggedNodeRect.y < nRect.y + nRect.height &&
                draggedNodeRect.y + draggedNodeRect.height > nRect.y
            );
        });

        if (targetNode) {
            const confirmChange = window.confirm(`Do you want to change supervisor of ${node.data.name} to ${targetNode.data.name}?`);
            if (confirmChange && props.onParentChange) {
                props.onParentChange(node.id, targetNode.id);
            } else {
                // Revert position (simple way is to trigger a re-layout or just let React Flow handle it next render)
                // Ideally we snap back. For now, the next render from props change will fix it.
            }
        }
    }, [nodes, props.onParentChange]);

    // Calculate costs
    const costs = useMemo(() => {
        if (!props.showSalary) return null;

        let totalMonthlyAsIs = 0;
        let totalMonthlyOptimized = 0;
        let hasRedundancy = false;

        nodes.forEach(node => {
            const salaryStr = node.data.salary;
            let monthlyAmount = 0;

            if (salaryStr) {
                // Remove currency symbols and commas
                let cleanStr = salaryStr.toString().replace(/[$,]/g, '').toLowerCase();
                let multiplier = 1;

                if (cleanStr.includes('k')) {
                    multiplier = 1000;
                    cleanStr = cleanStr.replace('k', '');
                }

                const amount = parseFloat(cleanStr);
                if (!isNaN(amount)) {
                    // Assume input is Monthly as per previous fix
                    monthlyAmount = amount * multiplier;
                }
            }

            totalMonthlyAsIs += monthlyAmount;

            const isRedundant = node.data.redundant && (node.data.redundant.toString().toUpperCase() === 'Y' || node.data.redundant.toString().toUpperCase() === 'YES');
            if (isRedundant) {
                hasRedundancy = true;
            } else {
                totalMonthlyOptimized += monthlyAmount;
            }
        });

        const calculateMetrics = (monthly) => {
            const annual = monthly * 12;
            const loadedPercentage = props.loadedCostPercentage || 125;
            const fullyLoaded = annual * (loadedPercentage / 100);
            return { monthly, annual, fullyLoaded };
        };

        return {
            asIs: calculateMetrics(totalMonthlyAsIs),
            optimized: calculateMetrics(totalMonthlyOptimized),
            hasRedundancy
        };
    }, [nodes, props.showSalary, props.loadedCostPercentage]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{ width: '100%', height: '80vh', background: '#f0f2f5' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                nodesDraggable={true}
                fitView
                fitViewOptions={{ padding: 0.2 }}
            >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
                <Panel position="top-right" className="instruction-panel">
                    <div style={{ background: 'rgba(255,255,255,0.8)', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' }}>
                        Scroll to Zoom • Drag to Pan • Drag Node to Change Supervisor
                    </div>
                </Panel>
                {props.showSalary && costs && (
                    <Panel position="top-left">
                        <div style={{
                            background: 'var(--color-surface)',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            minWidth: costs.hasRedundancy ? '400px' : '250px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', paddingBottom: '5px' }}>
                                Cost Analysis
                            </h3>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                {/* As-Is Column */}
                                <div style={{ flex: 1 }}>
                                    {costs.hasRedundancy && <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', textDecoration: 'underline' }}>As-Is</div>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Monthly:</span>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{formatCurrency(costs.asIs.monthly)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Annual:</span>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'green' }}>{formatCurrency(costs.asIs.annual)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: '4px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Fully Loaded:</span>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'blue' }}>{formatCurrency(costs.asIs.fullyLoaded)}</span>
                                    </div>
                                </div>

                                {/* Optimized Column (only if redundancy exists) */}
                                {costs.hasRedundancy && (
                                    <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', textDecoration: 'underline', color: 'green' }}>Excl. Redundant</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Monthly:</span>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{formatCurrency(costs.optimized.monthly)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Annual:</span>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'green' }}>{formatCurrency(costs.optimized.annual)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: '4px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Fully Loaded:</span>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'blue' }}>{formatCurrency(costs.optimized.fullyLoaded)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
};

const OrgChartFlow = (props) => {
    return (
        <ReactFlowProvider>
            <OrgChartInner {...props} />
        </ReactFlowProvider>
    );
};

export default OrgChartFlow;
