import React, { useMemo } from 'react';
import { X, DollarSign, Calendar } from 'lucide-react';

const CostDashboard = ({ data, onClose }) => {
    const costs = useMemo(() => {
        if (!data || data.length === 0) return null;

        let totalMonthly = 0;

        data.forEach(emp => {
            if (emp.salary) {
                // Remove currency symbols, commas, spaces
                // Handle 'k' suffix (e.g., 120k -> 120000)
                let raw = emp.salary.toString().toLowerCase().replace(/[^0-9k.]/g, '');
                let multiplier = 1;
                if (raw.includes('k')) {
                    multiplier = 1000;
                    raw = raw.replace('k', '');
                }

                const val = parseFloat(raw);
                if (!isNaN(val)) {
                    totalMonthly += (val * multiplier);
                }
            }
        });

        // Assuming input is Annual, divide by 12 for monthly.
        // Wait, usually people enter Annual salary.
        // Let's assume input is ANNUAL.
        const totalAnnual = totalMonthly;
        const monthly = totalAnnual / 12;

        return {
            monthly: monthly,
            annual: totalAnnual
        };
    }, [data]);

    if (!costs) return null;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="glass-panel" style={{
                width: '400px',
                padding: '25px',
                background: 'var(--color-bg)',
                color: 'var(--color-text-main)',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                        <DollarSign size={24} style={{ marginRight: '10px', color: 'var(--color-primary)' }} />
                        Cost Analysis
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{
                        padding: '20px',
                        borderRadius: '8px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '5px' }}>Total Monthly Cost</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {formatCurrency(costs.monthly)}
                        </div>
                    </div>

                    <div style={{
                        padding: '20px',
                        borderRadius: '8px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '5px' }}>Total Annual Cost</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'green' }}>
                            {formatCurrency(costs.annual)}
                        </div>
                    </div>
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '20px' }}>
                    *Calculated based on 'Salary' field assuming Annual figures.
                </p>
            </div>
        </div>
    );
};

export default CostDashboard;
