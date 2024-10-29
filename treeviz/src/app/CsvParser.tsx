"use client"
// recieves csv data and sends string[][] to util/csvToTreeData
import { parse } from 'papaparse';
import { csvToTreeData } from '../utils/csvToTreeData';

interface CsvParserProps {
  setCsvData: React.Dispatch<React.SetStateAction<any>>;
}

const CsvParser: React.FC<CsvParserProps> = ({ setCsvData }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parse(file, {
        complete: (result) => {
          const treeData = csvToTreeData(result.data as string[][]);
          setCsvData(treeData); // Set parsed tree data
        },
        header: false,
      });
    }
  };

  return <input type="file" accept=".csv" onChange={handleFileUpload} />;
};

export default CsvParser;
