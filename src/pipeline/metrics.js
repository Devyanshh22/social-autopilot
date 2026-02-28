/**
 * metrics.js — Compute per-contact communication metrics
 *
 * Calculates reciprocity, frequency, response times, conversation depth,
 * initiation ratios, and trend analysis for each contact.
 */

import { USER_NAME } from "../data/syntheticChats";

const NOW = new Date("2026-03-01T00:00:00Z");
const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;
const SESSION_GAP_MS = 2 * MS_PER_HOUR; // 2-hour session gap

/**
 * Compute all metrics for a single contact's message thread.
 * @param {string} contactName
 * @param {Array} messages - Sorted messages for this contact
 * @returns {Object} Full metrics object
 */
export function computeMetrics(contactName, messages) {
  const totalMessages = messages.length;
  const sentByUser = messages.filter((m) => m.sender === USER_NAME).length;
  const sentByContact = totalMessages - sentByUser;

  // Reciprocity ratio (contact messages / user messages). 1.0 = balanced
  const reciprocityRatio = sentByUser > 0 ? sentByContact / sentByUser : 0;

  // Average response time (hours between a message and the next reply from the other party)
  const responseTimes = computeResponseTimes(messages);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null;

  // Message frequency: messages per week over last 90 days
  const ninetyDaysAgo = new Date(NOW.getTime() - 90 * MS_PER_DAY);
  const recentMessages = messages.filter(
    (m) => new Date(m.timestamp) >= ninetyDaysAgo
  );
  const weeksSpan = 90 / 7;
  const messageFrequency =
    recentMessages.length > 0 ? recentMessages.length / weeksSpan : 0;

  // Frequency trend: compare last 30 days vs prior 60 days
  const thirtyDaysAgo = new Date(NOW.getTime() - 30 * MS_PER_DAY);
  const sixtyDaysAgo = new Date(NOW.getTime() - 60 * MS_PER_DAY);
  const last30 = messages.filter((m) => new Date(m.timestamp) >= thirtyDaysAgo);
  const prior60 = messages.filter((m) => {
    const t = new Date(m.timestamp);
    return t >= ninetyDaysAgo && t < thirtyDaysAgo;
  });
  const frequencyTrend = computeTrend(last30.length / 4.29, prior60.length / 8.57);

  // Average message length
  const avgMessageLength =
    totalMessages > 0
      ? messages.reduce((sum, m) => sum + m.message.length, 0) / totalMessages
      : 0;

  // Last interaction
  const lastMessage = messages[messages.length - 1];
  const lastInteraction = lastMessage.timestamp;
  const daysSinceLastInteraction = Math.floor(
    (NOW - new Date(lastInteraction)) / MS_PER_DAY
  );

  // Initiation ratio: proportion of conversations initiated by user
  const sessions = splitIntoSessions(messages);
  const userInitiated = sessions.filter(
    (s) => s[0].sender === USER_NAME
  ).length;
  const initiationRatio =
    sessions.length > 0 ? userInitiated / sessions.length : 0.5;

  // Peak activity hour
  const peakActivityHour = computePeakHour(messages);

  // Conversation depth: avg back-and-forth exchanges per session
  const conversationDepth = computeConversationDepth(sessions);

  // Weekly message counts for sparkline (last 12 weeks)
  const weeklyMessageCounts = computeWeeklyCounts(messages, 12);

  // Weekly scores for trend chart (computed later, placeholder)
  return {
    contactName,
    totalMessages,
    sentByUser,
    sentByContact,
    reciprocityRatio: round(reciprocityRatio, 2),
    avgResponseTime: avgResponseTime !== null ? round(avgResponseTime, 1) : null,
    messageFrequency: round(messageFrequency, 1),
    frequencyTrend,
    avgMessageLength: round(avgMessageLength, 0),
    lastInteraction,
    daysSinceLastInteraction,
    initiationRatio: round(initiationRatio, 2),
    peakActivityHour,
    conversationDepth: round(conversationDepth, 1),
    weeklyMessageCounts,
  };
}

/**
 * Compute response times between alternating senders.
 */
function computeResponseTimes(messages) {
  const times = [];
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender !== messages[i - 1].sender) {
      const diff =
        (new Date(messages[i].timestamp) - new Date(messages[i - 1].timestamp)) /
        MS_PER_HOUR;
      if (diff < 72) {
        // Ignore gaps > 3 days as they're not true "responses"
        times.push(diff);
      }
    }
  }
  return times;
}

/**
 * Determine if frequency is increasing, stable, or decreasing.
 */
function computeTrend(recentRate, priorRate) {
  if (priorRate === 0 && recentRate === 0) return "stable";
  if (priorRate === 0) return "increasing";
  const change = (recentRate - priorRate) / priorRate;
  if (change > 0.2) return "increasing";
  if (change < -0.2) return "decreasing";
  return "stable";
}

/**
 * Split messages into conversation sessions (gap > 2 hours = new session).
 */
function splitIntoSessions(messages) {
  if (messages.length === 0) return [];
  const sessions = [[messages[0]]];
  for (let i = 1; i < messages.length; i++) {
    const gap =
      new Date(messages[i].timestamp) -
      new Date(messages[i - 1].timestamp);
    if (gap > SESSION_GAP_MS) {
      sessions.push([messages[i]]);
    } else {
      sessions[sessions.length - 1].push(messages[i]);
    }
  }
  return sessions;
}

/**
 * Compute the most common messaging hour (0-23).
 */
function computePeakHour(messages) {
  const hourCounts = new Array(24).fill(0);
  for (const m of messages) {
    const hour = new Date(m.timestamp).getUTCHours();
    hourCounts[hour]++;
  }
  return hourCounts.indexOf(Math.max(...hourCounts));
}

/**
 * Average number of back-and-forth exchanges per session.
 * A "turn" is when the sender changes.
 */
function computeConversationDepth(sessions) {
  if (sessions.length === 0) return 0;
  let totalTurns = 0;
  for (const session of sessions) {
    let turns = 1;
    for (let i = 1; i < session.length; i++) {
      if (session[i].sender !== session[i - 1].sender) turns++;
    }
    totalTurns += turns;
  }
  return totalTurns / sessions.length;
}

/**
 * Compute weekly message counts for the last N weeks.
 */
function computeWeeklyCounts(messages, weeks) {
  const counts = new Array(weeks).fill(0);
  for (const m of messages) {
    const weeksAgo = Math.floor((NOW - new Date(m.timestamp)) / MS_PER_WEEK);
    const index = weeks - 1 - weeksAgo;
    if (index >= 0 && index < weeks) {
      counts[index]++;
    }
  }
  return counts;
}

/**
 * Compute metrics for all contacts.
 * @param {Object} ingestedData - Output from ingest()
 * @returns {Object[]} Array of metrics objects, one per contact
 */
export function computeAllMetrics(ingestedData) {
  return Object.entries(ingestedData.contacts).map(([name, data]) =>
    computeMetrics(name, data.messages)
  );
}

function round(val, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
