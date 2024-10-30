"use client"

import React, { useState } from 'react';
import TreeVisualizer from './TreeVisualizer';
import CsvParser from './CsvParser';

const TreeVisualizerPage: React.FC = () => {
  const [csvData, setCsvData] = useState<any>(null);

  return (
    <div>
      <h1>Tree Visualizer</h1>
      <CsvParser setCsvData={setCsvData} />
      <TreeVisualizer csvData={csvData} />
    </div>
  );
};

export default TreeVisualizerPage;
