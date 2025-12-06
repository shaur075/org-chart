import React, { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

// Professional Pastel Palette
const COLOR_THEMES = [
    { name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', primary: 'bg-blue-600', text: 'text-blue-800', lightText: 'text-blue-600' },
    { name: 'Emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', primary: 'bg-emerald-600', text: 'text-emerald-800', lightText: 'text-emerald-600' },
    { name: 'Violet', bg: 'bg-violet-50', border: 'border-violet-200', primary: 'bg-violet-600', text: 'text-violet-800', lightText: 'text-violet-600' },
    { name: 'Amber', bg: 'bg-amber-50', border: 'border-amber-200', primary: 'bg-amber-600', text: 'text-amber-800', lightText: 'text-amber-600' },
    { name: 'Rose', bg: 'bg-rose-50', border: 'border-rose-200', primary: 'bg-rose-600', text: 'text-rose-800', lightText: 'text-rose-600' },
    { name: 'Cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', primary: 'bg-cyan-600', text: 'text-cyan-800', lightText: 'text-cyan-600' },
    { name: 'Slate', bg: 'bg-slate-50', border: 'border-slate-200', primary: 'bg-slate-600', text: 'text-slate-800', lightText: 'text-slate-600' },
];

const getTheme = (key) => {
    if (!key) return COLOR_THEMES[6]; // Default to Slate
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % (COLOR_THEMES.length - 1); // Exclude Slate from random rotation if preferred, or include it.
    return COLOR_THEMES[index];
};

const CustomNode = ({ data, targetPosition = Position.Top, sourcePosition = Position.Bottom }) => {
    const isVacant = !data.name || data.name.toLowerCase() === 'vacant';

    // Redundancy Check
    const isRedundant = data.redundant && (data.redundant.toString().toUpperCase() === 'Y' || data.redundant.toString().toUpperCase() === 'YES');

    // Determine Theme
    // Priority: Function (Dept) -> Name -> Default
    const themeKey = data.function || data.name || 'default';
    const theme = useMemo(() => getTheme(themeKey), [themeKey]);

    // Override styles for special states
    let borderColor = theme.border;
    let borderWidth = 'border';
    let bgColor = theme.bg;
    let avatarColor = theme.primary;

    if (isVacant) {
        borderColor = 'border-slate-300 border-dashed';
        bgColor = 'bg-slate-50';
        avatarColor = 'bg-slate-300';
    } else if (isRedundant) {
        borderColor = 'border-red-500';
        borderWidth = 'border-2';
        // Keep theme bg or make it reddish? Let's keep theme bg but strong border.
    }

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
        <div className={`
            w-[280px] min-h-[160px] rounded-xl shadow-lg transition-all duration-200
            ${bgColor} ${borderColor} ${borderWidth}
            hover:shadow-xl hover:-translate-y-1 relative group
        `}>
            <Handle type="target" position={targetPosition} className="!bg-slate-400 !w-3 !h-3" />

            {/* Avatar Circle */}
            <div className={`
                absolute -top-6 left-6 w-12 h-12 rounded-full flex items-center justify-center
                text-white font-bold text-lg border-4 border-white shadow-sm z-10
                ${avatarColor}
            `}>
                {initials}
            </div>

            <div className="pt-10 pb-6 px-6 text-center">
                <input
                    className={`nodrag w-full text-center bg-transparent border-none focus:ring-0 p-0 text-lg font-bold ${theme.text} placeholder-slate-400 mb-1`}
                    value={name}
                    onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'name', e.target.value)}
                    placeholder="Name"
                />

                <input
                    className={`nodrag w-full text-center bg-transparent border-none focus:ring-0 p-0 text-sm font-medium ${theme.lightText} placeholder-primary-300 mb-3`}
                    value={data.designation || ''}
                    onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'designation', e.target.value)}
                    placeholder="Designation"
                />

                <div className="flex items-center justify-center gap-2 mb-2 text-sm text-slate-500">
                    <span className="font-medium">Band:</span>
                    <input
                        className="nodrag w-16 bg-transparent border-none focus:ring-0 p-0 text-slate-600 placeholder-slate-300"
                        value={data.band || ''}
                        onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'band', e.target.value)}
                        placeholder="N/A"
                    />
                </div>

                {data.showSalary && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50">
                        <input
                            className="nodrag w-full text-center bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-emerald-600 placeholder-emerald-300"
                            value={data.salary || ''}
                            onChange={(e) => data.onNodeDataChange && data.onNodeDataChange(data.id, 'salary', e.target.value)}
                            placeholder="Salary"
                        />
                    </div>
                )}

                {/* Render Custom Fields */}
                {Object.entries(data).map(([key, value]) => {
                    if (['name', 'designation', 'band', 'function', 'salary', 'parentId', 'id', 'rawSupervisorId', 'rawSupervisorName', 'reportingType', 'type', 'showSalary', 'redundant', 'onNodeDataChange'].includes(key)) return null;
                    if (!value) return null;
                    return (
                        <div key={key} className="text-xs text-slate-400 mt-1">
                            <span className="font-medium capitalize">{key}:</span> {value}
                        </div>
                    );
                })}
            </div>

            <Handle type="source" position={sourcePosition} className="!bg-slate-400 !w-3 !h-3" />
        </div>
    );
};

export default memo(CustomNode);
