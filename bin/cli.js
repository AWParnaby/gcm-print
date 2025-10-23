#!/usr/bin/env node

const { Command } = require('commander');
const app = require('../src/index');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('gcm-print')
  .description('Generate printable PDF cards for Group Concept Mapping workshops')
  .version(packageJson.version)
  .requiredOption('-i, --input <file>', 'CSV file with responses')
  .requiredOption('-n, --participants <number>', 'Number of participants', parseInt)
  .option('-o, --output <file>', 'Output PDF filename', 'gcm-cards.pdf')
  .parse(process.argv);

const options = program.opts();

app.run(options);
