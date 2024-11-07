import React from 'react';
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
      const filesData: Record<string, any> = {}; // Store data for all files
      let filesProcessed = 0;

      for (let file of folder) {
        parse(file, {
          complete: (result) => {
            filesData[file.name] = csvToTreeData(result.data as string[][]); 
            filesProcessed += 1;

            if (filesProcessed === folder.length) {
              setCsvData(filesData); 
              sessionStorage.setItem("csvFilesData", JSON.stringify(filesData)); 
            }
          },
          header: false,
        });
      }
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileUpload} />
    </div>
  );
}


export default CsvParser;
