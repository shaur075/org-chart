import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ data, onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = data.filter(emp =>
            emp.name.toLowerCase().includes(lowerQuery) ||
            (emp.designation && emp.designation.toLowerCase().includes(lowerQuery))
        ).slice(0, 10); // Limit to 10 results

        setResults(filtered);
        setIsOpen(true);
    }, [query, data]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (emp) => {
        onSelect(emp.id);
        setQuery(emp.name);
        setIsOpen(false);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        onSelect(null); // Clear highlight
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '300px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}>
                <Search size={18} style={{ color: 'var(--color-text-muted)', marginRight: '8px' }} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setIsOpen(true)}
                    placeholder="Search employee..."
                    style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        width: '100%',
                        fontSize: '0.9rem',
                        color: 'var(--color-text)'
                    }}
                />
                {query && (
                    <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <X size={16} style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 100,
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {results.map(emp => (
                        <div
                            key={emp.id}
                            onClick={() => handleSelect(emp)}
                            style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--color-border)',
                                transition: 'background 0.1s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--color-text)' }}>{emp.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{emp.designation}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
