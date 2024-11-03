#!/usr/bin/env node

const { program } = require('commander');
const execSync = require('child_process').execSync;
const fs = require('node:fs');

program
  .version('1.0.0')
  .description('Outputs package scores for given raw tree file')
  .requiredOption('-sf, --scoring_data_filename <scoring_data_filename>', "Scording Data Filename", "scoring_data_file")
  .requiredOption('-rf, --raw_file <filename>', "Raw File", "raw_tree")
  .action(async (options) => {
    console.log("Running package scoring");
    const curPath = execSync(`pwd`, { encoding: 'utf-8' }).slice(0,-1); // remove newline
    const raw_file = execSync(`cat ${options.raw_file}`, { encoding: 'utf-8' });  // the default is 'buffer'
    const tree_names = getTreeNames(raw_file);
    // make a punch of parallel arrays for fileContents
    /*
    changed col order to match sheet
    
    packageNames,
    {
    "numDependents": 7779,
        "numDependencies": 6,
        "numVersions": 905,
        "weeklyDownloads": 3240041,
        "unpackedSize": 351,
        "totalFiles": 43,
        "issues": 254,
        "pullRequests": 14,
        "lastPublished": 2
    },
    scores
        */
    // function delay(ms) {
    //     return new Promise(resolve => setTimeout(resolve, ms));
    //   }
    // await delay(3000).then (() => console.log('Hello after 3 seconds'));

    // console.log(tree_names);

    const promiseGenerators = tree_names.map((package) => () => getScore(package));
    const results = await WithArrayReduce(promiseGenerators);

    let fileContents = 
    {
        "packageNames": [],
        "numDependents": [],
        "numDependencies": [],
        "numVersions": [],
        "weeklyDownloads": [],
        "unpackedSize": [],
        "totalFiles": [],
        "issues": [],
        "pullRequests": [],
        "lastPublished": [],
        "scores": []
    };

    for (let i = 0; i < results.length; i++) {
        // console.log(Object.keys(results[i]));
        fileContents.packageNames.push(tree_names[i]);
        fileContents.numDependents.push(results[i].numDependents);
        fileContents.numDependencies.push(results[i].numDependencies);
        fileContents.numVersions.push(results[i].numVersions);
        fileContents.weeklyDownloads.push(results[i].weeklyDownloads);
        fileContents.unpackedSize.push(results[i].unpackedSize);
        fileContents.totalFiles.push(results[i].totalFiles);
        fileContents.issues.push(results[i].issues);
        fileContents.pullRequests.push(results[i].pullRequests);
        fileContents.lastPublished.push(results[i].lastPublished);
    }
    
    let scoring_data = fileContentsToTreeScores(fileContents);
    fs.writeFile(`${curPath}/${options.scoring_data_filename}`,
        scoring_data,
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

function getTreeNames (raw_tree) {
    let raw_rows = raw_tree.split('\n');
    if (raw_rows.length == 0) {
        return "";
    }

    // ignore the current package, obvs
    let names = [];
    for (let i = 1; i < raw_rows.length; i++) {
        let curRow = raw_rows[i];
        if (!curRow) {
            break;
        }
        let curValue = parseNode(curRow);
        names.push(curValue);
    }
    return names;
    // return fileContentsToTreeScores(toRet);
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

async function getScore(packageName) {
    // localhost:8083/getPackageData/${packageName}
    let data = {};
        try {
            data = await fetch("http://localhost:8083/getPackageData/"+packageName, { // Always /0, to get days surrounding
                // mode: 'no-cors',
                method: 'GET',
                headers: {
                        "Content-Type": "application/json"
                }
            })
            .then(response=>response.json());
            // console.log("Data schema: "+Object.keys(data));
            console.log("Loaded: "+packageName);
            return data;
        } catch(err) {
            console.log("Error: "+err);
            return {};
        }
}

function fileContentsToTreeScores(fileContents) {
    // console.log("glorp here");
    let toRet = "";
    let colNames = Object.keys(fileContents)+",\n";
    // console.log("Senseless crime: ");
    // console.log(colNames);
    // console.log(fileContents.packageNames);
    // console.log(fileContents.numDependents);
    toRet += colNames;
    for (let i = 0; i < fileContents.packageNames.length; i++) {
        let packageNames = fileContents.packageNames[i];
        let numDependents = fileContents.numDependents[i];
        let numDependencies = fileContents.numDependencies[i];
        let numVersions = fileContents.numVersions[i];
        let weeklyDownloads = fileContents.weeklyDownloads[i];
        let unpackedSize = fileContents.unpackedSize[i];
        let totalFiles = fileContents.totalFiles[i];
        let issues = fileContents.issues[i];
        let pullRequests = fileContents.pullRequests[i];
        let lastPublished = fileContents.lastPublished[i];
        let scores = fileContents.scores[i];
        let row = `${packageNames},${numDependents},${numDependencies},${numVersions},${weeklyDownloads},${unpackedSize},${totalFiles},${issues},${pullRequests},${lastPublished},${scores},\n`;
        toRet += row;
    }
    return toRet;
}

async function WithArrayReduce(promises) {
    const accPromise = promises.reduce((acc, promise) => {
      return acc.then((arr) => promise().then((response) => [...arr, response]));
    }, Promise.resolve([]));
    const result = await accPromise;
    return result;
}