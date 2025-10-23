const validator = require('./validator');
const parser = require('./parser');
const randomizer = require('./randomizer');
const generator = require('./generator');

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Main application logic
 * @param {Object} options - CLI options
 * @param {string} options.input - Path to CSV file
 * @param {number} options.participants - Number of participants
 * @param {string} options.output - Output PDF path
 */
async function run(options) {
  try {
    console.log('gcm-print - Generating workshop cards...\n');

    // Step 1: Validate inputs
    console.log('Validating inputs...');
    const validation = validator.validateInputs(options);
    if (!validation.valid) {
      console.error('Validation errors:');
      validation.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }

    // Step 2: Parse CSV file
    console.log('Parsing CSV file...');
    let responses;
    try {
      responses = await parser.parseCSV(options.input);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }

    // Step 3: Validate CSV structure
    console.log('Validating CSV structure...');
    const csvValidation = validator.validateCSVStructure(responses);
    if (!csvValidation.valid) {
      console.error(`Error: ${csvValidation.error}`);
      process.exit(1);
    }

    console.log(`Found ${responses.length} responses`);

    // Step 4: Generate participant decks with randomization
    console.log(`Generating ${options.participants} participant decks...`);
    const decks = randomizer.generateParticipantDecks(responses, options.participants);
    const totalCards = responses.length * options.participants;
    console.log(`Creating ${totalCards} total cards (${responses.length} per participant)`);

    // Step 5: Generate PDF
    console.log('Generating PDF...');
    let lastProgress = 0;
    const progressCallback = (processed, total) => {
      const percent = Math.floor((processed / total) * 100);
      if (percent >= lastProgress + 10) {
        console.log(`  Progress: ${percent}% (${processed}/${total} cards)`);
        lastProgress = percent;
      }
    };

    const result = await generator.generatePDF(decks, options.output, progressCallback);

    // Step 6: Success message
    console.log('\nSuccess!');
    console.log(`  Output file: ${result.path}`);
    console.log(`  File size: ${formatBytes(result.size)}`);
    console.log(`  Total cards: ${result.totalCards}`);

  } catch (error) {
    console.error(`\nUnexpected error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(2);
  }
}

module.exports = {
  run
};
