import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

const TextNode = ({ data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(data.text);
    const [localFontSize, setLocalFontSize] = useState(data.fontSize || '24px');
    const [localFontFamily, setLocalFontFamily] = useState(data.fontFamily || 'Arial, sans-serif');

    // Sync local state when props change (if not editing)
    useEffect(() => {
        if (!isEditing) {
            setLocalText(data.text);
            setLocalFontSize(data.fontSize || '24px');
            setLocalFontFamily(data.fontFamily || 'Arial, sans-serif');
        }
    }, [data.text, data.fontSize, data.fontFamily, isEditing]);

    const handleTextChange = (e) => {
        setLocalText(e.target.value);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (data.onChange) {
            data.onChange(data.id, { text: localText });
        }
    };

    const handleFontSizeChange = (e) => {
        const newVal = e.target.value;
        setLocalFontSize(newVal);
        if (data.onChange) {
            data.onChange(data.id, { fontSize: newVal });
        }
    };

    const handleFontFamilyChange = (e) => {
        const newVal = e.target.value;
        setLocalFontFamily(newVal);
        if (data.onChange) {
            data.onChange(data.id, { fontFamily: newVal });
        }
    };

    const style = {
        padding: '10px',
        borderRadius: '5px',
        background: data.bgColor || 'transparent',
        border: selected ? '2px solid #555' : '1px solid #ddd',
        minWidth: '150px',
        maxWidth: '400px',
        textAlign: 'left',
        color: data.color || '#000',
        fontSize: localFontSize,
        fontFamily: localFontFamily,
    };

    return (
        <div style={style} onDoubleClick={() => setIsEditing(true)}>
            {isEditing ? (
                <div>
                    <textarea
                        autoFocus
                        value={localText}
                        onChange={handleTextChange}
                        onBlur={handleBlur}
                        style={{
                            width: '100%',
                            height: '100px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '5px',
                            fontFamily: localFontFamily,
                            fontSize: localFontSize,
                            resize: 'both'
                        }}
                    />
                </div>
            ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                    {localText || 'Double click to edit text'}
                </div>
            )}
            {selected && !isEditing && (
                <div style={{ marginTop: '5px', display: 'flex', gap: '5px', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
                    <select
                        value={localFontSize}
                        onChange={handleFontSizeChange}
                        style={{ fontSize: '11px', padding: '3px' }}
                    >
                        <option value="12px">Small</option>
                        <option value="14px">Medium</option>
                        <option value="18px">Large</option>
                        <option value="24px">Extra Large</option>
                        <option value="32px">Huge</option>
                    </select>
                    <select
                        value={localFontFamily}
                        onChange={handleFontFamilyChange}
                        style={{ fontSize: '11px', padding: '3px' }}
                    >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="'Calibri', sans-serif">Calibri</option>
                    </select>
                </div>
            )}
        </div>
    );
};

export default TextNode;
