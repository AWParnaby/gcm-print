const PDFDocument = require('pdfkit');
const fs = require('fs');

// Constants for card layout (all measurements in points: 1 inch = 72 points)
const CARD_WIDTH = 3.25 * 72;  // 3.25 inches = 234 points
const CARD_HEIGHT = 1.875 * 72; // 1.875 inches = 135 points
const CARD_PADDING = 14;       // Internal padding (approx 0.2 inches)
const GUTTER = 18;             // Space between cards (0.25 inches)

// Logo constants
const LOGO_MAX_SIZE = 0.5 * 72; // 0.5 inches = 36 points
const LOGO_OPACITY = 0.85;       // 85% opacity as per specs

// A4 page dimensions in points
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// Grid layout
const CARDS_PER_ROW = 2;
const CARDS_PER_COL = 5;  // 5 rows with smaller cards to avoid footer overlap
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

// Calculate page margins to center the card grid
const GRID_WIDTH = (CARDS_PER_ROW * CARD_WIDTH) + ((CARDS_PER_ROW - 1) * GUTTER);
const GRID_HEIGHT = (CARDS_PER_COL * CARD_HEIGHT) + ((CARDS_PER_COL - 1) * GUTTER);
const PAGE_MARGIN_X = (PAGE_WIDTH - GRID_WIDTH) / 2;
const PAGE_MARGIN_Y = (PAGE_HEIGHT - GRID_HEIGHT) / 2;

/**
 * Calculates the position of a card on the page
 * @param {number} cardIndex - Index of card on current page (0-9)
 * @returns {Object} - {x, y} coordinates for top-left of card
 */
function getCardPosition(cardIndex) {
  const row = Math.floor(cardIndex / CARDS_PER_ROW);
  const col = cardIndex % CARDS_PER_ROW;

  const x = PAGE_MARGIN_X + (col * (CARD_WIDTH + GUTTER));
  const y = PAGE_MARGIN_Y + (row * (CARD_HEIGHT + GUTTER));

  return { x, y };
}

/**
 * Draws crop marks around a card
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} x - Card x position
 * @param {number} y - Card y position
 */
function drawCropMarks(doc, x, y) {
  doc.save();
  doc.strokeColor('#CCCCCC')
     .lineWidth(0.5)
     .dash(2, 2);

  // Draw dashed rectangle around card
  doc.rect(x, y, CARD_WIDTH, CARD_HEIGHT).stroke();

  doc.restore();
}

/**
 * Draws logo on a card (if provided)
 * @param {PDFDocument} doc - PDFKit document
 * @param {string} logoPath - Path to logo file
 * @param {number} x - Card x position
 * @param {number} y - Card y position
 */
function drawLogo(doc, logoPath, x, y) {
  if (!logoPath) return;

  try {
    doc.save();

    // Set opacity
    doc.opacity(LOGO_OPACITY);

    // Position in top-left corner with padding
    const logoX = x + CARD_PADDING;
    const logoY = y + CARD_PADDING;

    // Draw logo with fit option to maintain aspect ratio
    doc.image(logoPath, logoX, logoY, {
      fit: [LOGO_MAX_SIZE, LOGO_MAX_SIZE],
      align: 'left',
      valign: 'top'
    });

    doc.restore();
  } catch (error) {
    // Silently fail if logo cannot be rendered - don't break PDF generation
    console.warn(`Warning: Could not render logo: ${error.message}`);
  }
}

/**
 * Draws a single card
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} card - Card data {id, response}
 * @param {number} x - Card x position
 * @param {number} y - Card y position
 * @param {string} [logoPath] - Optional path to logo file
 */
function drawCard(doc, card, x, y, logoPath = null) {
  // Draw crop marks
  drawCropMarks(doc, x, y);

  // Draw logo (if provided)
  if (logoPath) {
    drawLogo(doc, logoPath, x, y);
  }

  // Draw ID in top-right corner
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text(`ID: ${card.id}`, x + CARD_WIDTH - 70, y + CARD_PADDING, {
       width: 60,
       align: 'right'
     });

  // Draw response text (left-aligned, with wrapping)
  // Adjust starting position if logo is present
  const textX = x + CARD_PADDING;
  const textY = logoPath ? y + CARD_PADDING + LOGO_MAX_SIZE + 5 : y + CARD_PADDING + 20;
  const textWidth = CARD_WIDTH - (2 * CARD_PADDING);
  const textHeight = CARD_HEIGHT - (textY - y) - CARD_PADDING;

  doc.font('Helvetica')
     .fontSize(13)
     .text(card.response, textX, textY, {
       width: textWidth,
       height: textHeight,
       align: 'left',
       lineGap: 2
     });
}

/**
 * Adds footer with participant and page information
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} participantNumber - Current participant number
 * @param {number} pageNumber - Current page number for this participant
 * @param {number} totalPages - Total pages for this participant
 */
function addPageFooter(doc, participantNumber, pageNumber, totalPages) {
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#666666')
     .text(
       `Participant ${participantNumber} - Page ${pageNumber} of ${totalPages}`,
       0,
       PAGE_HEIGHT - 30,
       {
         align: 'center',
         width: PAGE_WIDTH
       }
     )
     .fillColor('#000000'); // Reset to black
}

/**
 * Generates a PDF with cards for all participants
 * @param {Array} decks - Array of participant decks from randomizer
 * @param {string} outputPath - Path for output PDF file
 * @param {Object} options - Generation options
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @param {string} [options.logoPath] - Optional path to logo file
 * @returns {Promise} - Resolves when PDF is complete
 */
function generatePDF(decks, outputPath, options = {}) {
  const { progressCallback = null, logoPath = null } = options;
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document (A4 size)
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: 'GCM Workshop Cards',
          Author: 'gcm-print',
          Creator: 'gcm-print v1.0.0',
          Keywords: 'Group Concept Mapping, Workshop, Research'
        }
      });

      // Pipe to file
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      let totalCardsProcessed = 0;
      const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);

      // Process each participant's deck
      decks.forEach((deck, deckIndex) => {
        const cards = deck.cards;
        const participantNumber = deck.participantNumber;
        const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);

        // Process cards for this participant
        for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
          const positionOnPage = cardIndex % CARDS_PER_PAGE;
          const currentPage = Math.floor(cardIndex / CARDS_PER_PAGE) + 1;

          // Add new page if starting a new page (but not for the very first card)
          if (positionOnPage === 0 && (deckIndex > 0 || cardIndex > 0)) {
            doc.addPage();
          }

          // Draw the card
          const position = getCardPosition(positionOnPage);
          drawCard(doc, cards[cardIndex], position.x, position.y, logoPath);

          // Add footer at the end of each page
          if (positionOnPage === CARDS_PER_PAGE - 1 || cardIndex === cards.length - 1) {
            addPageFooter(doc, participantNumber, currentPage, totalPages);
          }

          // Report progress
          totalCardsProcessed++;
          if (progressCallback && totalCardsProcessed % 50 === 0) {
            progressCallback(totalCardsProcessed, totalCards);
          }
        }
      });

      // Finalize PDF
      doc.end();

      // Handle stream events
      stream.on('finish', () => {
        const stats = fs.statSync(outputPath);
        resolve({
          path: outputPath,
          size: stats.size,
          totalCards: totalCards
        });
      });

      stream.on('error', (err) => {
        reject(new Error(`Failed to write PDF: ${err.message}`));
      });

    } catch (error) {
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
}

module.exports = {
  generatePDF
};
