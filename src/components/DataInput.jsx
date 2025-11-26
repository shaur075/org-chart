import React, { useState, useCallback, useEffect } from 'react';
import readXlsxFile from 'read-excel-file';
import { Upload, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';

const DataInput = ({ onDataLoaded, initialData }) => {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
    const [manualData, setManualData] = useState([
        { id: '1', name: '', designation: '', band: '', salary: '', supervisorId: '', supervisorName: '', type: 'Direct', redundant: 'N' }
    ]);

    const [customFields, setCustomFields] = useState([]);

    // Populate manual data if initialData is provided (Edit Mode)
    useEffect(() => {
        if (initialData && initialData.length > 0) {
            // Identify custom fields from initial data
            const allKeys = new Set();
            initialData.forEach(emp => Object.keys(emp).forEach(k => allKeys.add(k)));
            const standardKeys = ['id', 'name', 'designation', 'band', 'salary', 'parentId', 'rawSupervisorName', 'reportingType', 'function', 'rawSupervisorId', 'type', 'redundant', 'Redundant'];
            const extras = Array.from(allKeys).filter(k => !standardKeys.includes(k));
            setCustomFields(extras);

            const formatted = initialData.map(emp => {
                const row = {
                    id: emp.id,
                    name: emp.name,
                    designation: emp.designation,
                    band: emp.band,
                    salary: emp.salary,
                    supervisorId: emp.parentId || '', // Use parentId as supervisorId
                    supervisorName: emp.rawSupervisorName || '', // We might not have this preserved perfectly, but that's ok
                    type: emp.reportingType || 'Direct',
                    redundant: emp.redundant || 'N'
                };
                // Add custom values
                extras.forEach(field => {
                    row[field] = emp[field] || '';
                });
                return row;
            });
            setManualData(formatted);
            setActiveTab('manual');
        }
    }, [initialData]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        readXlsxFile(file).then((rows) => {
            // rows is an array of arrays. First row is header.
            if (rows.length < 2) return;

            const headers = rows[0].map(h => h.toString().trim()); // Keep case for custom fields? Or lowercase? Let's lowercase for standard, keep for custom.

            // Identify standard headers
            const standardMap = {
                'name': 'Name',
                'designation': 'Designation',
                'role': 'Designation',
                'supervisorid': 'SupervisorID',
                'supervisor id': 'SupervisorID',
                'supervisorname': 'SupervisorName',
                'supervisor name': 'SupervisorName',
                'supervisor': 'SupervisorName',
                'reportingtype': 'ReportingType',
                'type': 'ReportingType',
                'id': 'ID',
                'band': 'band',
                'function': 'function',
                'salary': 'salary',
                'redundant': 'Redundant'
            };

            const data = rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((rawHeader, index) => {
                    const lowerHeader = rawHeader.toLowerCase();
                    if (standardMap[lowerHeader]) {
                        obj[standardMap[lowerHeader]] = row[index];
                    } else {
                        // It's a custom field
                        obj[rawHeader] = row[index];
                    }
                });
                return obj;
            });
            processData(data);
        }).catch(err => {
            console.error("Error reading excel file:", err);
            alert("Error reading file. Please ensure it is a valid Excel file.");
        });
    };

    const processData = (data) => {
        // 1. Normalize keys and ensure basic fields
        let formattedData = data.map((row, index) => {
            // Generate a temporary ID if missing. 
            // Ideally, we use the provided ID. If not, we use Name. If not, we use index.
            const rawId = row.ID || row.Name || `emp_${index} `;
            const id = rawId.toString().trim();

            const standardKeys = ['ID', 'Name', 'Designation', 'Band', 'Salary', 'SupervisorID', 'SupervisorName', 'ReportingType', 'band', 'function', 'salary', 'redundant', 'Redundant'];

            const emp = {
                id: id,
                name: row.Name || 'Unknown',
                designation: row.Designation || '',
                band: row.Band || row.band || '',
                salary: row.Salary || row.salary || '',
                // We will resolve parentId in the next step
                rawSupervisorId: row.SupervisorID ? row.SupervisorID.toString().trim() : null,
                rawSupervisorName: row.SupervisorName || row.Supervisor || null,
                reportingType: row.ReportingType || 'Direct',
                redundant: row.Redundant || row.redundant || 'N'
            };

            // Copy custom fields
            Object.keys(row).forEach(key => {
                if (!standardKeys.includes(key)) {
                    emp[key] = row[key];
                }
            });

            return emp;
        });

        // 1.5 Deduplicate based on ID
        const uniqueIds = new Set();
        const uniqueData = [];
        formattedData.forEach(emp => {
            if (!uniqueIds.has(emp.id)) {
                uniqueIds.add(emp.id);
                uniqueData.push(emp);
            } else {
                console.warn(`Duplicate Employee ID found: ${emp.id}. Skipping duplicate.`);
            }
        });
        formattedData = uniqueData;

        // 2. Create a map for name-to-id lookup (case-insensitive)
        const nameToIdMap = new Map();
        formattedData.forEach(emp => {
            if (emp.name) {
                nameToIdMap.set(emp.name.toLowerCase(), emp.id);
            }
        });

        // 3. Resolve Parent IDs
        formattedData = formattedData.map(emp => {
            let parentId = '';

            // Priority 1: Explicit Supervisor ID
            if (emp.rawSupervisorId) {
                // Check if this ID actually exists in our data
                const supervisorExists = formattedData.some(e => e.id === emp.rawSupervisorId);
                if (supervisorExists) {
                    parentId = emp.rawSupervisorId;
                } else {
                    console.warn(`Supervisor ID ${emp.rawSupervisorId} for ${emp.name} not found in employee list.`);
                }
            }
            // Priority 2: Supervisor Name (lookup ID)
            else if (emp.rawSupervisorName) {
                const supId = nameToIdMap.get(emp.rawSupervisorName.toLowerCase());
                if (supId) {
                    parentId = supId;
                } else {
                    console.warn(`Supervisor Name ${emp.rawSupervisorName} for ${emp.name} not found in employee list.`);
                }
            }

            // Self-reference check (prevent infinite loops/errors)
            if (parentId === emp.id) {
                console.warn(`Employee ${emp.name} reports to themselves.Removing supervisor.`);
                parentId = '';
            }

            return {
                ...emp,
                parentId: parentId || '' // Use empty string for root
            };
        });

        // 4. Validation: Ensure at least one root
        const roots = formattedData.filter(d => !d.parentId);
        if (roots.length === 0) {
            alert("Error: No root node found. At least one employee must have no supervisor (or 'CEO'/'Head' role).");
            return;
        }

        console.log("Processed Hierarchy:", formattedData);
        onDataLoaded(formattedData);
    };

    const handleManualChange = (index, field, value) => {
        const newData = [...manualData];
        newData[index][field] = value;
        setManualData(newData);
    };

    const addRow = () => {
        const newRow = { id: Date.now().toString(), name: '', designation: '', supervisorId: '', type: 'Direct', redundant: 'N' };
        customFields.forEach(f => newRow[f] = '');
        setManualData([...manualData, newRow]);
    };

    const removeRow = (index) => {
        const newData = manualData.filter((_, i) => i !== index);
        setManualData(newData);
    };

    const addCustomField = () => {
        const fieldName = prompt("Enter new field name (e.g., Location):");
        if (fieldName && !customFields.includes(fieldName)) {
            setCustomFields([...customFields, fieldName]);
            // Update existing rows
            const newData = manualData.map(row => ({ ...row, [fieldName]: '' }));
            setManualData(newData);
        }
    };

    const submitManualData = () => {
        // Map manual data to the format processData expects
        const formattedManualData = manualData.map(row => {
            const obj = {
                ID: row.id,
                Name: row.name,
                Designation: row.designation,
                Band: row.band,
                Salary: row.salary,
                SupervisorID: row.supervisorId,
                SupervisorName: row.supervisorName,
                ReportingType: row.type,
                Redundant: row.redundant
            };
            customFields.forEach(f => obj[f] = row[f]);
            return obj;
        });
        processData(formattedManualData);
    };

    return (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <button
                    className={`btn ${activeTab === 'upload' ? 'btn-primary' : ''} `}
                    onClick={() => setActiveTab('upload')}
                    style={{ flex: 1 }}
                >
                    <FileSpreadsheet size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Upload Excel
                </button>
                <button
                    className={`btn ${activeTab === 'manual' ? 'btn-primary' : ''} `}
                    onClick={() => setActiveTab('manual')}
                    style={{ flex: 1 }}
                >
                    <Plus size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    Manual Entry
                </button>
                <button
                    className="btn"
                    onClick={() => {
                        const demoData = [
                            { ID: '1', Name: 'CEO', Designation: 'Chief Executive Officer', Salary: '200000', SupervisorID: '' },
                            { ID: '2', Name: 'VP Engineering', Designation: 'VP of Eng', Salary: '150000', SupervisorID: '1' },
                            { ID: '3', Name: 'VP Sales', Designation: 'VP of Sales', Salary: '140000', SupervisorID: '1' },
                            { ID: '4', Name: 'Eng Manager', Designation: 'Engineering Manager', Salary: '120000', SupervisorID: '2' },
                            { ID: '5', Name: 'Senior Dev', Designation: 'Senior Developer', Salary: '100000', SupervisorID: '4' }
                        ];
                        processData(demoData);
                    }}
                    style={{ flex: 1, background: '#e0e7ff', color: '#3730a3' }}
                >
                    🚀 Load Demo
                </button>
            </div>

            {activeTab === 'upload' ? (
                <div
                    style={{
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-xl)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files.length) {
                            handleFileUpload({ target: { files: e.dataTransfer.files } });
                        }
                    }}
                >
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        <Upload size={48} color="var(--color-primary)" style={{ marginBottom: 'var(--spacing-md)' }} />
                        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Click or Drag Excel File Here</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Supported formats: .xlsx, .xls
                        </p>
                    </label>
                </div>
            ) : (
                <div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 'var(--spacing-md)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '8px', width: '100px' }}>ID</th>
                                    <th style={{ padding: '8px', width: '150px' }}>Name</th>
                                    <th style={{ padding: '8px', width: '150px' }}>Designation</th>
                                    <th style={{ padding: '8px', width: '80px' }}>Band</th>
                                    <th style={{ padding: '8px', width: '80px' }}>Salary</th>
                                    <th style={{ padding: '8px', width: '80px' }}>Sup. ID</th>
                                    <th style={{ padding: '8px', width: '150px' }}>Sup. Name</th>
                                    <th style={{ padding: '8px', width: '80px' }}>Type</th>
                                    <th style={{ padding: '8px', width: '80px' }}>Redundant</th>
                                    {customFields.map(f => (
                                        <th key={f} style={{ padding: '8px', width: '100px' }}>{f}</th>
                                    ))}
                                    <th style={{ padding: '8px', width: '50px' }}>
                                        <button onClick={addCustomField} title="Add Column" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Plus size={16} />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {manualData.map((row, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                type="text"
                                                value={row.id}
                                                onChange={(e) => handleManualChange(index, 'id', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                type="text"
                                                value={row.name}
                                                onChange={(e) => handleManualChange(index, 'name', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                type="text"
                                                value={row.designation}
                                                onChange={(e) => handleManualChange(index, 'designation', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                type="text"
                                                value={row.band || ''}
                                                onChange={(e) => handleManualChange(index, 'band', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                type="text"
                                                value={row.salary || ''}
                                                onChange={(e) => handleManualChange(index, 'salary', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                type="text"
                                                value={row.supervisorId}
                                                onChange={(e) => handleManualChange(index, 'supervisorId', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input
                                                type="text"
                                                value={row.supervisorName || ''}
                                                onChange={(e) => handleManualChange(index, 'supervisorName', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select
                                                value={row.type}
                                                onChange={(e) => handleManualChange(index, 'type', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            >
                                                <option value="Direct">Direct</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select
                                                value={row.redundant || 'N'}
                                                onChange={(e) => handleManualChange(index, 'redundant', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            >
                                                <option value="N">No</option>
                                                <option value="Y">Yes</option>
                                            </select>
                                        </td>
                                        {customFields.map(f => (
                                            <td key={f} style={{ padding: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={row[f] || ''}
                                                    onChange={(e) => handleManualChange(index, f, e.target.value)}
                                                    style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                />
                                            </td>
                                        ))}
                                        <td style={{ padding: '8px' }}>
                                            <button onClick={() => removeRow(index)} style={{ color: 'red', background: 'none', border: 'none' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button className="btn" onClick={addRow} style={{ border: '1px solid var(--color-border)' }}>
                            + Add Row
                        </button>
                        <button className="btn btn-primary" onClick={submitManualData}>
                            Generate Chart
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataInput;
