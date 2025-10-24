const PDFDocument = require('pdfkit');
const fs = require('fs');

// Page dimensions in points (1 inch = 72 points)
const PAGE_DIMENSIONS = {
  a4: {
    portrait: { width: 595.28, height: 841.89 },
    landscape: { width: 841.89, height: 595.28 }
  },
  letter: {
    portrait: { width: 612, height: 792 },
    landscape: { width: 792, height: 612 }
  }
};

// Layout constants
const MARGIN = 36; // 0.5 inches
const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 30;
const ROW_MIN_HEIGHT = 36; // Minimum row height
const LOGO_MAX_SIZE = 36; // 0.5 inches
const LOGO_OPACITY = 0.85;

/**
 * Determines optimal page orientation based on number of criteria
 * @param {number} criteriaCount - Number of rating criteria
 * @param {string} userOrientation - User-specified orientation (or undefined for auto)
 * @returns {string} - 'portrait' or 'landscape'
 */
function determineOrientation(criteriaCount, userOrientation) {
  if (userOrientation) {
    return userOrientation.toLowerCase();
  }
  // Auto-detect: use landscape if more than 3 criteria
  return criteriaCount > 3 ? 'landscape' : 'portrait';
}

/**
 * Calculates table layout dimensions
 * @param {Array} criteria - Array of criteria names
 * @param {number} pageWidth - Page width in points
 * @param {number} pageHeight - Page height in points
 * @returns {Object} - Layout configuration
 */
function calculateTableLayout(criteria, pageWidth, pageHeight) {
  const usableWidth = pageWidth - (2 * MARGIN);
  const usableHeight = pageHeight - HEADER_HEIGHT - (2 * MARGIN); // No footer anymore

  // Column width percentages
  const idColumnPercent = 0.07;
  const responseColumnPercent = 0.63;
  const criteriaColumnsPercent = 0.30;

  // Calculate column widths
  const idColumnWidth = usableWidth * idColumnPercent;
  const responseColumnWidth = usableWidth * responseColumnPercent;
  const totalCriteriaWidth = usableWidth * criteriaColumnsPercent;
  const criteriaColumnWidth = totalCriteriaWidth / criteria.length;

  return {
    usableWidth,
    usableHeight,
    idColumnWidth,
    responseColumnWidth,
    criteriaColumnWidth,
    tableStartX: MARGIN,
    tableStartY: MARGIN + HEADER_HEIGHT,
    pageWidth,
    pageHeight
  };
}

/**
 * Draws the worksheet header
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} participantNumber - Participant number
 * @param {number} totalParticipants - Total number of participants
 * @param {number} pageNumber - Current page number for this participant
 * @param {number} totalPagesForParticipant - Total pages for this participant
 * @param {string} logoPath - Optional path to logo file
 * @param {Object} layout - Layout configuration
 */
function drawHeader(doc, participantNumber, totalParticipants, pageNumber, totalPagesForParticipant, logoPath, layout) {
  const headerY = MARGIN;

  // Draw logo if provided
  if (logoPath) {
    try {
      doc.save();
      doc.opacity(LOGO_OPACITY);
      doc.image(logoPath, MARGIN, headerY, {
        fit: [LOGO_MAX_SIZE, LOGO_MAX_SIZE],
        align: 'left',
        valign: 'top'
      });
      doc.restore();
    } catch (error) {
      console.warn(`Warning: Could not render logo: ${error.message}`);
    }
  }

  // Title and participant info
  doc.font('Helvetica-Bold')
     .fontSize(14)
     .fillColor('#000000')
     .text('Response Rating Sheet', MARGIN, headerY, { align: 'center', width: layout.usableWidth });

  doc.font('Helvetica')
     .fontSize(11)
     .text(`Participant ${participantNumber} of ${totalParticipants} - Page ${pageNumber} of ${totalPagesForParticipant}`, MARGIN, headerY + 20, { align: 'center', width: layout.usableWidth });
}

/**
 * Draws table column headers
 * @param {PDFDocument} doc - PDFKit document
 * @param {Array} criteria - Array of criteria names
 * @param {Object} layout - Layout configuration
 * @param {number} y - Y position to draw headers
 */
function drawTableHeaders(doc, criteria, layout, y) {
  const headerBgColor = '#F0F0F0';
  const headerTextColor = '#000000';
  const borderColor = '#333333';

  doc.save();

  // Draw header background
  const headerHeight = 24;
  doc.fillColor(headerBgColor)
     .rect(layout.tableStartX, y, layout.usableWidth, headerHeight)
     .fill();

  // Draw borders
  doc.strokeColor(borderColor)
     .lineWidth(1);

  // Vertical lines
  let currentX = layout.tableStartX;

  // ID column border
  currentX += layout.idColumnWidth;
  doc.moveTo(currentX, y).lineTo(currentX, y + headerHeight).stroke();

  // Response column border
  currentX += layout.responseColumnWidth;
  doc.moveTo(currentX, y).lineTo(currentX, y + headerHeight).stroke();

  // Criteria column borders
  for (let i = 0; i < criteria.length - 1; i++) {
    currentX += layout.criteriaColumnWidth;
    doc.moveTo(currentX, y).lineTo(currentX, y + headerHeight).stroke();
  }

  // Horizontal lines (top and bottom)
  doc.moveTo(layout.tableStartX, y).lineTo(layout.tableStartX + layout.usableWidth, y).stroke();
  doc.moveTo(layout.tableStartX, y + headerHeight).lineTo(layout.tableStartX + layout.usableWidth, y + headerHeight).stroke();

  // Outer vertical borders
  doc.moveTo(layout.tableStartX, y).lineTo(layout.tableStartX, y + headerHeight).stroke();
  doc.moveTo(layout.tableStartX + layout.usableWidth, y).lineTo(layout.tableStartX + layout.usableWidth, y + headerHeight).stroke();

  // Draw header text
  doc.fillColor(headerTextColor)
     .font('Helvetica-Bold')
     .fontSize(10);

  currentX = layout.tableStartX;

  // ID header
  doc.text('ID', currentX + 2, y + 7, {
    width: layout.idColumnWidth - 4,
    align: 'center',
    lineBreak: false
  });
  currentX += layout.idColumnWidth;

  // Response header
  doc.text('Response', currentX + 2, y + 7, {
    width: layout.responseColumnWidth - 4,
    align: 'left',
    lineBreak: false
  });
  currentX += layout.responseColumnWidth;

  // Criteria headers
  for (const criterion of criteria) {
    // Truncate if too long
    const maxChars = Math.floor(layout.criteriaColumnWidth / 5);
    const displayText = criterion.length > maxChars ? criterion.substring(0, maxChars - 2) + '...' : criterion;

    doc.text(displayText, currentX + 2, y + 7, {
      width: layout.criteriaColumnWidth - 4,
      align: 'center',
      lineBreak: false
    });
    currentX += layout.criteriaColumnWidth;
  }

  doc.restore();

  return headerHeight;
}

/**
 * Draws a Likert scale (e.g., 1  2  3  4) - participants circle their choice
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Available width
 * @param {number} scaleSize - Number of points in the scale (3-7)
 */
function drawLikertScale(doc, x, y, width, scaleSize = 4) {
  // Generate scale array dynamically based on size
  const scale = Array.from({ length: scaleSize }, (_, i) => String(i + 1));

  const horizontalPadding = 6; // Padding on left and right sides
  const usableWidth = width - (2 * horizontalPadding);
  const spacing = usableWidth / scale.length;

  // Dynamic font sizing based on available space
  // Start with ideal size and scale down if needed
  let fontSize = 11; // Larger default since we don't have checkboxes

  doc.save();
  doc.font('Helvetica').fontSize(fontSize);

  // Calculate minimum width needed per number with spacing
  // Use the widest digit in the scale (could be '1' or '7')
  const maxDigit = scale[scale.length - 1];
  const maxNumberWidth = doc.widthOfString(maxDigit);
  const minSpaceNeeded = maxNumberWidth + 4; // 4pt minimum spacing around number

  // If spacing is too tight, scale down font
  if (spacing < minSpaceNeeded) {
    fontSize = Math.max(7, Math.floor(fontSize * (spacing / minSpaceNeeded)));
    doc.font('Helvetica').fontSize(fontSize);
  }

  doc.fillColor('#000000');

  for (let i = 0; i < scale.length; i++) {
    const itemX = x + horizontalPadding + (spacing * i) + (spacing / 2);
    const numberText = scale[i];
    const textWidth = doc.widthOfString(numberText);

    // Center the number in its space
    doc.text(numberText, itemX - (textWidth / 2), y + 2, {
      lineBreak: false,
      continued: false
    });
  }

  doc.restore();
}

/**
 * Draws a single table row
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} response - Response object {id, response}
 * @param {Array} criteria - Array of criteria names
 * @param {Object} layout - Layout configuration
 * @param {number} y - Y position to draw row
 * @param {number} likertScale - Likert scale size
 * @returns {number} - Height of the drawn row
 */
function drawTableRow(doc, response, criteria, layout, y, likertScale = 4) {
  const borderColor = '#CCCCCC';
  const textColor = '#000000';
  const cellPadding = 4;
  const lineGap = 1;

  // Calculate required height for response text
  doc.font('Helvetica').fontSize(10);
  const responseTextHeight = doc.heightOfString(response.response, {
    width: layout.responseColumnWidth - (2 * cellPadding),
    lineGap: lineGap
  });

  // Ensure minimum row height
  const rowHeight = Math.max(ROW_MIN_HEIGHT, responseTextHeight + (2 * cellPadding));

  doc.save();

  // Draw cell borders
  doc.strokeColor(borderColor).lineWidth(0.5);

  let currentX = layout.tableStartX;

  // Draw vertical lines
  for (let i = 0; i <= criteria.length + 2; i++) {
    doc.moveTo(currentX, y).lineTo(currentX, y + rowHeight).stroke();

    if (i === 0) currentX += layout.idColumnWidth;
    else if (i === 1) currentX += layout.responseColumnWidth;
    else currentX += layout.criteriaColumnWidth;
  }

  // Draw horizontal line (bottom of row)
  doc.moveTo(layout.tableStartX, y + rowHeight)
     .lineTo(layout.tableStartX + layout.usableWidth, y + rowHeight)
     .stroke();

  // Draw cell content
  currentX = layout.tableStartX;
  doc.fillColor(textColor);

  // ID cell
  doc.font('Helvetica').fontSize(9);
  doc.text(response.id, currentX + cellPadding, y + cellPadding, {
    width: layout.idColumnWidth - (2 * cellPadding),
    height: rowHeight - (2 * cellPadding),
    align: 'center',
    lineBreak: false,
    continued: false
  });
  currentX += layout.idColumnWidth;

  // Response cell
  doc.font('Helvetica').fontSize(10);
  doc.text(response.response, currentX + cellPadding, y + cellPadding, {
    width: layout.responseColumnWidth - (2 * cellPadding),
    height: rowHeight - (2 * cellPadding),
    lineGap: lineGap,
    align: 'left',
    continued: false,
    ellipsis: true
  });
  currentX += layout.responseColumnWidth;

  // Criteria cells (Likert scales)
  const likertY = y + (rowHeight / 2) - 5; // Center vertically
  for (let i = 0; i < criteria.length; i++) {
    drawLikertScale(doc, currentX, likertY, layout.criteriaColumnWidth, likertScale);
    currentX += layout.criteriaColumnWidth;
  }

  doc.restore();

  return rowHeight;
}

/**
 * Draws the page footer
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} participantNumber - Participant number
 * @param {number} pageNumber - Current page number
 * @param {Object} layout - Layout configuration
 */
function drawFooter(doc, participantNumber, pageNumber, layout) {
  const footerY = layout.pageHeight - MARGIN - 10;

  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#666666')
     .text(`Participant ${participantNumber} - Rating Sheet (Page ${pageNumber})`,
           MARGIN,
           footerY,
           { align: 'center', width: layout.usableWidth });
}

/**
 * Calculates how many pages a participant's responses will require
 * @param {Array} responses - Array of response objects
 * @param {Object} layout - Layout configuration
 * @param {PDFDocument} doc - PDFKit document (for text measurement)
 * @returns {number} - Number of pages needed
 */
function calculatePagesForParticipant(responses, layout, doc) {
  const tableHeaderHeight = 24; // Approximate table header height
  let currentY = layout.tableStartY + tableHeaderHeight;
  let pageCount = 1;

  for (const response of responses) {
    // Calculate row height
    doc.font('Helvetica').fontSize(10);
    const responseTextHeight = doc.heightOfString(response.response, {
      width: layout.responseColumnWidth - 8,
      lineGap: 1
    });
    const rowHeight = Math.max(ROW_MIN_HEIGHT, responseTextHeight + 8);

    // Check if we need a new page
    if (currentY + rowHeight > layout.tableStartY + layout.usableHeight) {
      pageCount++;
      currentY = layout.tableStartY + tableHeaderHeight;
    }

    currentY += rowHeight;
  }

  return pageCount;
}

/**
 * Generates rating PDF
 * @param {Array} decks - Array of participant decks
 * @param {string} outputPath - Output PDF file path
 * @param {Object} options - Generation options
 * @param {Function} options.progressCallback - Progress callback function
 * @param {string} options.logoPath - Optional path to logo file
 * @param {Array} options.criteria - Array of rating criteria
 * @param {number} options.likertScale - Likert scale size (3-7)
 * @param {string} options.pageSize - Page size ('a4' or 'letter')
 * @param {string} options.orientation - Page orientation ('portrait', 'landscape', or undefined for auto)
 * @param {boolean} options.separatorPages - Add separator pages between participants
 * @param {boolean} options.doubleSided - Insert blank pages to ensure each participant starts on new sheet
 * @returns {Promise<Object>} - Result object with path, size, totalPages, warnings
 */
async function generateRatingPDF(decks, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const {
        progressCallback = () => {},
        logoPath = null,
        criteria = ['Rating'],
        likertScale = 4,
        pageSize = 'a4',
        orientation: userOrientation,
        separatorPages = false,
        doubleSided = false
      } = options;

      // Determine orientation
      const orientation = determineOrientation(criteria.length, userOrientation);
      const dimensions = PAGE_DIMENSIONS[pageSize][orientation];

      // Calculate layout
      const layout = calculateTableLayout(criteria, dimensions.width, dimensions.height);

      // Create PDF document
      const doc = new PDFDocument({
        size: [dimensions.width, dimensions.height],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: false,
        bufferPages: true,
        info: {
          Title: 'GCM Rating Sheets',
          Author: 'gcm-print',
          Creator: 'gcm-print',
          Keywords: 'Group Concept Mapping, Rating, Research'
        }
      });

      // Pipe to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      let totalPages = 0;
      const warnings = [];

      // Process each participant
      for (let deckIndex = 0; deckIndex < decks.length; deckIndex++) {
        const deck = decks[deckIndex];
        const participantNumber = deck.participantNumber;

        // Add separator page if requested (except before first participant)
        if (separatorPages && deckIndex > 0) {
          doc.addPage({ size: [dimensions.width, dimensions.height] });
          totalPages++;

          doc.font('Helvetica-Bold')
             .fontSize(24)
             .fillColor('#000000')
             .text(`Participant ${participantNumber}`,
                   0,
                   dimensions.height / 2,
                   { align: 'center', width: dimensions.width });
        }

        // Pre-calculate total pages for this participant
        const responses = deck.cards; // All cards are responses (no title cards for rating)
        const totalPagesForParticipant = calculatePagesForParticipant(responses, layout, doc);

        // Start new page for participant
        doc.addPage({ size: [dimensions.width, dimensions.height] });

        totalPages++;
        let participantPageNumber = 1;

        // Draw header
        drawHeader(doc, participantNumber, decks.length, participantPageNumber, totalPagesForParticipant, logoPath, layout);

        // Draw table headers
        let currentY = layout.tableStartY;
        const headerHeight = drawTableHeaders(doc, criteria, layout, currentY);
        currentY += headerHeight;

        // Draw rows
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i];

          // Calculate row height
          doc.font('Helvetica').fontSize(10);
          const responseTextHeight = doc.heightOfString(response.response, {
            width: layout.responseColumnWidth - 8,
            lineGap: 1
          });
          const rowHeight = Math.max(ROW_MIN_HEIGHT, responseTextHeight + 8);

          // Check if we need a new page (simple: just check if row fits)
          if (currentY + rowHeight > layout.tableStartY + layout.usableHeight) {
            // Add new page
            doc.addPage({ size: [dimensions.width, dimensions.height] });
            totalPages++;
            participantPageNumber++;

            // Redraw header and table headers
            drawHeader(doc, participantNumber, decks.length, participantPageNumber, totalPagesForParticipant, logoPath, layout);
            currentY = layout.tableStartY;
            const newHeaderHeight = drawTableHeaders(doc, criteria, layout, currentY);
            currentY += newHeaderHeight;
          }

          // Draw the row
          const actualRowHeight = drawTableRow(doc, response, criteria, layout, currentY, likertScale);
          currentY += actualRowHeight;
        }

        // If double-sided printing is enabled and this participant has odd pages,
        // insert a blank page (except after the last participant)
        if (doubleSided && totalPagesForParticipant % 2 === 1 && deckIndex < decks.length - 1) {
          doc.addPage({ size: [dimensions.width, dimensions.height] });
          totalPages++;
          // Optionally add a small note on the blank page
          doc.font('Helvetica')
             .fontSize(8)
             .fillColor('#CCCCCC')
             .text('This page intentionally left blank',
                   0,
                   dimensions.height / 2,
                   { align: 'center', width: dimensions.width });
        }

        // Report progress
        progressCallback(deckIndex + 1, decks.length);
      }

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      stream.on('finish', () => {
        const stats = fs.statSync(outputPath);
        resolve({
          path: outputPath,
          size: stats.size,
          totalPages,
          warnings: warnings.length > 0 ? warnings : null
        });
      });

      stream.on('error', (error) => {
        reject(new Error(`Failed to write PDF: ${error.message}`));
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateRatingPDF,
  determineOrientation,
  calculateTableLayout
};
