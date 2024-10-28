// function reading the csv file
// function to create the tree structure
// function to export data for each node

import path, { parse } from "path";

type Node = {
    numNodes: number;
    name: string;
    weight: number;
    root: Node;
    fromNodes: Node[];
    toNodes: Node[];
}

// read csv
const fs = require("fs");
const csv = require("csv-parser");

export function readCSV(file: string) {
    const csvFilePath = path.resolve(__dirname, 'treeExanple.csv');

  const headers = [];

  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  
}