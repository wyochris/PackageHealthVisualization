"use client"
// recieves csv data and sends string[][] to util/csvToTreeData
import { parse } from 'papaparse';
import { csvToTreeData } from '../utils/csvToTreeData';

interface CsvParserProps {
  setCsvData: React.Dispatch<React.SetStateAction<any>>;
}

const CsvParser: React.FC<CsvParserProps> = ({ setCsvData }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const folder = event.target.files;
    if (folder) {
      for (let file of folder) {
        console.log(file.webkitRelativePath)
        parse(file, {
          complete: (result) => {
            const treeData = csvToTreeData(result.data as string[][]);
            setCsvData(treeData); // Set parsed tree data
          },
          header: false,
        });
      }
    }
  };

  return <input type="file" accept="" ref={input => { if (input) input.webkitdirectory = true; }} onChange={handleFileUpload} />;
};

export default CsvParser;
