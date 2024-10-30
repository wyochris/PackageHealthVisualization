import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface TreeProps {
    nodes: any;
    links: any;
    rootNode: number;
}

const Tree: React.FC<TreeProps> = ({ nodes, links, rootNode }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        // Specify the chart’s dimensions.
        const width = 928;
        const height = 600;

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(0).strength(1))
            .force("charge", d3.forceManyBody().strength(-50))
            .force("x", d3.forceX())
            .force("y", d3.forceY());

        // Create the container SVG.
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Append links.
        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line");

        // Append nodes.
        const node = svg.append<SVGGElement>("g")
            .attr("fill", "#fff")
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .selectAll<SVGCircleElement, any>("circle")
            .data(nodes)
            .join("circle")
            .attr("fill", (d: any) => d.children ? null : "#000")
            .attr("stroke", (d: any) => d.children ? null : "#fff")
            .attr("r", 3.5)
            .call(d3.drag<SVGCircleElement, any>()
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
                }));

        node.append("text")
            .text((d: any) => d.name);

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);
        });

    }, [nodes, links, rootNode]);

    return <svg ref={svgRef}></svg>;
};

  //   // Specify the chart’s dimensions.
  //   const width = 928;
  //   const height = 600;
  
  //   // Compute the graph and start the force simulation.
  //   const root = rootNode;

  //   const simulation = d3.forceSimulation(nodes)
  //       .force("link", d3.forceLink(links).id((d: any) => d.id).distance(0).strength(1))
  //       .force("charge", d3.forceManyBody().strength(-50))
  //       .force("x", d3.forceX())
  //       .force("y", d3.forceY());
  
  //   // Create the container SVG.
  //   const svg = d3.create("svg")
  //       .attr("width", width)
  //       .attr("height", height)
  //       .attr("viewBox", [-width / 2, -height / 2, width, height])
  //       .attr("style", "max-width: 100%; height: auto;");
  
  //   // Append links.
  //   const link = svg.append("g")
  //       .attr("stroke", "#999")
  //       .attr("stroke-opacity", 0.6)
  //     .selectAll("line")
  //     .data(links)
  //     .join("line");
  
  //   // Append nodes.
  //   const node = svg.append<SVGGElement>("g")
  //       .attr("fill", "#fff")
  //       .attr("stroke", "#000")
  //       .attr("stroke-width", 1.5)
  //     .selectAll<SVGCircleElement, any>("circle")
  //     .data(nodes)
  //     .join("circle")
  //       .attr("fill", (d: any) => d.children ? null : "#000")
  //       .attr("stroke", (d: any) => d.children ? null : "#fff")
  //       .attr("r", 3.5)
  //       .call(d3.drag<SVGCircleElement, any>()
  //           .on("start", (event: any, d: any) => {
  //               if (!event.active) simulation.alphaTarget(0.3).restart();
  //               d.fx = d.x;
  //               d.fy = d.y;
  //           })
  //           .on("drag", (event: any, d: any) => {
  //               d.fx = event.x;
  //               d.fy = event.y;
  //           })
  //           .on("end", (event: any, d: any) => {
  //               if (!event.active) simulation.alphaTarget(0);
  //               d.fx = null;
  //               d.fy = null;
  //           }));
  
  //   node.append("title")
  //       .text((d: any) => d.data.name);
  
  //   simulation.on("tick", () => {
  //     link
  //         .attr("x1", (d: any)  => d.source.x)
  //         .attr("y1", (d: any)  => d.source.y)
  //         .attr("x2", (d: any)  => d.target.x)
  //         .attr("y2", (d: any)  => d.target.y);

  //     node
  //         .attr("cx", (d: any)  => d.x)
  //         .attr("cy", (d: any)  => d.y);
  //   });
    
  //   return svg.node();
  // };

export default Tree;