#!/usr/bin/env node

const { program } = require('commander');
const execSync = require('child_process').execSync;
const fs = require('node:fs');
const TreeNode = require('./tree.js');
const Stack = require('./stack.js');

program
  .version('1.0.0')
  .description('Outputs tree folder for given raw tree file')
  .requiredOption('-tf, --tree_filename <tree_filename>', "Tree Filename", "tree_file")
  .requiredOption('-tfn, --tree_foldername <tree_foldername>', "Tree Foldername", "tree_file")
  .requiredOption('-rf, --raw_file <filename>', "Raw File", "raw_tree")
  .requiredOption('-s, --tree_size_limit <size>', "Tree Size Limit", "30")
  .action((options) => {
    const curPath = execSync(`pwd`, { encoding: 'utf-8' }).slice(0,-1); // remove newline
    const raw_file = execSync(`cat ${options.raw_file}`, { encoding: 'utf-8' });  // the default is 'buffer'
    if (fs.existsSync(`./${options.tree_foldername}/`)) {
        execSync(`rm -r ${options.tree_foldername}`, { encoding: 'utf-8' });  // the default is 'buffer'
    } 
    execSync(`mkdir ${options.tree_foldername}`, { encoding: 'utf-8' });  // the default is 'buffer'

    let tree = rawToTree(raw_file);
    let subtrees = {}; // "set" of subtree roots; is if (typeof subtrees[idx] !== 'undefined')
        // schema is the idx to the node
    getSubtrees(tree, subtrees, options.tree_size_limit); // store indices, line numbers
    let subtreeMinScores = {};
    getSubtreeMinScores(tree, subtrees, subtreeMinScores); // store indices, line numbers

    let subtreeList = Object.keys(subtrees);
    for (let i = 0; i < subtreeList.length; i++) {
        let idx = subtreeList[i];
        let curNode = subtrees[idx];
        let fileContents = {
            numNodes:0,
            names:[],
            weights:[],
            subtreeSizes:[],
            root:idx,
            edges:[]
        };
        // gets the subtree file (stemmed from other subtrees)
        let subtree_file = 
          treeToSubtreeFile(curNode, subtrees, subtreeMinScores, fileContents);
        // options.tree_foldername
        fs.writeFile(`${curPath}/${options.tree_foldername}/node_${idx}_subtree_file`,
            subtree_file,
            err => {
                if (err) {
                    console.error(err);
                } else {
                    // file written successfully
                    console.log("File written successfully!");
                }
        });
    }
    // the starting point; from the root to the first subtrees
    const tree_file = treeToSubtreeFile(tree, subtrees, subtreeMinScores, {
        numNodes:0,
        names:[],
        weights:[],
        subtreeSizes:[],
        root:1,
        edges:[]
    });
    fs.writeFile(`${curPath}/${options.tree_foldername}/${options.tree_filename}`,
        tree_file,
        err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
                console.log("File written successfully!");
            };});
});

program.parse(process.argv);

/*
Algorithm
For chunking the nodes to make the trees visualize better
- Pretty simple recurse up until you get like size 50 or whatever, then pop on that node as one of the reduce ones, and pretend size 1 when returning up after "pruning off" the bottom of the tree
  - Top down would be harder to do
- Then process the subtrees for each of these nodes as their own tree file (regardings any of the other in the list as dead ends/single nodes)
  - Give the dead ends special names
- This whole process will returns a folder of tree files
  - Keep track of each outputted tree file's name
  - We'll then return a super tree file that contains the tree file names as their nodes and use this structure to link them all together
    - Node size will be how many nodes each node links to (so normal nodes are like all the same size, but ones to other trees are scaled to the number of nodes they point to)
      - We can calculate the number of nodes in each subtree during the inital simple recurse and refer to these sizes in the super tree file creation
- Color by the minimum quality the subtree of the node represents
*/

// recurse and get the indices of subroots (subtrees) of treeSizeLimit or less
    // return the size of the tree
function getSubtrees(root, subtrees, treeSizeLimit) {
    // console.log("subtree root: "+root.idx);
    let descendants = root.descendants;
    if (!descendants) {
        return 1;
    }
    if (treeSizeLimit-(1+descendants.length) <= 0) {
        throw new Error('Too many children, increase treeSizeLimit: '+root.value);
    }
    let sizeLeft = treeSizeLimit-1; // size including the children
    // sort children by size
        // then put the least ones in this group while there's space for em
        // if there isn't space, start putting them in their own subtrees
            // this way we maximize efficiency of tree pages
    let subtreeResults = [];
    // console.log("descendants glenth: "+descendants.length);
    for (let i = 0; i < descendants.length; i++) {
        let child = descendants[i];
        // console.log(child.value);
        let subtreeSize = getSubtrees(child, subtrees, treeSizeLimit);
        subtreeResults.push({size:subtreeSize,node:child});
    }
    // least to greatest by size
    let sortedResults = subtreeResults.sort((a, b) => {
        if (a.size > b.size) {
            return 1;
        }
        if (a.size < b.size) {
            return -1;
        }
        return 0;
        });
    for (let i = 0; i < sortedResults.length; i++) {
        let curResult = sortedResults[i];
        if (sizeLeft - curResult.size >= 0) { // we wouldn't run out
            sizeLeft -= curResult.size;
        } else { // we would ru out, reduced to a size one pointer essentially
            sizeLeft--; // only removing one thing
            subtrees[curResult.node.idx] = curResult.node;
        }
    }
    return treeSizeLimit-sizeLeft;
}

function rawToTree(raw_tree) {
    let almost_ripe = rawToTreeHelper(raw_tree);
    // console.log(Object.values(almost_ripe));
    addSubtreeSizes(almost_ripe);
    return almost_ripe;
}

// returns the tree sizes up and modifies tree as it goes
function addSubtreeSizes(root) {
    let descendants = root.descendants;
    if (!descendants) {
        return;
    }
    let toRet = 1; // root alone size
    for (let i = 0; i < descendants.length; i++) {
        let cur = descendants[i];
        toRet += addSubtreeSizes(cur);
    }
    root.subtreeSize = toRet;
    return toRet;
}

function rawToTreeHelper (raw_tree) {
    let raw_rows = raw_tree.split('\n');
    if (raw_rows.length == 0) {
        return "";
    }
    const rootName = parseNode(raw_rows[0]);
    const root = new TreeNode(rootName,getScore(rootName),1,0,-1); // subtreesize not applicable yet
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
        let curScore = getScore(curValue);
        let curNode = new TreeNode(curValue, curScore, curIdx, curDepth, -1); // can't say subtree size yet

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

    return root;
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

// updates em
function getSubtreeMinScores(root, subtrees, subtreeMinScores) {
    let descendants = root.descendants;
    let toRet = root.score; // root alone size
    if (!descendants) {
        return toRet;
    }
    for (let i = 0; i < descendants.length; i++) {
        let cur = descendants[i];
        toRet = Math.min(toRet,getSubtreeMinScores(cur, subtrees, subtreeMinScores));
    }
    if (typeof subtrees[root.idx] !== 'undefined') {
        subtreeMinScores[root.idx] = toRet;
    }
    return toRet;
}

function getScore(value) {
    return -1;
}

// Updated MultiTree.csv structure:
// {# nodes}
// {names of nodes} <- for subtree nodes will have SUBTREE_NODE prepended to the names
// {weights of nodes} <- for subtree nodes will be the minimum of all children's scores
// {subtree sizes}
// {root node #}
// {from node 1},{to node 1}
// {from node 2},{to node 2}
// …
// {from node n},{to node n}
function helper(root, subtrees, subtreeMinScores, fileContents) {
    let descendants = root.descendants;
    if (!descendants) {
        return;
    }
    fileContents.numNodes = fileContents.numNodes+1; // we don't know size yet for multitree
    fileContents.names.push(root.value);
    fileContents.weights.push(root.score);
    fileContents.subtreeSizes.push(root.subtreeSize);
    for (let i = 0; i < descendants.length; i++) {
        let cur = descendants[i];
        let idx = cur.idx;
        fileContents.edges.push(root.idx+","+cur.idx);
        if (typeof subtrees[idx] !== 'undefined') { // don't do another subtree
            fileContents.numNodes = fileContents.numNodes+1 // we don't know size yet for multitree
            fileContents.names.push("SUBTREE_NODE"+cur.value); // special marker
            fileContents.weights.push(subtreeMinScores[idx]);
            fileContents.subtreeSizes.push(cur.subtreeSize);
        } else {
            helper(cur, subtrees, subtreeMinScores, fileContents);
        }
    }
}

function treeToSubtreeFile(root, subtrees, subtreeMinScores, fileContents) {
    helper(root, subtrees, subtreeMinScores, fileContents);

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
    const subtreeSizes = fileContents.subtreeSizes
    .reduce((total, subtreeSize) => {
        return `${total}${subtreeSize},`;
      }, "");
    const numNodes = fileContents.numNodes;  

    //yeah it needs to be indented like this
let toRet = `${numNodes+"".trim()},
${names+"".trim()}
${weights+"".trim()}
${subtreeSizes+"".trim()}
${fileContents.root+"".trim()},${edges}`;
    return toRet;
}