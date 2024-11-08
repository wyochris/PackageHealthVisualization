"use client"

import React, { useEffect, useState } from 'react';
import TreeVisualizer from '../TreeVisualizer';
import { useParams } from 'next/navigation';

const SubTreePage: React.FC = () => {
  const [csvData, setCsvData] = useState<any>(null);
  const { subtreeId } = useParams();

  useEffect(() => {
    const storedFilesData = sessionStorage.getItem("csvFilesData");

    if (storedFilesData) {
      try {
        const parsedFilesData = JSON.parse(storedFilesData);
        const specificSubTreeData = parsedFilesData[`node_${subtreeId}_subtree_file`];

        if (specificSubTreeData) {
          setCsvData(specificSubTreeData);
        } else {
          console.warn(`Subtree data for ID node_${subtreeId}_subtree_file not found.`);
        }
      } catch (error) {
        console.error("Error parsing csvFilesData from sessionStorage:", error);
      }
    } else {
      console.warn("No csvFilesData found in sessionStorage.");
    }
  }, [subtreeId]);

  return (
    <div>
      <h1>Subtree Visualizer for ID {subtreeId}</h1>
      {csvData ? (
        <TreeVisualizer csvData={csvData} />
      ) : (
        <p></p>
      )}
    </div>
  );
};

export default SubTreePage;
