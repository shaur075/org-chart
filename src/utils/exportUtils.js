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
            width: element.scrollWidth,
            height: element.scrollHeight,
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
            height: element.scrollHeight,
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
                        !node.classList.contains('react-flow__background');
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
            console.error(`Element with id ${elementId} not found`);
            return;
        }

        const targetWidth = 8000;
        const targetHeight = 6000;

        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            width: targetWidth,
            height: targetHeight,
            windowWidth: targetWidth,
            windowHeight: targetHeight,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    clonedElement.style.width = `${targetWidth}px`;
                    clonedElement.style.height = `${targetHeight}px`;
                    clonedElement.style.overflow = 'visible';

                    const classesToRemove = [
                        'react-flow__controls',
                        'react-flow__minimap',
                        'react-flow__attribution',
                        'react-flow__background',
                        'instruction-panel'
                    ];

                    classesToRemove.forEach(className => {
                        const elements = clonedElement.querySelectorAll(`.${className}`);
                        elements.forEach(el => el.remove());
                    });

                    const viewport = clonedElement.querySelector('.react-flow__viewport');
                    if (viewport) {
                        viewport.style.transform = `translate(${targetWidth / 4}px, ${targetHeight / 4}px) scale(1)`;
                    }
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');

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
                                data: Uint8Array.from(atob(imgData.split(',')[1]), c => c.charCodeAt(0)),
                                transformation: {
                                    width: 600,
                                    height: 400, // This might distort aspect ratio if not careful, but docx requires explicit size
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


