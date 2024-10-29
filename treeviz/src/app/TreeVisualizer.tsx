"use client"

import React from 'react';
import Tree from './Tree';

interface TreeVisualizerProps {
  csvData: { nodes: any; links: any; rootNode: number } | null;
}

const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ csvData }) => {
  return csvData ? (
    <div>
      <Tree nodes={csvData.nodes} links={csvData.links} rootNode={csvData.rootNode} />
    </div>
  ) : (
    <p>Please upload a CSV file to visualize the tree.</p>
  );
};

export default TreeVisualizer;
