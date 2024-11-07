"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CsvDataContextProps {
  csvFiles: FileList | null;
  setCsvFiles: React.Dispatch<React.SetStateAction<FileList | null>>;
}

const CsvDataContext = createContext<CsvDataContextProps | undefined>(undefined);

export const CsvDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [csvFiles, setCsvFiles] = useState<FileList | null>(null);

  useEffect(() => {
    const storedFiles = sessionStorage.getItem('csvFiles');
    if (storedFiles) {
      setCsvFiles(JSON.parse(storedFiles));
    }
  }, []);

  useEffect(() => {
    if (csvFiles) {
      sessionStorage.setItem('csvFiles', JSON.stringify(csvFiles));
    }
  }, [csvFiles]);

  return (
    <CsvDataContext.Provider value={{ csvFiles, setCsvFiles }}>
      {children}
    </CsvDataContext.Provider>
  );
};

export const useCsvData = () => {
  const context = useContext(CsvDataContext);
  if (context === undefined) {
    throw new Error('useCsvData must be used within a CsvDataProvider');
  }
  return context;
};
