/**
 * actions.js — Generate prioritized action recommendations
 *
 * Produces actionable items based on scores, anomalies, and metrics.
 * Each action includes a natural suggested message and reasoning.
 */

/**
 * Generate all actions based on pipeline data.
 * @param {Object[]} allScores - Score objects from scorer
 * @param {Object[]} allMetrics - Metric objects from metrics
 * @param {Object[]} allAnomalies - Anomaly objects from anomaly detector
 * @param {Object} ingestedData - Output from ingest()
 * @returns {Object[]} Prioritized action list
 */
export function generateActions(allScores, allMetrics, allAnomalies, ingestedData) {
  const actions = [];

  for (const scoreObj of allScores) {
    const { contactName, score, status } = scoreObj;
    const metrics = allMetrics.find((m) => m.contactName === contactName);
    const anomalies = allAnomalies.filter((a) => a.contactName === contactName);
    const contactData = ingestedData.contacts[contactName];

    if (!metrics || !contactData) continue;

    const lastMessages = contactData.messages.slice(-5);
    const contactActions = generateContactActions(
      contactName,
      score,
      status,
      metrics,
      anomalies,
      lastMessages
    );
    actions.push(...contactActions);
  }

  // Sort by priority
  actions.sort((a, b) => a.priority - b.priority);
  return actions;
}

function generateContactActions(contactName, score, status, metrics, anomalies, lastMessages) {
  const actions = [];
  const hasGhost = anomalies.some((a) => a.type === "ghost_mode");
  const hasOneSided = anomalies.some((a) => a.type === "one_sided");
  const hasFading = anomalies.some((a) => a.type === "fading_pattern");
  const hasSuddenDrop = anomalies.some((a) => a.type === "sudden_drop");
  const missedFollowups = anomalies.filter((a) => a.type === "missed_followup");

  // Priority 1: Urgent actions
  if (hasGhost && status.label === "Dormant") {
    actions.push({
      contactName,
      priority: 1,
      type: "reconnect",
      title: `Reconnect with ${contactName}`,
      description: `${contactName} has gone completely silent. It's been ${metrics.daysSinceLastInteraction} days since your last interaction. A casual message could rekindle the connection.`,
      suggestedMessage: getSuggestedMessage("reconnect", contactName, lastMessages),
      reasoning: `Ghost mode detected. ${metrics.daysSinceLastInteraction} days of silence. Relationship classified as Dormant (score: ${score}).`,
    });
  }

  if (hasOneSided && (status.label === "At-Risk" || status.label === "Cooling")) {
    actions.push({
      contactName,
      priority: 1,
      type: "rebalance",
      title: `Rebalance conversation with ${contactName}`,
      description: `The conversation has become one-sided. You're doing most of the reaching out while ${contactName} barely responds.`,
      suggestedMessage: getSuggestedMessage("rebalance", contactName, lastMessages),
      reasoning: `Reciprocity ratio is ${metrics.reciprocityRatio}. One-sided anomaly detected. Consider giving space or trying a different approach.`,
    });
  }

  if (missedFollowups.length > 0 && status.label !== "Dormant") {
    actions.push({
      contactName,
      priority: 1,
      type: "follow_up",
      title: `Follow up with ${contactName}`,
      description: `You have unanswered questions from ${contactName}. Following up shows you care about the conversation.`,
      suggestedMessage: getSuggestedMessage("follow_up", contactName, lastMessages),
      reasoning: `${missedFollowups.length} unanswered question(s) detected. Prompt follow-up maintains relationship health.`,
    });
  }

  // Priority 2: Important actions
  if (hasFading && !hasGhost) {
    actions.push({
      contactName,
      priority: 2,
      type: "deepen",
      title: `Re-engage with ${contactName}`,
      description: `Your messaging frequency with ${contactName} has been declining. A meaningful message could reverse the trend.`,
      suggestedMessage: getSuggestedMessage("deepen", contactName, lastMessages),
      reasoning: `Fading pattern detected over 3+ weeks. Frequency trend: ${metrics.frequencyTrend}. Score: ${score}.`,
    });
  }

  if (hasSuddenDrop && !hasGhost && !hasFading) {
    actions.push({
      contactName,
      priority: 2,
      type: "reply_overdue",
      title: `Check in with ${contactName}`,
      description: `There's been a sudden drop in communication. This might be a busy period or a sign of fading interest.`,
      suggestedMessage: getSuggestedMessage("deepen", contactName, lastMessages),
      reasoning: `Sudden frequency drop detected. Message volume decreased significantly compared to prior period.`,
    });
  }

  if (status.label === "Cooling" && actions.length === 0) {
    actions.push({
      contactName,
      priority: 2,
      type: "deepen",
      title: `Strengthen bond with ${contactName}`,
      description: `Your relationship is cooling. Try initiating a more meaningful conversation or making plans.`,
      suggestedMessage: getSuggestedMessage("deepen", contactName, lastMessages),
      reasoning: `Relationship classified as Cooling (score: ${score}). Proactive engagement recommended.`,
    });
  }

  // Priority 3: Suggested actions
  if (status.label === "Dormant" && !hasGhost) {
    actions.push({
      contactName,
      priority: 3,
      type: "reconnect",
      title: `Reconnect with ${contactName}`,
      description: `It's been a while since you two spoke. Even a simple hello can reignite a friendship.`,
      suggestedMessage: getSuggestedMessage("reconnect", contactName, lastMessages),
      reasoning: `Relationship is dormant. ${metrics.daysSinceLastInteraction} days since last contact. Low-effort outreach recommended.`,
    });
  }

  if (status.label === "Growing" || (status.label === "Thriving" && metrics.frequencyTrend === "increasing")) {
    actions.push({
      contactName,
      priority: 3,
      type: "deepen",
      title: `Deepen friendship with ${contactName}`,
      description: `This relationship is growing! Consider making plans or sharing something meaningful to strengthen the bond.`,
      suggestedMessage: getSuggestedMessage("grow", contactName, lastMessages),
      reasoning: `Relationship is ${status.label.toLowerCase()} with increasing frequency. Great time to invest more.`,
    });
  }

  return actions;
}

/**
 * Generate a natural-sounding suggested message based on context.
 */
function getSuggestedMessage(type, contactName, lastMessages) {
  const firstName = contactName.split(" ")[0];

  const templates = {
    reconnect: [
      `Hey ${firstName}! Been a while — how have you been? Would love to catch up sometime.`,
      `${firstName}! Just thought of you. Hope everything's going well. Let's grab coffee soon?`,
      `Hey ${firstName}, miss our chats. How's life treating you?`,
    ],
    rebalance: [
      `Hey ${firstName}, I know you've been busy. Just wanted you to know I'm here whenever you want to chat. No pressure!`,
      `${firstName}, hope everything's okay on your end. Take your time — just wanted to check in.`,
    ],
    follow_up: [
      `Hey ${firstName}! Just following up on our last conversation. Would love to hear from you when you get a chance.`,
      `Hey ${firstName}, circling back on what we were chatting about. Any updates on your end?`,
    ],
    deepen: [
      `Hey ${firstName}! We should hang out soon. Any plans this weekend?`,
      `${firstName}! Saw something that reminded me of you. Let's catch up soon — I have updates to share!`,
      `Hey ${firstName}, it's been a minute. Want to grab food sometime this week?`,
    ],
    grow: [
      `Hey ${firstName}! Really enjoying our conversations lately. Should we plan something fun this weekend?`,
      `${firstName}, you're awesome. Let's make plans — maybe try that new place we talked about?`,
    ],
  };

  const options = templates[type] || templates.deepen;
  // Pick a somewhat deterministic option based on name length
  const index = contactName.length % options.length;
  return options[index];
}
