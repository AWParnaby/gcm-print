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
 * Validates cards per page setting
 * @param {number} cardsPerPage - Number of cards per page
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validateCardsPerPage(cardsPerPage) {
  if (cardsPerPage === undefined || cardsPerPage === null) {
    return { valid: true, error: null }; // Optional, will use default
  }

  const num = parseInt(cardsPerPage, 10);

  if (isNaN(num)) {
    return { valid: false, error: 'Cards per page must be a valid number' };
  }

  if (num < 2) {
    return { valid: false, error: 'Cards per page must be at least 2' };
  }

  if (num > 20) {
    return { valid: false, error: 'Cards per page must not exceed 20' };
  }

  return { valid: true, error: null };
}

/**
 * Validates title card count
 * @param {number} titleCards - Number of title cards
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validateTitleCardCount(titleCards) {
  if (titleCards === undefined || titleCards === null) {
    return { valid: true, error: null }; // Optional, will use default
  }

  const num = parseInt(titleCards, 10);

  if (isNaN(num)) {
    return { valid: false, error: 'Title cards must be a valid number' };
  }

  if (num < 0) {
    return { valid: false, error: 'Title cards cannot be negative' };
  }

  if (num > 50) {
    return { valid: false, error: 'Title cards must not exceed 50' };
  }

  return { valid: true, error: null };
}

/**
 * Validates all inputs
 * @param {Object} options - Input options
 * @param {string} options.input - Path to CSV file
 * @param {number} options.participants - Number of participants
 * @param {string} [options.logo] - Optional path to logo file
 * @param {number} [options.cardsPerPage] - Optional cards per page setting
 * @param {number} [options.titleCards] - Optional title card count
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

  // Validate cards per page (optional)
  if (options.cardsPerPage !== undefined) {
    const cardsValidation = validateCardsPerPage(options.cardsPerPage);
    if (!cardsValidation.valid) {
      errors.push(cardsValidation.error);
    }
  }

  // Validate title cards (optional)
  if (options.titleCards !== undefined) {
    const titleCardsValidation = validateTitleCardCount(options.titleCards);
    if (!titleCardsValidation.valid) {
      errors.push(titleCardsValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates and parses rating criteria list
 * @param {string} criteriaString - Comma-separated list of criteria
 * @returns {Object} - {valid: boolean, error: string|null, criteria: Array<string>|null, warning: string|null}
 */
function validateCriteria(criteriaString) {
  if (!criteriaString || criteriaString.trim() === '') {
    return { valid: false, error: 'Rating criteria cannot be empty', criteria: null, warning: null };
  }

  // Parse comma-separated list
  const criteria = criteriaString
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  if (criteria.length === 0) {
    return { valid: false, error: 'At least one rating criterion is required', criteria: null, warning: null };
  }

  // Validate each criterion (alphanumeric, spaces, hyphens only)
  const invalidCriteria = [];
  const validPattern = /^[a-zA-Z0-9\s\-]+$/;

  for (const criterion of criteria) {
    if (!validPattern.test(criterion)) {
      invalidCriteria.push(criterion);
    }
  }

  if (invalidCriteria.length > 0) {
    return {
      valid: false,
      error: `Invalid criteria (only letters, numbers, spaces, and hyphens allowed): ${invalidCriteria.join(', ')}`,
      criteria: null,
      warning: null
    };
  }

  // Check for duplicates
  const duplicates = criteria.filter((item, index) => criteria.indexOf(item) !== index);
  if (duplicates.length > 0) {
    return {
      valid: false,
      error: `Duplicate criteria found: ${[...new Set(duplicates)].join(', ')}`,
      criteria: null,
      warning: null
    };
  }

  // Warn if more than 6 criteria (layout constraints)
  let warning = null;
  if (criteria.length > 6) {
    warning = 'Warning: More than 6 criteria may result in cramped layout. Consider using landscape orientation.';
  }

  return { valid: true, error: null, criteria, warning };
}

/**
 * Validates page size option
 * @param {string} pageSize - Paper size ('letter' or 'a4')
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validatePageSize(pageSize) {
  if (!pageSize) {
    return { valid: true, error: null }; // Optional, will use default
  }

  const validSizes = ['letter', 'a4'];
  if (!validSizes.includes(pageSize.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid page size. Valid options: ${validSizes.join(', ')}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates page orientation option
 * @param {string} orientation - Page orientation ('portrait' or 'landscape')
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validateOrientation(orientation) {
  if (!orientation) {
    return { valid: true, error: null }; // Optional, will auto-detect
  }

  const validOrientations = ['portrait', 'landscape'];
  if (!validOrientations.includes(orientation.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid orientation. Valid options: ${validOrientations.join(', ')}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates Likert scale size
 * @param {number} scale - Likert scale size (3-7)
 * @returns {Object} - {valid: boolean, error: string|null}
 */
function validateLikertScale(scale) {
  if (scale === undefined || scale === null) {
    return { valid: true, error: null }; // Optional, will use default
  }

  const num = parseInt(scale, 10);

  if (isNaN(num)) {
    return { valid: false, error: 'Likert scale must be a valid number' };
  }

  if (num < 3) {
    return { valid: false, error: 'Likert scale must be at least 3' };
  }

  if (num > 7) {
    return { valid: false, error: 'Likert scale must not exceed 7' };
  }

  return { valid: true, error: null };
}

/**
 * Validates all inputs for rating command
 * @param {Object} options - Input options
 * @param {string} options.input - Path to CSV file
 * @param {number} options.participants - Number of participants
 * @param {string} options.criteria - Comma-separated list of rating criteria
 * @param {number} [options.scale] - Optional Likert scale size
 * @param {string} [options.logo] - Optional path to logo file
 * @param {string} [options.pageSize] - Optional page size
 * @param {string} [options.orientation] - Optional page orientation
 * @returns {Object} - {valid: boolean, errors: Array<string>, warnings: Array<string>, criteria: Array<string>|null}
 */
function validateRatingInputs(options) {
  const errors = [];
  const warnings = [];
  let parsedCriteria = null;

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

  // Validate criteria
  const criteriaValidation = validateCriteria(options.criteria);
  if (!criteriaValidation.valid) {
    errors.push(criteriaValidation.error);
  } else {
    parsedCriteria = criteriaValidation.criteria;
    if (criteriaValidation.warning) {
      warnings.push(criteriaValidation.warning);
    }
  }

  // Validate Likert scale (optional)
  if (options.scale !== undefined && options.scale !== null) {
    const scaleValidation = validateLikertScale(options.scale);
    if (!scaleValidation.valid) {
      errors.push(scaleValidation.error);
    }
  }

  // Validate logo file (optional)
  if (options.logo) {
    const logoValidation = validateLogoFile(options.logo);
    if (!logoValidation.valid) {
      errors.push(logoValidation.error);
    }
  }

  // Validate page size (optional)
  if (options.pageSize) {
    const pageSizeValidation = validatePageSize(options.pageSize);
    if (!pageSizeValidation.valid) {
      errors.push(pageSizeValidation.error);
    }
  }

  // Validate orientation (optional)
  if (options.orientation) {
    const orientationValidation = validateOrientation(options.orientation);
    if (!orientationValidation.valid) {
      errors.push(orientationValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    criteria: parsedCriteria
  };
}

module.exports = {
  validateFileExists,
  validateParticipantCount,
  validateCSVStructure,
  validateLogoFile,
  validateCardsPerPage,
  validateTitleCardCount,
  validateInputs,
  validateCriteria,
  validatePageSize,
  validateOrientation,
  validateLikertScale,
  validateRatingInputs
};
