import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

// Helper to calculate graph bounds
const getGraphBounds = (nodes) => {
    if (!nodes || nodes.length === 0) return { x: 0, y: 0, width: 1000, height: 1000 };

    // Safety check for nodes with missing position
    const validNodes = nodes.filter(n => n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number');
    if (validNodes.length === 0) return { x: 0, y: 0, width: 1000, height: 1000 };

    const minX = Math.min(...validNodes.map(n => n.position.x));
    const minY = Math.min(...validNodes.map(n => n.position.y));
    const maxX = Math.max(...validNodes.map(n => n.position.x + (n.width || 250)));
    // Aggressive height assumption (400px) to ensure no clipping of long content/shadows
    const maxY = Math.max(...validNodes.map(n => n.position.y + (n.measured?.height || n.height || 400)));

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const exportToPNG = async (elementId, nodes, fileName = 'org-chart.png') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // 1. Calculate the full bounds of the graph
    const bounds = getGraphBounds(nodes);

    // Add aggressive padding
    const padding = 200;
    const targetWidth = bounds.width + padding * 2;
    const targetHeight = bounds.height + padding * 2;

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff', // Set to white as requested
            scale: 3, // High quality
            width: targetWidth,
            height: targetHeight,
            windowWidth: targetWidth,
            windowHeight: targetHeight,
            // We use onclone to modify the DOM before capture
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    // 1. Force the container to be large enough to fit the whole graph
                    clonedElement.style.width = `${targetWidth}px`;
                    clonedElement.style.height = `${targetHeight}px`;
                    clonedElement.style.overflow = 'visible';
                    clonedElement.style.position = 'absolute';
                    clonedElement.style.top = '0';
                    clonedElement.style.left = '0';

                    // 2. Remove unwanted UI elements from the clone
                    const classesToRemove = [
                        'react-flow__controls',
                        'react-flow__minimap',
                        'react-flow__attribution',
                        'react-flow__background' // Remove dotted background
                    ];

                    classesToRemove.forEach(className => {
                        const elements = clonedElement.querySelectorAll(`.${className}`);
                        elements.forEach(el => el.remove());
                    });

                    // 3. Reset Viewport Transform
                    // This is CRITICAL. React Flow applies a transform to .react-flow__viewport
                    // We need to reset it so the graph starts at (0,0) relative to our container
                    const viewport = clonedElement.querySelector('.react-flow__viewport');
                    if (viewport) {
                        // Calculate the transform needed to move the top-left of the graph to (padding, padding)
                        // The graph starts at (bounds.x, bounds.y)
                        // We want it at (padding, padding)
                        const translateX = -bounds.x + padding;
                        const translateY = -bounds.y + padding;

                        viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(1)`;
                        viewport.style.width = `${targetWidth}px`;
                        viewport.style.height = `${targetHeight}px`;
                    }
                }
            }
        });

        canvas.toBlob((blob) => {
            saveAs(blob, fileName);
        });
    } catch (err) {
        console.error("PNG Export Error:", err);
        alert("Failed to export PNG.");
    }
};

export const exportToPDF = async (elementId, nodes, fileName = 'org-chart.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const bounds = getGraphBounds(nodes);
    const padding = 200; // Aggressive padding
    const targetWidth = bounds.width + padding * 2;
    const targetHeight = bounds.height + padding * 2;

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff', // Set to white as requested
            scale: 3,
            width: targetWidth,
            height: targetHeight,
            windowWidth: targetWidth,
            windowHeight: targetHeight,
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    clonedElement.style.width = `${targetWidth}px`;
                    clonedElement.style.height = `${targetHeight}px`;
                    clonedElement.style.overflow = 'visible';
                    clonedElement.style.position = 'absolute';
                    clonedElement.style.top = '0';
                    clonedElement.style.left = '0';

                    const classesToRemove = [
                        'react-flow__controls',
                        'react-flow__minimap',
                        'react-flow__attribution',
                        'react-flow__background' // Remove dotted background
                    ];

                    classesToRemove.forEach(className => {
                        const elements = clonedElement.querySelectorAll(`.${className}`);
                        elements.forEach(el => el.remove());
                    });

                    // 3. Reset Viewport Transform
                    const viewport = clonedElement.querySelector('.react-flow__viewport');
                    if (viewport) {
                        const translateX = -bounds.x + padding;
                        const translateY = -bounds.y + padding;

                        viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(1)`;
                        viewport.style.width = `${targetWidth}px`;
                        viewport.style.height = `${targetHeight}px`;
                    }
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: targetWidth > targetHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [targetWidth, targetHeight]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, targetWidth, targetHeight);
        pdf.save(fileName);
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Failed to export PDF.");
    }
};

export const exportToPPTX = async (data, chartId) => {
    try {
        const element = document.getElementById(chartId);
        if (!element) {
            console.error(`Element with id ${chartId} not found`);
            return;
        }

        // Capture the chart as an image
        const canvas = await html2canvas(element, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: '#f0f2f5', // Match app background
            ignoreElements: (node) => {
                return node.classList && (
                    node.classList.contains('react-flow__controls') ||
                    node.classList.contains('react-flow__minimap') ||
                    node.classList.contains('react-flow__attribution')
                );
            }
        });

        const imgData = canvas.toDataURL('image/png');

        // Create PPTX
        const pptx = new PptxGenJS();
        const slide = pptx.addSlide();

        // Add title
        slide.addText("Organization Chart", { x: 0.5, y: 0.5, fontSize: 18, bold: true });

        // Add image to slide
        // Fit to slide (10x5.625 inches is default 16:9)
        slide.addImage({
            data: imgData,
            x: 0.5,
            y: 1.0,
            w: 9.0,
            h: 4.5,
            sizing: { type: 'contain', w: 9.0, h: 4.5 }
        });

        pptx.writeFile({ fileName: 'OrgChart.pptx' });

    } catch (error) {
        console.error("Error exporting to PPTX:", error);
        alert("Failed to export PPTX.");
    }
};

export const exportToDOCX = async (data, chartId) => {
    try {
        const element = document.getElementById(chartId);
        if (!element) {
            console.error(`Element with id ${chartId} not found`);
            return;
        }

        // Capture the chart as an image
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f0f2f5',
            ignoreElements: (node) => {
                return node.classList && (
                    node.classList.contains('react-flow__controls') ||
                    node.classList.contains('react-flow__minimap') ||
                    node.classList.contains('react-flow__attribution')
                );
            }
        });

        const imgData = canvas.toDataURL('image/png');

        // Create DOCX
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Organization Chart",
                                bold: true,
                                size: 32, // 16pt
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: Uint8Array.from(atob(imgData.split(',')[1]), c => c.charCodeAt(0)),
                                transformation: {
                                    width: 600,
                                    height: 400,
                                },
                            }),
                        ],
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "OrgChart.docx");

    } catch (error) {
        console.error("Error exporting to DOCX:", error);
        alert("Failed to export DOCX.");
    }
};
