import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
    const isVacant = !data.name || data.name.toLowerCase() === 'vacant';
    const borderStyle = isVacant ? '2px dashed #666' : '2px solid #333';
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
            <Handle type="target" position={Position.Top} style={{ background: 'var(--color-text-muted)' }} />

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
                <div style={{ color: 'var(--color-text)', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {name}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                    {data.designation || 'No Designation'}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                    Band: {data.band || 'N/A'}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                    {data.function || ''}
                </div>
                {data.showSalary && data.salary && (
                    <div style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
                        {data.salary}
                    </div>
                )}

                {/* Render Custom Fields */}
                {Object.entries(data).map(([key, value]) => {
                    if (['name', 'designation', 'band', 'function', 'salary', 'parentId', 'id', 'rawSupervisorId', 'rawSupervisorName', 'reportingType', 'type', 'showSalary'].includes(key)) return null;
                    if (!value) return null;
                    return (
                        <div key={key} style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '2px' }}>
                            <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{key}:</span> {value}
                        </div>
                    );
                })}
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: 'var(--color-text-muted)' }} />
        </div>
    );
};

export default memo(CustomNode);
