import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';

export const exportToPNG = async (elementId, nodes, fileName = 'org-chart.png') => {
    const element = document.getElementById(elementId);
    if (!element) {
        alert("Chart element not found!");
        return;
    }

    try {
        // Use html-to-image instead of html2canvas for better React Flow support
        // Add extra padding to capture full vertical charts
        const extraPadding = 1500; // Extra padding for vertical charts
        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                // Exclude React Flow controls
                if (node.classList) {
                    return !node.classList.contains('react-flow__controls') &&
                        !node.classList.contains('react-flow__minimap') &&
                        !node.classList.contains('react-flow__attribution') &&
                        !node.classList.contains('react-flow__background');
                }
                return true;
            },
            width: element.scrollWidth + extraPadding,
            height: element.scrollHeight + extraPadding,
            style: {
                transform: 'none',
                transformOrigin: 'top left'
            }
        });

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
        const extraPadding = 1500;
        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                if (node.classList) {
                    return !node.classList.contains('react-flow__controls') &&
                        !node.classList.contains('react-flow__minimap') &&
                        !node.classList.contains('react-flow__attribution') &&
                        !node.classList.contains('react-flow__background');
                }
                return true;
            },
            width: element.scrollWidth + extraPadding,
            height: element.scrollHeight + extraPadding,
            style: {
                transform: 'none',
                transformOrigin: 'top left'
            }
        });

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
            height: element.scrollHeight
        });

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

        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            filter: (node) => {
                if (node.classList) {
                    return !node.classList.contains('react-flow__controls') &&
                        !node.classList.contains('react-flow__minimap') &&
                        !node.classList.contains('react-flow__attribution') &&
                        !node.classList.contains('react-flow__background');
                }
                return true;
            },
            width: element.scrollWidth,
            height: element.scrollHeight
        });

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
