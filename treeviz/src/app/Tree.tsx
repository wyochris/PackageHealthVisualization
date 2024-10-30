import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface TreeProps {
    nodes: any;
    links: any;
    rootNode: number;
}

// d3 force directed tree graph used as reference: https://observablehq.com/@d3/force-directed-tree
const Tree: React.FC<TreeProps> = ({ nodes, links, rootNode }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const width = window.innerWidth; 
    const height = window.innerHeight - 49.5; // 49.5 is the height of the header

    useEffect(() => {

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // delete previous 

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(20).strength(0.5))
            .force("charge", d3.forceManyBody().strength(-50))
            .force('center', d3.forceCenter(width / 2, (height - 49.5)/ 2.5))

        // Append links.
        const link = svg.append("g")
            .attr("stroke", "#999")
            .selectAll("line")
            .data(links)
            .join("line");
            
        // Append nodes.
        const node = svg
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag<SVGGElement, any>()
                .on("start", (event: any, d: any) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                
                .on("drag", (event: any, d: any) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event: any, d: any) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                })
            );

        node
            .append('circle')
            .attr('r', 20) //weight = health
            .style('fill', (d: any) => (d.id === rootNode ? 'red' : 'blue'));

        node.append("text") // labels to beinside the circle
            .text((d: any) => d.name)
            .attr('x', 12)
            .attr('y', 4)
            .style('font-size', '12px')
            .style('fill', '#777');

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

                node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

        });

        return () => {
            simulation.stop();
          };

    }, [nodes, links, rootNode]);

    return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default Tree;
