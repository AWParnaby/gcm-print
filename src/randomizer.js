const crypto = require('crypto');

/**
 * Shuffles an array using cryptographically secure random numbers
 * Uses Fisher-Yates shuffle algorithm with crypto.randomBytes
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array (original is not modified)
 */
function shuffle(array) {
  // Create a copy to avoid modifying the original
  const shuffled = [...array];

  // Fisher-Yates shuffle with crypto random
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate cryptographically secure random index
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32LE(0);
    const j = Math.floor((randomValue / 0x100000000) * (i + 1));

    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Generates title cards for a participant
 * @param {number} count - Number of title cards to generate
 * @param {number} participantNumber - Participant number
 * @returns {Array} - Array of title card objects
 */
function generateTitleCards(count, participantNumber) {
  const titleCards = [];

  for (let i = 0; i < count; i++) {
    titleCards.push({
      type: 'title',
      participantNumber: participantNumber
    });
  }

  return titleCards;
}

/**
 * Generates randomized card decks for all participants
 * Each participant gets a unique shuffled deck with all responses
 * @param {Array} responses - Array of response objects {id, response}
 * @param {number} participantCount - Number of participants
 * @param {number} [titleCardCount=0] - Number of title cards per participant
 * @returns {Array} - Array of participant decks, each containing title cards + shuffled responses
 */
function generateParticipantDecks(responses, participantCount, titleCardCount = 0) {
  const decks = [];

  for (let i = 0; i < participantCount; i++) {
    const participantNumber = i + 1;

    // Generate title cards for this participant
    const titleCards = generateTitleCards(titleCardCount, participantNumber);

    // Create a unique shuffled deck of response cards
    const shuffledResponses = shuffle(responses).map(r => ({
      ...r,
      type: 'response'
    }));

    // Combine title cards (first) with response cards
    const allCards = [...titleCards, ...shuffledResponses];

    decks.push({
      participantNumber: participantNumber,
      cards: allCards,
      titleCardCount: titleCardCount,
      responseCardCount: responses.length
    });
  }

  return decks;
}

module.exports = {
  shuffle,
  generateParticipantDecks
};
