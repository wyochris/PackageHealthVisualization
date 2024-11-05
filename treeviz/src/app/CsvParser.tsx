"use client"
// recieves csv data and sends string[][] to util/csvToTreeData
import { parse } from 'papaparse';
import { csvToTreeData } from '../utils/csvToTreeData';

interface CsvParserProps {
  setCsvData: React.Dispatch<React.SetStateAction<any>>;
  subTreeId: number;
}

const CsvParser: React.FC<CsvParserProps> = ({ setCsvData, subTreeId }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const folder = event.target.files;
    if (folder) {
      for (let file of folder) {
        if(subTreeId == -1) {
          if(file.name === "tree_file") {
            parse(file, {
              complete: (result) => {
                const treeData = csvToTreeData(result.data as string[][]);
                setCsvData(treeData); // Set parsed tree data
              },
              header: false,
            });
          }
        }
        else {
          if(file.name === "node_" + subTreeId + "_subtree_file") {
            parse(file, {
              complete: (result) => {
                const treeData = csvToTreeData(result.data as string[][]);
                setCsvData(treeData); // Set parsed tree data
              },
              header: false,
            });
          }
        }
      }
    }
  };

  return <input type="file" accept="" ref={input => { if (input) input.webkitdirectory = true; }} onChange={handleFileUpload} />;
}


export default CsvParser;
