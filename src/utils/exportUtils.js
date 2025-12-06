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

export const exportToPPTX = async (elementId, nodes, edges) => {
    try {
        if (!nodes || nodes.length === 0) {
            alert("No nodes to export!");
            return;
        }

        const pptx = new PptxGenJS();

        // Calculate bounds to set slide size
        const bounds = calculateChartBounds(nodes);
        const padding = 50; // pixels
        const widthPx = bounds.width + (padding * 2);
        const heightPx = bounds.height + (padding * 2);

        // Convert to inches (96 DPI approximation)
        const widthIn = widthPx / 96;
        const heightIn = heightPx / 96;

        // Set layout to fit the chart
        pptx.defineLayout({ name: 'ORG_CHART', width: widthIn, height: heightIn });
        pptx.layout = 'ORG_CHART';

        const slide = pptx.addSlide();

        // Offset to center/place chart in slide (accounting for minX/minY)
        const offsetX = padding - bounds.minX;
        const offsetY = padding - bounds.minY;

        // Helper to convert px to inches for positioning
        const pxToIn = (px) => px / 96;

        // Helper to get initials
        const getInitials = (fullName) => {
            if (!fullName) return '?';
            const parts = fullName.split(' ').filter(p => p.length > 0);
            if (parts.length === 0) return '?';
            if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        };

        // 1. Draw Edges (Connectors) first so they are behind nodes
        if (edges) {
            edges.forEach(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);

                if (sourceNode && targetNode) {
                    const sX = sourceNode.position.x + offsetX;
                    const sY = sourceNode.position.y + offsetY;
                    const sW = sourceNode.width || 280;
                    const sH = sourceNode.height || 160;

                    const tX = targetNode.position.x + offsetX;
                    const tY = targetNode.position.y + offsetY;
                    const tW = targetNode.width || 280;

                    // Calculate start and end points (Bottom Center -> Top Center)
                    const startX = sX + (sW / 2);
                    const startY = sY + sH;
                    const endX = tX + (tW / 2);
                    const endY = tY;

                    // Simple Elbow Logic
                    const midY = startY + (endY - startY) / 2;

                    // Draw the line using separate line shapes for editability
                    const lineColor = '94a3b8'; // Slate-400
                    const lineWidth = 1.5;

                    // Segment 1: Vertical down
                    slide.addShape('line', {
                        x: pxToIn(startX), y: pxToIn(startY),
                        w: 0, h: pxToIn(midY - startY),
                        line: { color: lineColor, width: lineWidth }
                    });

                    // Segment 2: Horizontal
                    slide.addShape('line', {
                        x: pxToIn(Math.min(startX, endX)), y: pxToIn(midY),
                        w: pxToIn(Math.abs(endX - startX)), h: 0,
                        line: { color: lineColor, width: lineWidth }
                    });

                    // Segment 3: Vertical down to target
                    slide.addShape('line', {
                        x: pxToIn(endX), y: pxToIn(midY),
                        w: 0, h: pxToIn(endY - midY),
                        line: { color: lineColor, width: lineWidth }
                    });
                }
            });
        }

        // 2. Draw Nodes
        nodes.forEach(node => {
            const x = pxToIn(node.position.x + offsetX);
            const y = pxToIn(node.position.y + offsetY);
            const w = pxToIn(node.width || 280);
            const h = pxToIn(node.height || 160);

            // Determine styling based on data
            const isVacant = !node.data.name || node.data.name.toLowerCase() === 'vacant';
            const isRedundant = node.data.redundant && (node.data.redundant.toString().toUpperCase() === 'Y');

            let fillColor = 'FFFFFF';
            let borderColor = 'e2e8f0'; // Slate-200
            let borderType = 'solid';
            let borderWidth = 1;
            let avatarBg = '6366f1'; // Indigo-500 (Primary)
            let avatarText = 'FFFFFF';

            if (isVacant) {
                fillColor = 'f8fafc'; // Slate-50
                borderColor = 'cbd5e1'; // Slate-300
                borderType = 'dash';
                avatarBg = 'cbd5e1'; // Slate-300
            } else if (isRedundant) {
                borderColor = 'ef4444'; // Red-500
                borderWidth = 2.5;
            }

            // Main Box with Shadow
            slide.addShape('rect', {
                x: x, y: y, w: w, h: h,
                fill: { color: fillColor },
                line: { color: borderColor, width: borderWidth, dashType: borderType },
                rectRadius: 0.1, // Rounded corners
                shadow: { type: 'outer', color: '000000', opacity: 0.1, blur: 5, offset: 2 }
            });

            // Avatar Circle (Top Left)
            // Position: -25px top, 15px left relative to node
            // In inches:
            const avatarSizePx = 50;
            const avatarSizeIn = pxToIn(avatarSizePx);
            const avatarX = x + pxToIn(15);
            const avatarY = y - pxToIn(25);

            slide.addShape('oval', {
                x: avatarX, y: avatarY, w: avatarSizeIn, h: avatarSizeIn,
                fill: { color: avatarBg },
                line: { color: 'FFFFFF', width: 2 }, // White border
                shadow: { type: 'outer', color: '000000', opacity: 0.1, blur: 2, offset: 1 }
            });

            // Initials inside Avatar
            const initials = isVacant ? '?' : getInitials(node.data.name);
            slide.addText(initials, {
                x: avatarX, y: avatarY, w: avatarSizeIn, h: avatarSizeIn,
                fontSize: 14,
                bold: true,
                align: 'center',
                valign: 'middle',
                color: avatarText
            });

            // Name
            slide.addText(node.data.name || 'Vacant', {
                x: x, y: y + pxToIn(35), w: w, h: 0.3,
                fontSize: 16,
                bold: true,
                align: 'center',
                color: '1e293b' // Slate-800
            });

            // Designation
            slide.addText(node.data.designation || '', {
                x: x, y: y + pxToIn(65), w: w, h: 0.25,
                fontSize: 12,
                color: '6366f1', // Primary-500 (Indigo)
                align: 'center'
            });

            // Band (if exists)
            if (node.data.band) {
                slide.addText(`Band: ${node.data.band}`, {
                    x: x, y: y + pxToIn(90), w: w, h: 0.2,
                    fontSize: 11,
                    color: '64748b', // Slate-500
                    align: 'center'
                });
            }

            // Salary (if shown)
            if (node.data.showSalary && node.data.salary) {
                // Separator line
                slide.addShape('line', {
                    x: x + pxToIn(20), y: y + pxToIn(120), w: w - pxToIn(40), h: 0,
                    line: { color: 'f1f5f9', width: 1 } // Slate-100
                });

                slide.addText(node.data.salary, {
                    x: x, y: y + pxToIn(125), w: w, h: 0.2,
                    fontSize: 12,
                    bold: true,
                    color: '059669', // Emerald-600
                    align: 'center'
                });
            }
        });

        pptx.writeFile({ fileName: 'OrgChart_Editable.pptx' });
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
