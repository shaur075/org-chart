import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

const TextNode = ({ data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);

    const style = {
        padding: '10px',
        borderRadius: '5px',
        background: data.bgColor || 'transparent',
        border: selected ? '1px solid #555' : '1px solid transparent',
        minWidth: '150px',
        maxWidth: '400px',
        textAlign: 'left',
        color: data.color || '#000',
        fontSize: data.fontSize || '14px',
        fontFamily: data.fontFamily || 'Arial, sans-serif',
    };

    return (
        <div style={style} onDoubleClick={() => setIsEditing(true)}>
            {isEditing ? (
                <div className="nodrag nopan" style={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'default' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                            className="nodrag"
                            value={data.fontSize || '24px'}
                            onChange={(e) => data.onChange(data.id, { fontSize: e.target.value })}
                            style={{ fontSize: '12px', padding: '2px' }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <option value="12px">Small</option>
                            <option value="14px">Medium</option>
                            <option value="18px">Large</option>
                            <option value="24px">Extra Large</option>
                            <option value="32px">Huge</option>
                        </select>
                        <select
                            className="nodrag"
                            value={data.fontFamily || 'Arial, sans-serif'}
                            onChange={(e) => data.onChange(data.id, { fontFamily: e.target.value })}
                            style={{ fontSize: '12px', padding: '2px' }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="'Courier New', monospace">Courier New</option>
                            <option value="'Calibri', sans-serif">Calibri</option>
                        </select>
                    </div>
                    <textarea
                        className="nodrag"
                        autoFocus
                        value={data.text}
                        onChange={(e) => data.onChange(data.id, { text: e.target.value })}
                        onBlur={() => setIsEditing(false)}
                        style={{
                            width: '100%',
                            height: '100px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '5px',
                            fontFamily: data.fontFamily || 'inherit',
                            fontSize: data.fontSize || 'inherit',
                            resize: 'both'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </div>
            ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                    {data.text || 'Double click to edit text'}
                </div>
            )}
            {/* Optional handles if we want to connect text to nodes? Maybe not for now. */}
        </div>
    );
};

export default memo(TextNode);
