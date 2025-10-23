const fs = require('fs');

/**
 * Validates the input parameters for gcm-print
 */

/**
 * Validates that a file exists and is readable
 * @param {string} filePath - Path to the file to validate
 * @param {string} fileType - Type of file (for error messages)
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validateFileExists(filePath, fileType = 'File') {
  if (!filePath) {
    return { valid: false, error: `${fileType} path is required` };
  }

  if (!fs.existsSync(filePath)) {
    return { valid: false, error: `${fileType} not found: ${filePath}` };
  }

  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return { valid: true, error: null };
  } catch (err) {
    return { valid: false, error: `${fileType} is not readable: ${filePath}` };
  }
}

/**
 * Validates the participant count
 * @param {number|string} count - Number of participants
 * @returns {Object} - {valid: boolean, error: string|null, value: number|null}
 */
function validateParticipantCount(count) {
  if (count === undefined || count === null) {
    return { valid: false, error: 'Participant count is required', value: null };
  }

  const num = parseInt(count, 10);

  if (isNaN(num)) {
    return { valid: false, error: 'Participant count must be a valid number', value: null };
  }

  if (num < 1) {
    return { valid: false, error: 'Participant count must be at least 1', value: null };
  }

  if (num > 999) {
    return { valid: false, error: 'Participant count must not exceed 999', value: null };
  }

  return { valid: true, error: null, value: num };
}

/**
 * Validates CSV structure (checks for required headers)
 * @param {Array} rows - Parsed CSV rows
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validateCSVStructure(rows) {
  if (!rows || rows.length === 0) {
    return { valid: false, error: 'CSV file is empty or could not be parsed' };
  }

  // Check first row for required headers (case-insensitive)
  const firstRow = rows[0];
  const keys = Object.keys(firstRow).map(k => k.toLowerCase());

  if (!keys.includes('id')) {
    return { valid: false, error: 'CSV must contain an "id" column' };
  }

  if (!keys.includes('response')) {
    return { valid: false, error: 'CSV must contain a "response" column' };
  }

  // Check for empty responses
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const response = row.response || row.Response || row.RESPONSE;

    if (!response || response.trim() === '') {
      return {
        valid: false,
        error: `Empty response found at row ${i + 2} (id: ${row.id || row.Id || row.ID || 'unknown'})`
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validates logo file format
 * @param {string} filePath - Path to the logo file
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validateLogoFile(filePath) {
  if (!filePath) {
    return { valid: true, error: null }; // Logo is optional
  }

  // Check if file exists and is readable
  const fileValidation = validateFileExists(filePath, 'Logo file');
  if (!fileValidation.valid) {
    return fileValidation;
  }

  // Check file extension
  const supportedFormats = ['.png', '.jpg', '.jpeg', '.svg'];
  const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));

  if (!supportedFormats.includes(ext)) {
    return {
      valid: false,
      error: `Logo file format not supported. Supported formats: ${supportedFormats.join(', ')}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates all inputs
 * @param {Object} options - Input options
 * @param {string} options.input - Path to CSV file
 * @param {number} options.participants - Number of participants
 * @param {string} [options.logo] - Optional path to logo file
 * @returns {Object} - {valid: boolean, errors: Array<string>}
 */
function validateInputs(options) {
  const errors = [];

  // Validate input file
  const fileValidation = validateFileExists(options.input, 'Input CSV file');
  if (!fileValidation.valid) {
    errors.push(fileValidation.error);
  }

  // Validate participant count
  const participantValidation = validateParticipantCount(options.participants);
  if (!participantValidation.valid) {
    errors.push(participantValidation.error);
  }

  // Validate logo file (optional)
  if (options.logo) {
    const logoValidation = validateLogoFile(options.logo);
    if (!logoValidation.valid) {
      errors.push(logoValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFileExists,
  validateParticipantCount,
  validateCSVStructure,
  validateLogoFile,
  validateInputs
};
