import React from 'react';
import { Download, FileImage, FileText, Presentation } from 'lucide-react';
import { exportToPNG, exportToPDF, exportToPPTX, exportToDOCX } from '../utils/exportUtils';

const ExportControls = ({ data, chartId, nodes, edges, getViewport, setViewport, fitView, loadedCostPercentage }) => {

    const handleExport = async (exportFn, ...args) => {
        if (!getViewport || !setViewport) {
            // Fallback if viewport controls aren't available
            await exportFn(...args);
            return;
        }

        // Save current viewport
        const originalViewport = getViewport();

        try {
            // Reset to zoom 1 and fit view
            await fitView({ duration: 0, padding: 0.1 });

            // Small delay to ensure render completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Export
            await exportFn(...args);
        } finally {
            // Restore original viewport
            setViewport(originalViewport, { duration: 0 });
        }
    };

    return (
        <div className="glass-panel" style={{ padding: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', marginRight: 'var(--spacing-sm)' }}>Export:</span>

            <button className="btn" onClick={() => handleExport(exportToPNG, chartId, nodes)} title="Export as PNG">
                <FileImage size={18} /> PNG
            </button>

            <button className="btn" onClick={() => handleExport(exportToPDF, chartId, nodes)} title="Export as PDF">
                <FileText size={18} /> PDF
            </button>

            <button className="btn" onClick={() => handleExport(exportToPPTX, 'org-chart-container', nodes, edges, loadedCostPercentage)} title="Export as PPTX">
                <Presentation size={18} /> PPTX
            </button>

            <button className="btn" onClick={() => handleExport(exportToDOCX, 'org-chart-container', nodes)} title="Export as DOCX">
                <Download size={18} /> DOCX
            </button>
        </div>
    );
};

export default ExportControls;
