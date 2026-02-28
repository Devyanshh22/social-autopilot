/**
 * ingest.js — Parse and normalize raw chat data
 *
 * Takes the raw flat array of messages and groups them by contact,
 * sorted chronologically. Returns structured per-contact conversation threads.
 */

/**
 * Groups messages by contactName and sorts each group by timestamp.
 * @param {Array} rawMessages - Flat array of message objects from syntheticChats
 * @returns {Object} Map of contactName → sorted message array
 */
export function groupByContact(rawMessages) {
  const grouped = {};

  for (const msg of rawMessages) {
    if (!grouped[msg.contactName]) {
      grouped[msg.contactName] = [];
    }
    grouped[msg.contactName].push(msg);
  }

  // Sort each contact's messages by timestamp
  for (const contact of Object.keys(grouped)) {
    grouped[contact].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  return grouped;
}

/**
 * Returns a sorted array of unique contact names.
 * @param {Object} groupedChats - Output of groupByContact
 * @returns {string[]} Sorted contact names
 */
export function getContactNames(groupedChats) {
  return Object.keys(groupedChats).sort();
}

/**
 * Returns the primary platform for a contact (most frequently used).
 * @param {Array} messages - Messages for a single contact
 * @returns {string} Platform name
 */
export function getPrimaryPlatform(messages) {
  const counts = {};
  for (const msg of messages) {
    counts[msg.platform] = (counts[msg.platform] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Full ingestion pipeline: takes raw messages, returns structured data.
 * @param {Array} rawMessages - Raw chat array
 * @returns {Object} { contacts: { [name]: { messages, platform } }, totalMessages }
 */
export function ingest(rawMessages) {
  const grouped = groupByContact(rawMessages);
  const contacts = {};

  for (const [name, messages] of Object.entries(grouped)) {
    contacts[name] = {
      messages,
      platform: getPrimaryPlatform(messages),
      messageCount: messages.length,
    };
  }

  return {
    contacts,
    totalMessages: rawMessages.length,
    contactCount: Object.keys(contacts).length,
  };
}
