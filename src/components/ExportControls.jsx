import React from 'react';
import { Download, FileImage, FileText, Presentation } from 'lucide-react';
import { exportToPNG, exportToPDF, exportToPPTX, exportToDOCX } from '../utils/exportUtils';

const ExportControls = ({ data, chartId, nodes, edges }) => {
    return (
        <div className="glass-panel" style={{ padding: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', marginRight: 'var(--spacing-sm)' }}>Export:</span>

            <button className="btn" onClick={() => exportToPNG(chartId, nodes)} title="Export as PNG">
                <FileImage size={18} /> PNG
            </button>

            <button className="btn" onClick={() => exportToPDF(chartId, nodes)} title="Export as PDF">
                <FileText size={18} /> PDF
            </button>

            <button className="btn" onClick={() => exportToPPTX('org-chart-container', nodes)} title="Export as PPTX">
                <Presentation size={18} /> PPTX
            </button>

            <button className="btn" onClick={() => exportToDOCX('org-chart-container', nodes)} title="Export as DOCX">
                <Download size={18} /> DOCX
            </button>
        </div>
    );
};

export default ExportControls;
