#!/usr/bin/env node

const { program } = require('commander');

program
  .version('1.0.0')
  .description('My CLI Command')
  .option('-n, --name <name>', 'Your name', 'World')
  .option('-g, --greeting <greeting>', 'Greeting message', 'Hello')
  .action((options) => {
    console.log(`${options.greeting}, ${options.name}!`);
  });

program.parse(process.argv);