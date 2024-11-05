"use client"

import React, { useEffect, useState } from 'react';
import TreeVisualizer from '../TreeVisualizer';
import CsvParser from '../CsvParser';
import { useParams } from 'next/navigation';

const TreeVisualizerPage: React.FC = () => {
  const [csvData, setCsvData] = useState<any>();
  const [nodeId, setNodeId] = useState<number | null>();
  const { subtreeId } = useParams();

  useEffect(() => {
      async function fetchData() {
        setNodeId(Number(subtreeId));
      }
      fetchData();
  }, [subtreeId]);

  return (
    <div>
      <h1>Tree Visualizer</h1>
      <CsvParser setCsvData={setCsvData} subTreeId={nodeId ? nodeId : -1} />
      <TreeVisualizer csvData={csvData} />
    </div>
  );
};

export default TreeVisualizerPage;
