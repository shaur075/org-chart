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
                <textarea
                    autoFocus
                    value={data.text}
                    onChange={(e) => data.onChange(data.id, e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    style={{
                        width: '100%',
                        height: '100px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '5px',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        resize: 'both'
                    }}
                />
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
