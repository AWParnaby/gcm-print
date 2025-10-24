#!/usr/bin/env node

const { Command } = require('commander');
const sorting = require('../src/sorting');
const rating = require('../src/rating');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('gcm-print')
  .description('Generate printable PDF worksheets for Group Concept Mapping workshops')
  .version(packageJson.version);

// Sorting command - generates randomized card decks for pile sorting activity
program
  .command('sorting')
  .description('Generate randomized card decks for pile sorting activity')
  .requiredOption('-i, --input <file>', 'CSV file with responses')
  .requiredOption('-n, --participants <number>', 'Number of participants', parseInt)
  .option('-o, --output <file>', 'Output PDF filename', 'gcm-cards.pdf')
  .option('-l, --logo <file>', 'Logo image file (PNG, JPG, SVG)')
  .option('-c, --cards-per-page <number>', 'Number of cards per page (2-20)', parseInt, 10)
  .option('-t, --title-cards <number>', 'Number of title cards per participant (0-50)', parseInt, 10)
  .option('--no-title-cards', 'Skip title card generation')
  .action((options) => {
    // Handle --no-title-cards flag (overrides -t if both are provided)
    if (options.titleCards === false) {
      options.titleCards = 0;
    }
    sorting.run(options);
  });

// Rating command - generates rating sheets for structured assessment activity
program
  .command('rating')
  .description('Generate rating sheets for structured assessment activity')
  .requiredOption('-i, --input <file>', 'CSV file with responses')
  .requiredOption('-n, --participants <number>', 'Number of rating sheets to generate', parseInt)
  .option('-o, --output <file>', 'Output PDF filename', 'gcm-rating-sheets.pdf')
  .option('-c, --criteria <list>', 'Comma-separated list of rating criteria', 'Rating')
  .option('-l, --logo <file>', 'Logo image file (PNG, JPG, SVG)')
  .option('-p, --page-size <size>', 'Paper size: letter or a4', 'a4')
  .option('--orientation <type>', 'Page orientation: portrait or landscape (default: auto)')
  .option('--separator-pages', 'Add separator pages between participants')
  .option('--double-sided', 'Insert blank pages to ensure each participant starts on a new sheet when printing double-sided')
  .action((options) => {
    rating.run(options);
  });

program.parse(process.argv);
