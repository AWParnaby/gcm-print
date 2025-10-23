const PDFDocument = require('pdfkit');
const fs = require('fs');

// Fixed constants (all measurements in points: 1 inch = 72 points)
const CARD_PADDING = 14;       // Internal padding (approx 0.2 inches)
const GUTTER = 18;             // Space between cards (0.25 inches)
const FOOTER_HEIGHT = 40;      // Space reserved for footer

// Logo constants
const LOGO_MAX_SIZE = 0.5 * 72; // 0.5 inches = 36 points
const LOGO_OPACITY = 0.85;       // 85% opacity as per specs

// A4 page dimensions in points
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

/**
 * Calculates the optimal grid layout for a given number of cards per page
 * @param {number} cardsPerPage - Desired number of cards per page
 * @returns {Object} - {rows, cols}
 */
function calculateGridLayout(cardsPerPage) {
  // Prefer 2 columns when possible for consistent layout
  if (cardsPerPage % 2 === 0) {
    return { cols: 2, rows: cardsPerPage / 2 };
  }

  // For odd numbers, find best factorization
  // Try to keep aspect ratio reasonable (prefer taller rather than wider)
  for (let cols = 2; cols <= Math.ceil(Math.sqrt(cardsPerPage)); cols++) {
    if (cardsPerPage % cols === 0) {
      return { cols, rows: cardsPerPage / cols };
    }
  }

  // If prime number or no good factors, use 2 columns with extra space
  return { cols: 2, rows: Math.ceil(cardsPerPage / 2) };
}

/**
 * Calculates card dimensions and layout for a given cards per page setting
 * @param {number} cardsPerPage - Number of cards per page
 * @returns {Object} - Layout configuration object
 */
function calculateCardLayout(cardsPerPage = 10) {
  const { cols, rows } = calculateGridLayout(cardsPerPage);

  // Calculate available space for cards
  const availableWidth = PAGE_WIDTH - (2 * 20); // 20pt margins on each side
  const availableHeight = PAGE_HEIGHT - FOOTER_HEIGHT - (2 * 20); // Space minus footer

  // Calculate card dimensions to fit the grid
  const cardWidth = (availableWidth - (GUTTER * (cols - 1))) / cols;
  const cardHeight = (availableHeight - (GUTTER * (rows - 1))) / rows;

  // Calculate grid dimensions
  const gridWidth = (cols * cardWidth) + ((cols - 1) * GUTTER);
  const gridHeight = (rows * cardHeight) + ((rows - 1) * GUTTER);

  // Calculate margins to center the grid
  const marginX = (PAGE_WIDTH - gridWidth) / 2;
  const marginY = (PAGE_HEIGHT - FOOTER_HEIGHT - gridHeight) / 2;

  return {
    cardsPerPage,
    cols,
    rows,
    cardWidth,
    cardHeight,
    gridWidth,
    gridHeight,
    marginX,
    marginY
  };
}

/**
 * Calculates the position of a card on the page
 * @param {number} cardIndex - Index of card on current page
 * @param {Object} layout - Layout configuration object
 * @returns {Object} - {x, y} coordinates for top-left of card
 */
function getCardPosition(cardIndex, layout) {
  const row = Math.floor(cardIndex / layout.cols);
  const col = cardIndex % layout.cols;

  const x = layout.marginX + (col * (layout.cardWidth + GUTTER));
  const y = layout.marginY + (row * (layout.cardHeight + GUTTER));

  return { x, y };
}

/**
 * Draws crop marks around a card
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} x - Card x position
 * @param {number} y - Card y position
 * @param {Object} layout - Layout configuration object
 */
function drawCropMarks(doc, x, y, layout) {
  doc.save();
  doc.strokeColor('#CCCCCC')
     .lineWidth(0.5)
     .dash(2, 2);

  // Draw dashed rectangle around card
  doc.rect(x, y, layout.cardWidth, layout.cardHeight).stroke();

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
 * Calculates the optimal font size for text to fit within given dimensions
 * @param {PDFDocument} doc - PDFKit document
 * @param {string} text - Text to measure
 * @param {number} maxWidth - Maximum width available
 * @param {number} maxHeight - Maximum height available
 * @param {number} preferredSize - Preferred starting font size
 * @param {number} minSize - Minimum acceptable font size
 * @returns {Object} - {fontSize: number, warning: string|null}
 */
function calculateOptimalFontSize(doc, text, maxWidth, maxHeight, preferredSize = 13, minSize = 7) {
  const lineGap = 2;
  let fontSize = preferredSize;
  let warning = null;

  // Try progressively smaller sizes until text fits
  while (fontSize >= minSize) {
    doc.font('Helvetica').fontSize(fontSize);

    const textHeight = doc.heightOfString(text, {
      width: maxWidth,
      lineGap: lineGap,
      align: 'left'
    });

    if (textHeight <= maxHeight) {
      // Text fits!
      if (fontSize <= 9) {
        warning = `Text may be difficult to read (${fontSize}pt)`;
      }
      return { fontSize, warning };
    }

    // Reduce font size and try again
    fontSize -= 0.5;
  }

  // Even at minimum size, text doesn't fit - use minimum and warn
  return {
    fontSize: minSize,
    warning: `Text severely reduced to ${minSize}pt - may be illegible`
  };
}

/**
 * Draws a title card for pile labeling
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} card - Card data {type: 'title', participantNumber}
 * @param {number} x - Card x position
 * @param {number} y - Card y position
 * @param {Object} layout - Layout configuration object
 * @param {string} [logoPath] - Optional path to logo file
 */
function drawTitleCard(doc, card, x, y, layout, logoPath = null) {
  // Draw crop marks
  drawCropMarks(doc, x, y, layout);

  // Draw logo (if provided)
  if (logoPath) {
    drawLogo(doc, logoPath, x, y);
  }

  // Draw participant number in top-right corner (P1, P2, etc.)
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text(`P${card.participantNumber}`, x + layout.cardWidth - 50, y + CARD_PADDING, {
       width: 40,
       align: 'right'
     });

  // Draw prompt text
  const textX = x + CARD_PADDING;
  const textY = logoPath ? y + CARD_PADDING + LOGO_MAX_SIZE + 10 : y + CARD_PADDING + 25;

  doc.font('Helvetica')
     .fontSize(12)
     .text('Pile title or main topic:', textX, textY, {
       width: layout.cardWidth - (2 * CARD_PADDING),
       align: 'left'
     });

  // Draw horizontal line for writing title
  const lineY = textY + 20;
  const lineWidth = layout.cardWidth - (2 * CARD_PADDING);
  doc.moveTo(textX, lineY)
     .lineTo(textX + lineWidth, lineY)
     .stroke();

  // Rest of card is blank space for participant notes
  // (no additional drawing needed - just empty space)
}

/**
 * Draws a response card
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} card - Card data {type: 'response', id, response}
 * @param {number} x - Card x position
 * @param {number} y - Card y position
 * @param {Object} layout - Layout configuration object
 * @param {string} [logoPath] - Optional path to logo file
 * @returns {Object|null} - Warning object if text was scaled down, null otherwise
 */
function drawResponseCard(doc, card, x, y, layout, logoPath = null) {
  // Draw crop marks
  drawCropMarks(doc, x, y, layout);

  // Draw logo (if provided)
  if (logoPath) {
    drawLogo(doc, logoPath, x, y);
  }

  // Draw ID in top-right corner
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text(`ID: ${card.id}`, x + layout.cardWidth - 70, y + CARD_PADDING, {
       width: 60,
       align: 'right'
     });

  // Draw response text (left-aligned, with wrapping)
  // Adjust starting position if logo is present
  const textX = x + CARD_PADDING;
  const textY = logoPath ? y + CARD_PADDING + LOGO_MAX_SIZE + 5 : y + CARD_PADDING + 20;
  const textWidth = layout.cardWidth - (2 * CARD_PADDING);
  const textHeight = layout.cardHeight - (textY - y) - CARD_PADDING;

  // Calculate optimal font size for this text
  const { fontSize, warning } = calculateOptimalFontSize(
    doc,
    card.response,
    textWidth,
    textHeight,
    13, // preferred size
    7   // minimum size
  );

  // Draw the text with calculated font size
  doc.font('Helvetica')
     .fontSize(fontSize)
     .text(card.response, textX, textY, {
       width: textWidth,
       align: 'left',
       lineGap: 2
     });

  // Return warning if text was scaled down, including required height for 13pt
  if (warning) {
    // Calculate what height would be needed for 13pt
    doc.font('Helvetica').fontSize(13);
    const requiredHeight = doc.heightOfString(card.response, {
      width: textWidth,
      lineGap: 2,
      align: 'left'
    });

    return {
      id: card.id,
      response: card.response.substring(0, 50) + '...',
      warning,
      requiredHeightAt13pt: requiredHeight + (textY - y) + CARD_PADDING
    };
  }

  return null;
}

/**
 * Draws a card (title or response) based on card type
 * @param {PDFDocument} doc - PDFKit document
 * @param {Object} card - Card data (with type property)
 * @param {number} x - Card x position
 * @param {number} y - Card y position
 * @param {Object} layout - Layout configuration object
 * @param {string} [logoPath] - Optional path to logo file
 * @returns {Object|null} - Warning object if text was scaled down (response cards only), null otherwise
 */
function drawCard(doc, card, x, y, layout, logoPath = null) {
  if (card.type === 'title') {
    drawTitleCard(doc, card, x, y, layout, logoPath);
    return null; // Title cards don't have warnings
  } else {
    return drawResponseCard(doc, card, x, y, layout, logoPath);
  }
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
 * Calculates recommended cards per page for 13pt text
 * @param {number} requiredCardHeight - Required card height in points
 * @returns {number} - Recommended cards per page
 */
function calculateRecommendedCardsPerPage(requiredCardHeight) {
  // Calculate how many cards can fit vertically with this height
  const availableHeight = PAGE_HEIGHT - FOOTER_HEIGHT - (2 * 20);

  // Try different cards per page settings
  for (let cardsPerPage = 2; cardsPerPage <= 20; cardsPerPage++) {
    const layout = calculateCardLayout(cardsPerPage);

    if (layout.cardHeight >= requiredCardHeight) {
      return cardsPerPage;
    }
  }

  // If even 2 cards per page doesn't work, return 2 as minimum
  return 2;
}

/**
 * Generates a PDF with cards for all participants
 * @param {Array} decks - Array of participant decks from randomizer
 * @param {string} outputPath - Path for output PDF file
 * @param {Object} options - Generation options
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @param {string} [options.logoPath] - Optional path to logo file
 * @param {number} [options.cardsPerPage] - Number of cards per page (default: 10)
 * @returns {Promise} - Resolves when PDF is complete
 */
function generatePDF(decks, outputPath, options = {}) {
  const { progressCallback = null, logoPath = null, cardsPerPage = 10 } = options;
  return new Promise((resolve, reject) => {
    try {
      // Calculate card layout based on cards per page setting
      const layout = calculateCardLayout(cardsPerPage);

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
      const warnings = [];

      // Process each participant's deck
      decks.forEach((deck, deckIndex) => {
        const cards = deck.cards;
        const participantNumber = deck.participantNumber;
        const totalPages = Math.ceil(cards.length / layout.cardsPerPage);

        // Process cards for this participant
        for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
          const positionOnPage = cardIndex % layout.cardsPerPage;
          const currentPage = Math.floor(cardIndex / layout.cardsPerPage) + 1;

          // Add new page if starting a new page (but not for the very first card)
          if (positionOnPage === 0 && (deckIndex > 0 || cardIndex > 0)) {
            doc.addPage();
          }

          // Draw the card and collect any warnings
          const position = getCardPosition(positionOnPage, layout);
          const warning = drawCard(doc, cards[cardIndex], position.x, position.y, layout, logoPath);
          if (warning) {
            warnings.push(warning);
          }

          // Add footer at the end of each page
          if (positionOnPage === layout.cardsPerPage - 1 || cardIndex === cards.length - 1) {
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

        // Calculate recommendation if there are warnings
        let recommendedCardsPerPage = null;
        if (warnings.length > 0) {
          // Find the maximum required height among all warnings
          const maxRequiredHeight = Math.max(...warnings.map(w => w.requiredHeightAt13pt));
          recommendedCardsPerPage = calculateRecommendedCardsPerPage(maxRequiredHeight);
        }

        resolve({
          path: outputPath,
          size: stats.size,
          totalCards: totalCards,
          warnings: warnings,
          recommendedCardsPerPage: recommendedCardsPerPage
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
