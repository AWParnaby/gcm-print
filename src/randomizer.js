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
 * Generates randomized card decks for all participants
 * Each participant gets a unique shuffled deck with all responses
 * @param {Array} responses - Array of response objects {id, response}
 * @param {number} participantCount - Number of participants
 * @returns {Array} - Array of participant decks, each containing shuffled responses
 */
function generateParticipantDecks(responses, participantCount) {
  const decks = [];

  for (let i = 0; i < participantCount; i++) {
    // Create a unique shuffled deck for each participant
    const shuffledDeck = shuffle(responses);
    decks.push({
      participantNumber: i + 1,
      cards: shuffledDeck
    });
  }

  return decks;
}

module.exports = {
  shuffle,
  generateParticipantDecks
};
