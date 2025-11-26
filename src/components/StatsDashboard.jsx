import React, { useMemo } from 'react';
import { X, BarChart2, Users, Layers, TrendingUp } from 'lucide-react';

const StatsDashboard = ({ data, onClose }) => {
    const stats = useMemo(() => {
        if (!data || data.length === 0) return null;

        // 1. Total Headcount
        const totalHeadcount = data.length;

        // 2. Department Breakdown
        const departments = {};
        data.forEach(emp => {
            const dept = emp.function || 'Unassigned';
            departments[dept] = (departments[dept] || 0) + 1;
        });
        const sortedDepartments = Object.entries(departments)
            .sort((a, b) => b[1] - a[1]);

        // 3. Span of Control (Average Direct Reports)
        const managerCounts = {};
        data.forEach(emp => {
            if (emp.parentId) {
                managerCounts[emp.parentId] = (managerCounts[emp.parentId] || 0) + 1;
            }
        });
        const managerIds = Object.keys(managerCounts);
        const totalReports = Object.values(managerCounts).reduce((a, b) => a + b, 0);
        const avgSpan = managerIds.length > 0 ? (totalReports / managerIds.length).toFixed(1) : 0;

        // 4. Hierarchy Depth
        // Build adjacency list
        const adj = {};
        data.forEach(emp => {
            if (emp.parentId) {
                if (!adj[emp.parentId]) adj[emp.parentId] = [];
                adj[emp.parentId].push(emp.id);
            }
        });

        // Find root(s)
        const roots = data.filter(emp => !emp.parentId);

        // BFS to find max depth
        let maxDepth = 0;
        if (roots.length > 0) {
            const queue = roots.map(r => ({ id: r.id, depth: 1 }));
            while (queue.length > 0) {
                const { id, depth } = queue.shift();
                maxDepth = Math.max(maxDepth, depth);
                if (adj[id]) {
                    adj[id].forEach(childId => {
                        queue.push({ id: childId, depth: depth + 1 });
                    });
                }
            }
        }

        return {
            totalHeadcount,
            departments: sortedDepartments,
            avgSpan,
            maxDepth
        };
    }, [data]);

    if (!stats) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="glass-panel" style={{
                width: '600px',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: '25px',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                        <BarChart2 size={24} style={{ marginRight: '10px', color: 'var(--color-primary)' }} />
                        Chart Insights
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                    <StatCard
                        icon={<Users size={20} />}
                        label="Total Headcount"
                        value={stats.totalHeadcount}
                        color="blue"
                    />
                    <StatCard
                        icon={<TrendingUp size={20} />}
                        label="Avg. Span of Control"
                        value={stats.avgSpan}
                        color="green"
                    />
                    <StatCard
                        icon={<Layers size={20} />}
                        label="Max Depth"
                        value={stats.maxDepth}
                        color="purple"
                    />
                </div>

                <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '15px' }}>
                    Department Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.departments.map(([dept, count]) => (
                        <div key={dept} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '150px', fontSize: '0.9rem', fontWeight: '500' }}>{dept}</div>
                            <div style={{ flex: 1, height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(count / stats.totalHeadcount) * 100}%`,
                                    height: '100%',
                                    background: 'var(--color-primary)'
                                }}></div>
                            </div>
                            <div style={{ width: '50px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold' }}>{count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div style={{
        padding: '15px',
        borderRadius: '8px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
    }}>
        <div style={{
            marginBottom: '8px',
            padding: '8px',
            borderRadius: '50%',
            background: `var(--color-${color}-100, rgba(0,0,0,0.05))`,
            color: color
        }}>
            {icon}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
);

export default StatsDashboard;
