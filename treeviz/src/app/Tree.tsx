import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface TreeProps {
  nodes: (d3.SimulationNodeDatum & { id: number; name: string; weight: number })[];
  links: { source: number; target: number }[];
  rootNode: number;
}

const Tree: React.FC<TreeProps> = ({ nodes, links, rootNode }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous renders

    // TODO: draw the links and weights
    const link = svg
    // TODO: draw nodes and label them
    const node = svg
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')


      }, [nodes, links, rootNode]);

  return <svg></svg>;
};

export default Tree;
