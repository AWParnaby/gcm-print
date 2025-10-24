const validator = require('./validator');
const parser = require('./parser');
const randomizer = require('./randomizer');
const ratingGenerator = require('./rating-generator');

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Main application logic for rating command
 * @param {Object} options - CLI options
 * @param {string} options.input - Path to CSV file
 * @param {number} options.participants - Number of participants
 * @param {string} options.output - Output PDF path
 * @param {string} options.criteria - Comma-separated list of rating criteria
 * @param {string} [options.logo] - Optional path to logo file
 * @param {string} [options.pageSize] - Optional page size
 * @param {string} [options.orientation] - Optional page orientation
 * @param {boolean} [options.separatorPages] - Add separator pages between participants
 */
async function run(options) {
  try {
    console.log('gcm-print - Generating rating sheets...\n');

    // Step 1: Validate inputs
    console.log('Validating inputs...');
    const validation = validator.validateRatingInputs(options);
    if (!validation.valid) {
      console.error('Validation errors:');
      validation.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }

    // Display warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warn => console.log(`Warning: ${warn}`));
      console.log('');
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
    console.log(`Rating criteria: ${validation.criteria.join(', ')}`);
    if (options.logo) {
      console.log(`Logo: ${options.logo}`);
    }

    // Step 4: Generate participant decks with randomization (no title cards for rating)
    console.log(`Generating ${options.participants} rating sheets...`);
    const decks = randomizer.generateParticipantDecks(responses, options.participants, 0);

    const totalRows = responses.length * options.participants;
    console.log(`Creating ${totalRows} total rows (${responses.length} per participant)`);

    // Step 5: Generate PDF
    console.log('Generating PDF...');
    let lastProgress = 0;
    const progressCallback = (processed, total) => {
      const percent = Math.floor((processed / total) * 100);
      if (percent >= lastProgress + 10) {
        console.log(`  Progress: ${percent}% (${processed}/${total} participants)`);
        lastProgress = percent;
      }
    };

    const result = await ratingGenerator.generateRatingPDF(decks, options.output, {
      progressCallback,
      logoPath: options.logo,
      criteria: validation.criteria,
      pageSize: options.pageSize || 'a4',
      orientation: options.orientation, // auto if undefined
      separatorPages: options.separatorPages || false,
      doubleSided: options.doubleSided || false
    });

    // Step 6: Success message
    console.log('\nSuccess!');
    console.log(`  Output file: ${result.path}`);
    console.log(`  File size: ${formatBytes(result.size)}`);
    console.log(`  Total participants: ${options.participants}`);
    console.log(`  Responses per participant: ${responses.length}`);
    console.log(`  Total pages: ${result.totalPages}`);

    // Display warnings if any
    if (result.warnings && result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warn => {
        console.log(`  - ${warn}`);
      });
    }

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
