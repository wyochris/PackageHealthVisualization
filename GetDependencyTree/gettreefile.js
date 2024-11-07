#!/usr/bin/env node

const { program } = require('commander');
const execSync = require('child_process').execSync;
const fs = require('node:fs');
const TreeNode = require('./tree.js');
const Stack = require('./stack.js');
const csv = require('csv-parser');

program
  .version('1.0.0')
  .description('Outputs tree file for given raw tree file')
  .requiredOption('-tf, --tree_filename <tree_filename>', "Tree Filename", "tree_file")
  .requiredOption('-rf, --raw_file <filename>', "Raw File", "raw_tree")
  .requiredOption('-ps, --package_scores <filename>', "Package Scores File", "package_scores")
  .action(async (options) => {
    const curPath = execSync(`pwd`, { encoding: 'utf-8' }).slice(0,-1); // remove newline
    const raw_file = execSync(`cat ${options.raw_file}`, { encoding: 'utf-8' });  // the default is 'buffer'
    const scores = await parseCsvToObject(options.package_scores);
    const tree_file =
    // raw_file;
    rawToTreeFile(raw_file, scores);
    fs.writeFile(`${curPath}/${options.tree_filename}`,
        tree_file,
        err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
                console.log("File written successfully!");
            }
    });
});

program.parse(process.argv);

/*
Algorithm
- cur depth = number of not dashes until first dash (─)
  - also prev depth
- use a stack to keep track of current parent (will do dfs essentially)
- if cur depth is greater then add a child to stack top; push cur onto stack top
- if it is the same depth or less then pop off; push cur onto stack top
*/
function rawToTreeFile (raw_tree, scores) {
    let raw_rows = raw_tree.split('\n');
    if (raw_rows.length == 0) {
        return "";
    }
    const rootName = parseNode(raw_rows[0]);
    const root = new TreeNode(rootName,scores[rootName],1,0,-1); // subtreeSize not applicable
    let stack = new Stack();
    stack.push(root);
    let length = 0;
    
    let prevDepth = 0;
    for (let i = 1; i < raw_rows.length; i++) {
        let curRow = raw_rows[i];
        
        if (!curRow) {
            break;
        }

        let curDepth = depth(curRow);
        let curIdx = i+1; // 1-indexed
        length = Math.max(curIdx,length);
        let curValue = parseNode(curRow);
        let curScore = scores[curValue];
        let curNode = new TreeNode(curValue, curScore, curIdx, curDepth, -1); // subtree size not applicable

        if (curDepth > prevDepth) {
            let parent = stack.peek();
            parent.descendants.push(curNode);
            stack.push(curNode);
            // console.log("curstack: "+stack.items.map((x)=>x.value+","));
        } else {
            // console.log("happening");
            while (stack.peek().depth >= curDepth) {
                stack.pop(); // maybe keep popping off while the depth is less than or equal to cur
                                // this guarantees a valid parent?
            }
            let parent = stack.peek();
            // console.log("parent: "+parent.value);
            parent.descendants.push(curNode);
            stack.push(curNode);
        }
        prevDepth = curDepth;
    }

    return treeToTreeFile(root,
        {numNodes:length,
            names:[],
            weights:[],
            root:1,
            edges:[]
        });
}

function depth (curRow) {
    let arr = curRow.split("─");
    return (arr && arr.length > 0)?arr[0].length:0;
}

function parseNode(curRow) {
    for (let i = 0; i < curRow.length; i++) {
        let code = curRow.charCodeAt(i);
        if ((code > 47 && code < 58) || // numeric (0-9)
            //(code > 64 && code < 91) || // upper alpha (A-Z)
            (code > 96 && code < 123)) { // lower alpha (a-z)
            let toRet = curRow.substring(i).split(" ")[0].split("@")[0];
            return toRet;
        }
    }
    return "";
}

// Tree.csv structure:
// {# nodes}
// {names of nodes}
// {weights of nodes}
// {root node #}
// {from node 1},{to node 1}
// {from node 2},{to node 2}
// …
// {from node n},{to node n}
function helper(root, fileContents) {
    // recurse through all of the nodes and updates fileContent appropriately
    // fileContents
        // # nodes is the length
        // root node # is 1
        // weights and names are just appended to as you go since we're going same order dfs like the parse
        // add to the edge list using indice going through descendents
    /*
     {numNodes:raw_rows.length,
            names:[],
            weights:[],
            root:1,
            edges:[]
        } 

    this.value = value;
    this.score = score;
    this.idx = idx;
    this.descendants = [];
    this.parent = null;
     */
    // console.log("node: "+root.value+", idx: "+root.idx);
    let descendants = root.descendants;
    if (!descendants) {
        return;
    }
    fileContents.names.push(root.value);
    fileContents.weights.push(root.score);
    for (let i = 0; i < descendants.length; i++) {
        let cur = descendants[i];
        fileContents.edges.push(root.idx+","+cur.idx);
        helper(cur, fileContents);
    }
}

/*
     {numNodes:raw_rows.length,
            names:[],
            weights:[],
            root:1,
            edges:[]
        } 
*/
function treeToTreeFile(root, fileContents) {
    helper(root, fileContents);

    const edges = fileContents.edges
    .reduce((total, edge) => {
        return `${total}\n${edge},`;
      }, "");
    const names = fileContents.names
    .reduce((total, name) => {
        return `${total}${name},`;
      }, "");
    const weights = fileContents.weights
    .reduce((total, weight) => {
        return `${total}${weight},`;
      }, "");
    const numNodes = fileContents.numNodes;  

    //yeah it needs to be indented like this
let toRet = `${numNodes+"".trim()},
${names+"".trim()}
${weights+"".trim()}
${fileContents.root+"".trim()},${edges}`;
    return toRet;
}

function parseCsvToObject(filename) {
    return new Promise((resolve, reject) => {
      const result = {};

      fs.createReadStream(filename)
        .pipe(csv())
        .on('data', (row) => {
            // console.log("bruh");
          const [key, value] = Object.values(row);
          result[key] = value;
        })
        .on('end', () => {
          resolve(result);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }