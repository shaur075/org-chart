import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3-selection';

const OrgChartComponent = ({ data }) => {
    const d3Container = useRef(null);
    const chartRef = useRef(null);

    useLayoutEffect(() => {
        if (data && d3Container.current) {
            console.log("OrgChartComponent: Rendering with data", data);

            // Clear previous chart
            d3Container.current.innerHTML = '';

            // ALWAYS create a new instance to avoid state issues
            const chart = new OrgChart();
            chartRef.current = chart;

            // Check if data is valid (must have at least one root)
            // Root is defined as having parentId === '' or null or undefined
            const roots = data.filter(d => !d.parentId || d.parentId === '');
            console.log("OrgChartComponent: Found roots", roots);

            if (roots.length === 0) {
                console.error("No root node found in data. Data dump:", data);
                d3Container.current.innerHTML = '<div style="padding:20px; color:red">Error: No root node found (Employee with no supervisor).</div>';
                return;
            }

            // Check for orphans (nodes with parentId that doesn't exist)
            const allIds = new Set(data.map(d => d.id));
            const orphans = data.filter(d => d.parentId && !allIds.has(d.parentId));
            if (orphans.length > 0) {
                console.warn("Found orphaned nodes:", orphans);
                // Optional: You could alert the user here or handle it gracefully
            }

            try {
                chart
                    .container(d3Container.current)
                    .data(data)
                    .nodeWidth(d => 250)
                    .nodeHeight(d => 140)
                    .childrenMargin(d => 50)
                    .compactMarginBetween(d => 25)
                    .compactMarginPair(d => 50)
                    .siblingsMargin(d => 25)
                    .initialExpandLevel(5) // Force expand all levels
                    .linkUpdate(function (d, i, arr) {
                        d3.select(this)
                            .attr("stroke", d => d.data._upToTheRootHighlighted ? '#152785' : '#E4E2E9')
                            .attr("stroke-width", d => d.data._upToTheRootHighlighted ? 5 : 1);

                        if (d.data.reportingType === 'Dotted') {
                            d3.select(this).attr("stroke-dasharray", "6,6");
                        }
                    })
                    .nodeContent(function (d, i, arr, state) {
                        const isVacant = !d.data.name || d.data.name.toLowerCase() === 'vacant';
                        const borderStyle = isVacant ? '2px dashed #999' : '1px solid #E4E2E9';
                        const bgColor = isVacant ? '#fafafa' : '#ffffff';
                        const name = isVacant ? 'Vacant' : d.data.name;

                        const width = d.width || 250;
                        const height = d.height || 140;

                        return `
                <div style="font-family: 'Calibri', sans-serif; background-color:${bgColor}; position:absolute;margin-top:-1px; margin-left:-1px;width:${width}px;height:${height}px;border-radius:10px;border: ${borderStyle}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color:${isVacant ? '#eee' : '#2563eb'};position:absolute;margin-top:-25px;margin-left:15px;border-radius:100px;width:50px;height:50px;display:flex;align-items:center;justify-content:center; color:white; font-weight:bold; font-size:20px; border: 2px solid white;">
                    ${name.charAt(0).toUpperCase()}
                </div>
                <div style="padding:20px; padding-top:35px;text-align:center">
                    <div style="color:#111672;font-size:16px;font-weight:bold"> ${name} </div>
                    <div style="color:#404040;font-size:14px;margin-top:4px"> ${d.data.designation} </div>
                    <div style="color:#404040;font-size:14px;margin-top:4px"> Band: ${d.data.band || 'N/A'} </div>
                    <div style="color:#404040;font-size:14px;margin-top:4px"> ${d.data.function || ''} </div>
                </div> 
                </div>
            `;
                    })
                    .render();

                chart.expandAll(); // Ensure nodes are visible
                chart.fit(); // Fit the chart to the container
            } catch (e) {
                console.error("D3 Rendering Error:", e);
                d3Container.current.innerHTML = `<div style="padding:20px; color:red">Error rendering chart: ${e.message}</div>`;
            }
        }
    }, [data]);

    return (
        <div className="org-chart-container" style={{ height: '80vh', width: '100%', backgroundColor: '#f0f2f5', position: 'relative' }}>
            <div ref={d3Container} />
        </div>
    );
};

export default OrgChartComponent;
