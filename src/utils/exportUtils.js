import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

export const exportToPNG = async (elementId, nodes, fileName = 'org-chart.png') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // SIMPLE APPROACH: Use a very large canvas that will capture everything
    // Let html2canvas figure out the rest
    const targetWidth = 8000;  // Very large width
    const targetHeight = 6000; // Very large height

    try {
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
                    // Make container huge
                    clonedElement.style.width = `${targetWidth}px`;
                    clonedElement.style.height = `${targetHeight}px`;
                    clonedElement.style.overflow = 'visible';

                    // Remove UI elements
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

                    // Reset viewport to show everything from top-left
                    const viewport = clonedElement.querySelector('.react-flow__viewport');
                    if (viewport) {
                        // Center the content in our large canvas
                        viewport.style.transform = `translate(${targetWidth / 4}px, ${targetHeight / 4}px) scale(1)`;
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

    const targetWidth = 8000;
    const targetHeight = 6000;

    try {
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
        const pdf = new jsPDF({
            orientation: 'landscape',
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

export const exportToPPTX = async (elementId, nodes) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id ${elementId} not found`);
            return;
        }

        const bounds = getActualBounds(elementId);
        const padding = 250;
        const targetWidth = bounds.width + padding * 2;
        const targetHeight = bounds.height + padding * 2;

        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            width: targetWidth,
            height: targetHeight,
            windowWidth: targetWidth,
            windowHeight: targetHeight,
            x: 0,
            y: 0,
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
                        'react-flow__background',
                        'instruction-panel'
                    ];

                    classesToRemove.forEach(className => {
                        const elements = clonedElement.querySelectorAll(`.${className}`);
                        elements.forEach(el => el.remove());
                    });

                    const viewport = clonedElement.querySelector('.react-flow__viewport');
                    if (viewport) {
                        const translateX = -bounds.x + padding;
                        const translateY = -bounds.y + padding;

                        viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(1)`;
                    }

                    // 4. Ensure SVG edges are visible
                    const edgesSvg = clonedElement.querySelector('.react-flow__edges');
                    if (edgesSvg) {
                        edgesSvg.style.overflow = 'visible';
                        edgesSvg.style.width = '100%';
                        edgesSvg.style.height = '100%';
                    }
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');

        const pptx = new PptxGenJS();
        const slide = pptx.addSlide();

        slide.addText("Organization Chart", { x: 0.5, y: 0.5, fontSize: 18, bold: true });

        // Fit image to slide (keeping aspect ratio)
        // Slide size is 10x5.625 inches
        slide.addImage({
            data: imgData,
            x: 0.5,
            y: 1.0,
            w: 9.0,
            h: 4.0,
            sizing: { type: 'contain', w: 9.0, h: 4.0 }
        });

        pptx.writeFile({ fileName: 'OrgChart.pptx' });

    } catch (error) {
        console.error("Error exporting to PPTX:", error);
        alert("Failed to export PPTX.");
    }
};

export const exportToDOCX = async (elementId, nodes) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id ${elementId} not found`);
            return;
        }

        const bounds = getActualBounds(elementId);
        const padding = 250;
        const targetWidth = bounds.width + padding * 2;
        const targetHeight = bounds.height + padding * 2;

        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            width: targetWidth,
            height: targetHeight,
            windowWidth: targetWidth,
            windowHeight: targetHeight,
            x: 0,
            y: 0,
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
                        'react-flow__background',
                        'instruction-panel'
                    ];

                    classesToRemove.forEach(className => {
                        const elements = clonedElement.querySelectorAll(`.${className}`);
                        elements.forEach(el => el.remove());
                    });

                    const viewport = clonedElement.querySelector('.react-flow__viewport');
                    if (viewport) {
                        const translateX = -bounds.x + padding;
                        const translateY = -bounds.y + padding;

                        viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(1)`;
                    }

                    // 4. Ensure SVG edges are visible
                    const edgesSvg = clonedElement.querySelector('.react-flow__edges');
                    if (edgesSvg) {
                        edgesSvg.style.overflow = 'visible';
                        edgesSvg.style.width = '100%';
                        edgesSvg.style.height = '100%';
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


