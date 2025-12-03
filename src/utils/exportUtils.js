import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';

// Helper function to calculate actual chart bounds from nodes
const calculateChartBounds = (nodes) => {
    if (!nodes || nodes.length === 0) {
        return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
        if (node.position) {
            const x = node.position.x;
            const y = node.position.y;
            const width = node.width || node.measured?.width || (node.type === 'text' ? 200 : 280);
            const height = node.height || node.measured?.height || (node.type === 'text' ? 150 : 200);

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
        }
    });

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
    };
};

export const exportToPNG = async (elementId, nodes, fileName = 'org-chart.png') => {
    const element = document.getElementById(elementId);
    if (!element) {
        alert("Chart element not found!");
        return;
    }

    try {
        // Hide instruction panel before export
        const instructionPanel = element.querySelector('.instruction-panel');
        const originalDisplay = instructionPanel ? instructionPanel.style.display : '';
        if (instructionPanel) {
            instructionPanel.style.display = 'none';
        }

        // Calculate actual chart dimensions from nodes
        const bounds = calculateChartBounds(nodes);
        const padding = 100; // Reasonable padding

        // Create large canvas with actual dimensions
        const captureWidth = bounds.width + (padding * 2);
        const captureHeight = bounds.height + (padding * 2);

        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                // Exclude React Flow controls and panels
                if (node.classList) {
                    return !node.classList.contains('react-flow__controls') &&
                        !node.classList.contains('react-flow__minimap') &&
                        !node.classList.contains('react-flow__attribution') &&
                        !node.classList.contains('react-flow__background');
                }
                return true;
            },
            width: captureWidth,
            height: captureHeight,
            pixelRatio: 3,  // High quality
            skipFonts: false
        });

        // Restore instruction panel
        if (instructionPanel) {
            instructionPanel.style.display = originalDisplay;
        }

        // Download the image
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error("PNG Export Error:", err);
        alert("Failed to export PNG. Error: " + err.message);
    }
};

export const exportToPDF = async (elementId, nodes, fileName = 'org-chart.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) {
        alert("Chart element not found!");
        return;
    }

    try {
        // Hide instruction panel
        const instructionPanel = element.querySelector('.instruction-panel');
        const originalDisplay = instructionPanel ? instructionPanel.style.display : '';
        if (instructionPanel) {
            instructionPanel.style.display = 'none';
        }

        // Calculate actual chart dimensions
        const bounds = calculateChartBounds(nodes);
        const padding = 100;
        const captureWidth = bounds.width + (padding * 2);
        const captureHeight = bounds.height + (padding * 2);

        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                if (node.classList && (
                    node.classList.contains('react-flow__controls') ||
                    node.classList.contains('react-flow__minimap') ||
                    node.classList.contains('react-flow__attribution') ||
                    node.classList.contains('react-flow__background') ||
                    node.classList.contains('instruction-panel') ||
                    node.classList.contains('no-export')
                )) {
                    return false;
                }
                return true;
            },
            width: captureWidth,
            height: captureHeight,
            pixelRatio: 3,
            skipFonts: false
        });

        // Restore instruction panel
        if (instructionPanel) {
            instructionPanel.style.display = originalDisplay;
        }

        // Create PDF with the image
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const pdf = new jsPDF({
                orientation: img.width > img.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [img.width, img.height]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
            pdf.save(fileName);
        };
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Failed to export PDF. Error: " + err.message);
    }
};

export const exportToPPTX = async (elementId, nodes) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            alert("Chart element not found!");
            return;
        }

        // Hide instruction panel
        const instructionPanel = element.querySelector('.instruction-panel');
        const originalDisplay = instructionPanel ? instructionPanel.style.display : '';
        if (instructionPanel) {
            instructionPanel.style.display = 'none';
        }

        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                if (node.classList) {
                    return !node.classList.contains('react-flow__controls') &&
                        !node.classList.contains('react-flow__minimap') &&
                        !node.classList.contains('react-flow__attribution') &&
                        !node.classList.contains('react-flow__background') &&
                        !node.classList.contains('instruction-panel');
                }
                return true;
            },
            width: element.scrollWidth,
            height: element.scrollHeight,
            pixelRatio: 2
        });

        // Restore instruction panel
        if (instructionPanel) {
            instructionPanel.style.display = originalDisplay;
        }

        const pptx = new PptxGenJS();
        const slide = pptx.addSlide();
        slide.addText("Organization Chart", { x: 0.5, y: 0.5, fontSize: 18, bold: true });
        slide.addImage({
            data: dataUrl,
            x: 0.5,
            y: 1.0,
            w: 9.0,
            h: 4.0,
            sizing: { type: 'contain', w: 9.0, h: 4.0 }
        });
        pptx.writeFile({ fileName: 'OrgChart.pptx' });
    } catch (error) {
        console.error("Error exporting to PPTX:", error);
        alert("Failed to export PPTX. Error: " + error.message);
    }
};

export const exportToDOCX = async (elementId, nodes) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            alert("Chart element not found!");
            return;
        }

        // Hide instruction panel
        const instructionPanel = element.querySelector('.instruction-panel');
        const originalDisplay = instructionPanel ? instructionPanel.style.display : '';
        if (instructionPanel) {
            instructionPanel.style.display = 'none';
        }

        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                if (node.classList) {
                    return !node.classList.contains('react-flow__controls') &&
                        !node.classList.contains('react-flow__minimap') &&
                        !node.classList.contains('react-flow__attribution') &&
                        !node.classList.contains('react-flow__background') &&
                        !node.classList.contains('instruction-panel');
                }
                return true;
            },
            width: element.scrollWidth,
            height: element.scrollHeight,
            pixelRatio: 2
        });

        // Restore instruction panel
        if (instructionPanel) {
            instructionPanel.style.display = originalDisplay;
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Organization Chart",
                                bold: true,
                                size: 32,
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0)),
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
        alert("Failed to export DOCX. Error: " + error.message);
    }
};
