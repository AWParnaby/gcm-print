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
  .option('-l, --logo <file>', 'Logo image file (PNG, JPG, SVG)')
  .option('-c, --cards-per-page <number>', 'Number of cards per page (2-20)', parseInt, 10)
  .option('-t, --title-cards <number>', 'Number of title cards per participant (0-50)', parseInt, 10)
  .option('--no-title-cards', 'Skip title card generation')
  .parse(process.argv);

const options = program.opts();

// Handle --no-title-cards flag (overrides -t if both are provided)
if (options.titleCards === false) {
  options.titleCards = 0;
}

app.run(options);
