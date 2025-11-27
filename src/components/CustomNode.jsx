import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, targetPosition = Position.Top, sourcePosition = Position.Bottom }) => {
    const isVacant = !data.name || data.name.toLowerCase() === 'vacant';

    // Redundancy Check
    const isRedundant = data.redundant && (data.redundant.toString().toUpperCase() === 'Y' || data.redundant.toString().toUpperCase() === 'YES');

    let borderStyle = isVacant ? '2px dashed #666' : '2px solid #333';
    if (isRedundant) {
        borderStyle = '3px solid red';
    }

    const bgColor = isVacant ? 'var(--color-bg)' : 'var(--color-surface)';
    const name = isVacant ? 'Vacant' : data.name;
    const getInitials = (fullName) => {
        if (!fullName) return '?';
        const parts = fullName.split(' ').filter(p => p.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const initials = isVacant ? '?' : getInitials(name);

    return (
        <div style={{
            width: '250px',
            minHeight: data.showSalary ? '160px' : '140px',
            height: 'auto',
            background: bgColor,
            borderRadius: '10px',
            border: borderStyle,
            boxShadow: 'var(--shadow-md)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            fontFamily: "'Calibri', sans-serif",
            color: 'var(--color-text)'
        }}>
            <Handle type="target" position={targetPosition} style={{ background: 'var(--color-text-muted)' }} />

            {/* Avatar Circle */}
            <div style={{
                backgroundColor: isVacant ? 'var(--color-border)' : 'var(--color-primary)',
                position: 'absolute',
                top: '-25px',
                left: '15px',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '20px',
                border: '2px solid var(--color-surface)',
                zIndex: 10
            }}>
                {initials}
            </div>

            <div style={{ padding: '20px', paddingTop: '35px', textAlign: 'center' }}>
                <input
                    value={name}
                    onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'name', e.target.value)}
                    style={{
                        color: 'var(--color-text)',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'center',
                        width: '100%',
                        outline: 'none'
                    }}
                    placeholder="Name"
                />
                <input
                    value={data.designation || ''}
                    onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'designation', e.target.value)}
                    style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '16px',
                        marginBottom: '4px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'center',
                        width: '100%',
                        outline: 'none'
                    }}
                    placeholder="Designation"
                />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>Band:</span>
                    <input
                        value={data.band || ''}
                        onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'band', e.target.value)}
                        style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '16px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            width: '50px',
                            outline: 'none'
                        }}
                        placeholder="N/A"
                    />
                </div>
                {data.showSalary && (
                    <input
                        value={data.salary || ''}
                        onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'salary', e.target.value)}
                        style={{
                            color: 'var(--color-primary)',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '4px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'center',
                            width: '100%',
                            outline: 'none'
                        }}
                        placeholder="Salary"
                    />
                )}

                {/* Render Custom Fields */}
                {Object.entries(data).map(([key, value]) => {
                    if (['name', 'designation', 'band', 'function', 'salary', 'parentId', 'id', 'rawSupervisorId', 'rawSupervisorName', 'reportingType', 'type', 'showSalary', 'redundant', 'onNodeDataChange'].includes(key)) return null;
                    if (!value) return null;
                    return (
                        <div key={key} style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '2px' }}>
                            <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{key}:</span> {value}
                        </div>
                    );
                })}
            </div>

            <Handle type="source" position={sourcePosition} style={{ background: 'var(--color-text-muted)' }} />
        </div>
    );
};

export default memo(CustomNode);
