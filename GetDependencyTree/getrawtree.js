#!/usr/bin/env node

const { program } = require('commander');
const execSync = require('child_process').execSync;
const fs = require('node:fs');

program
  .version('1.0.0')
  .description('Outputs raw tree for given project')
  .requiredOption('-p, --project_path <project_path>', "Path to package.json of desired project", "./")
  .requiredOption('-f, --filename <filename>', "Filename", "raw_tree")
  .action((options) => {
    const curPath = execSync(`pwd`, { encoding: 'utf-8' }).slice(0,-1); // remove newline
    const output = execSync(`cd ${options.project_path} && npm ls -all`, { encoding: 'utf-8' });  // the default is 'buffer'

    fs.writeFile(`${curPath}/${options.filename}`,
        output,
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

// TODO
// then a command for reading given the namme and output tree file
// finish usage
   // add install steps