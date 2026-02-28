/**
 * anomaly.js — Detect anomalies and pattern breaks
 *
 * Identifies sudden drops, ghost mode, one-sided conversations,
 * missed follow-ups, and fading patterns.
 */

import { USER_NAME } from "../data/syntheticChats";

const NOW = new Date("2026-03-01T00:00:00Z");
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;

/**
 * Detect all anomalies for a single contact.
 * @param {string} contactName
 * @param {Array} messages - Sorted messages
 * @param {Object} metrics - Computed metrics for this contact
 * @returns {Array} Array of anomaly objects
 */
export function detectAnomalies(contactName, messages, metrics) {
  const anomalies = [];

  // 1. Sudden Drop: frequency dropped >50% compared to prior period
  const suddenDrop = detectSuddenDrop(contactName, messages);
  if (suddenDrop) anomalies.push(suddenDrop);

  // 2. Ghost Mode: contact hasn't replied in >14 days despite user messages
  const ghost = detectGhostMode(contactName, messages);
  if (ghost) anomalies.push(ghost);

  // 3. One-Sided: reciprocity ratio < 0.3 over last 30 days
  const oneSided = detectOneSided(contactName, messages);
  if (oneSided) anomalies.push(oneSided);

  // 4. Missed Follow-Up: user asked a question that got no response
  const missed = detectMissedFollowUps(contactName, messages);
  anomalies.push(...missed);

  // 5. Fading Pattern: 3+ consecutive weeks of declining message count
  const fading = detectFadingPattern(contactName, messages);
  if (fading) anomalies.push(fading);

  return anomalies;
}

/**
 * Detect if messaging frequency dropped >50%.
 */
function detectSuddenDrop(contactName, messages) {
  const thirtyDaysAgo = new Date(NOW.getTime() - 30 * MS_PER_DAY);
  const sixtyDaysAgo = new Date(NOW.getTime() - 60 * MS_PER_DAY);
  const ninetyDaysAgo = new Date(NOW.getTime() - 90 * MS_PER_DAY);

  const last30 = messages.filter((m) => new Date(m.timestamp) >= thirtyDaysAgo).length;
  const prior30 = messages.filter((m) => {
    const t = new Date(m.timestamp);
    return t >= sixtyDaysAgo && t < thirtyDaysAgo;
  }).length;

  if (prior30 > 4 && last30 < prior30 * 0.5) {
    return {
      contactName,
      type: "sudden_drop",
      severity: last30 === 0 ? "high" : "medium",
      description: `Message frequency dropped from ${prior30} to ${last30} messages in the last 30 days (${Math.round((1 - last30 / prior30) * 100)}% decrease).`,
      detectedAt: NOW.toISOString(),
    };
  }
  return null;
}

/**
 * Detect if contact hasn't replied in >14 days despite user messages.
 */
function detectGhostMode(contactName, messages) {
  const fourteenDaysAgo = new Date(NOW.getTime() - 14 * MS_PER_DAY);

  // Find the last message from the contact
  const lastContactMsg = [...messages]
    .reverse()
    .find((m) => m.sender !== USER_NAME);
  const lastUserMsg = [...messages]
    .reverse()
    .find((m) => m.sender === USER_NAME);

  if (!lastUserMsg || !lastContactMsg) return null;

  const lastContactDate = new Date(lastContactMsg.timestamp);
  const lastUserDate = new Date(lastUserMsg.timestamp);

  // User sent messages after the contact's last reply, and it's been >14 days
  if (
    lastUserDate > lastContactDate &&
    lastContactDate < fourteenDaysAgo
  ) {
    const daysSilent = Math.floor((NOW - lastContactDate) / MS_PER_DAY);
    return {
      contactName,
      type: "ghost_mode",
      severity: daysSilent > 30 ? "high" : "medium",
      description: `${contactName} hasn't replied in ${daysSilent} days despite your recent messages.`,
      detectedAt: NOW.toISOString(),
    };
  }
  return null;
}

/**
 * Detect one-sided conversations (reciprocity < 0.3 in last 30 days).
 */
function detectOneSided(contactName, messages) {
  const thirtyDaysAgo = new Date(NOW.getTime() - 30 * MS_PER_DAY);
  const recent = messages.filter((m) => new Date(m.timestamp) >= thirtyDaysAgo);

  if (recent.length < 3) return null;

  const userSent = recent.filter((m) => m.sender === USER_NAME).length;
  const contactSent = recent.length - userSent;

  if (userSent > 0 && contactSent / userSent < 0.3) {
    return {
      contactName,
      type: "one_sided",
      severity: contactSent === 0 ? "high" : "medium",
      description: `Conversation is one-sided: you sent ${userSent} messages but ${contactName} only sent ${contactSent} in the last 30 days.`,
      detectedAt: NOW.toISOString(),
    };
  }
  return null;
}

/**
 * Detect questions from user that got no response.
 */
function detectMissedFollowUps(contactName, messages) {
  const anomalies = [];
  const thirtyDaysAgo = new Date(NOW.getTime() - 30 * MS_PER_DAY);

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (
      msg.sender === USER_NAME &&
      msg.message.includes("?") &&
      new Date(msg.timestamp) >= thirtyDaysAgo
    ) {
      // Check if the next message is from the contact (within reasonable time)
      const nextMsg = messages[i + 1];
      if (
        !nextMsg ||
        nextMsg.sender === USER_NAME ||
        new Date(nextMsg.timestamp) - new Date(msg.timestamp) > 3 * MS_PER_DAY
      ) {
        anomalies.push({
          contactName,
          type: "missed_followup",
          severity: "low",
          description: `Your question "${msg.message.slice(0, 50)}${msg.message.length > 50 ? "..." : ""}" from ${formatDate(msg.timestamp)} went unanswered.`,
          detectedAt: NOW.toISOString(),
        });
      }
    }
  }

  // Only return up to 2 missed follow-ups per contact
  return anomalies.slice(-2);
}

/**
 * Detect 3+ consecutive weeks of declining message count.
 */
function detectFadingPattern(contactName, messages) {
  // Compute weekly counts for last 8 weeks
  const weeks = 8;
  const counts = new Array(weeks).fill(0);

  for (const m of messages) {
    const weeksAgo = Math.floor((NOW - new Date(m.timestamp)) / MS_PER_WEEK);
    const index = weeks - 1 - weeksAgo;
    if (index >= 0 && index < weeks) {
      counts[index]++;
    }
  }

  // Check for 3+ consecutive declining weeks
  let decliningStreak = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] < counts[i - 1]) {
      decliningStreak++;
    } else {
      decliningStreak = 0;
    }
    if (decliningStreak >= 3) {
      return {
        contactName,
        type: "fading_pattern",
        severity: "medium",
        description: `Messaging frequency has been declining for ${decliningStreak + 1} consecutive weeks.`,
        detectedAt: NOW.toISOString(),
      };
    }
  }
  return null;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Detect anomalies for all contacts.
 * @param {Object} ingestedData - Output from ingest()
 * @param {Object[]} allMetrics - Array of metric objects
 * @returns {Object[]} All anomalies across all contacts
 */
export function detectAllAnomalies(ingestedData, allMetrics) {
  const allAnomalies = [];

  for (const [name, data] of Object.entries(ingestedData.contacts)) {
    const metrics = allMetrics.find((m) => m.contactName === name);
    if (metrics) {
      const anomalies = detectAnomalies(name, data.messages, metrics);
      allAnomalies.push(...anomalies);
    }
  }

  // Sort by severity (high → medium → low)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  allAnomalies.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return allAnomalies;
}
