"use client"

import React, { useState, useEffect } from 'react';
import TreeVisualizer from './TreeVisualizer';
import CsvParser from './CsvParser';

const TreeVisualizerPage: React.FC = () => {
  const [csvData, setCsvData] = useState<any>(null);

  const handleDataSave = (data: Record<string, any>) => {
    setCsvData(data['tree_file']); 
    sessionStorage.setItem("csvFilesData", JSON.stringify(data)); 
  };

  return (
    <div>
      <h1>Tree Visualizer</h1>
      <CsvParser setCsvData={handleDataSave} subTreeId={-1} />
      <TreeVisualizer csvData={csvData} />
    </div>
  );
};

export default TreeVisualizerPage;
