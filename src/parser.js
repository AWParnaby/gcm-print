const fs = require('fs');
const csv = require('csv-parser');

/**
 * Parses a CSV file and extracts response data
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Promise that resolves to array of response objects {id, response}
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Handle case-insensitive headers
        const id = row.id || row.Id || row.ID;
        const response = row.response || row.Response || row.RESPONSE;

        results.push({
          id: id,
          response: response
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(new Error(`Failed to parse CSV file: ${error.message}`));
      });
  });
}

module.exports = {
  parseCSV
};
