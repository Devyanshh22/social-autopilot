/**
 * scorer.js — Relationship Health Scoring Engine
 *
 * Computes a 0-100 health score using a weighted formula across
 * reciprocity, frequency, recency, trend, depth, and initiation.
 */

// Weights for scoring formula
const WEIGHTS = {
  reciprocity: 0.20,
  frequency: 0.20,
  recency: 0.20,
  trend: 0.15,
  depth: 0.15,
  initiation: 0.10,
};

/**
 * Normalize reciprocity ratio (0-100). Perfect = 1.0, degrades as it diverges.
 * A ratio of 0 or >3 scores 0.
 */
function scoreReciprocity(ratio) {
  if (ratio <= 0) return 0;
  // Optimal is 1.0. Score degrades as it moves away from 1.0
  // Ratios between 0.6 and 1.5 are considered healthy
  const deviation = Math.abs(1 - ratio);
  return Math.max(0, Math.min(100, 100 - deviation * 50));
}

/**
 * Normalize message frequency (0-100). Based on messages per week.
 * 0 msgs/week = 0, 5+ msgs/week = 100
 */
function scoreFrequency(msgsPerWeek) {
  if (msgsPerWeek <= 0) return 0;
  // 3+ msgs/week is considered fully active
  return Math.min(100, (msgsPerWeek / 3) * 100);
}

/**
 * Score recency (0-100). Based on days since last interaction.
 * 0 days = 100, 30+ days = 0
 */
function scoreRecency(daysSince) {
  if (daysSince <= 0) return 100;
  if (daysSince >= 30) return 0;
  return Math.max(0, 100 - (daysSince / 30) * 100);
}

/**
 * Score the frequency trend (0-100).
 * Increasing = 100, stable = 60, decreasing = 20
 */
function scoreTrend(trend) {
  switch (trend) {
    case "increasing": return 100;
    case "stable": return 60;
    case "decreasing": return 20;
    default: return 40;
  }
}

/**
 * Score conversation depth (0-100). Based on avg turns per session.
 * 1 turn = 10, 6+ turns = 100
 */
function scoreDepth(depth) {
  if (depth <= 1) return 10;
  return Math.min(100, (depth / 6) * 100);
}

/**
 * Score initiation balance (0-100). 0.5 = perfect balance.
 * All user-initiated (1.0) or all contact-initiated (0.0) scores lower.
 */
function scoreInitiation(ratio) {
  // 0.5 = perfect balance. Tolerate up to 0.7/0.3 well
  const deviation = Math.abs(0.5 - ratio);
  return Math.max(0, 100 - deviation * 120);
}

/**
 * Classify a score into a status category.
 */
export function classifyScore(score) {
  if (score >= 82) return { label: "Thriving", emoji: "💚", color: "#10b981" };
  if (score >= 68) return { label: "Stable", emoji: "💙", color: "#3b82f6" };
  if (score >= 50) return { label: "Cooling", emoji: "💛", color: "#f59e0b" };
  if (score >= 30) return { label: "At-Risk", emoji: "🟠", color: "#f97316" };
  return { label: "Dormant", emoji: "🔴", color: "#ef4444" };
}

/**
 * Compute the relationship health score for a contact.
 * @param {Object} metrics - Output from computeMetrics
 * @returns {Object} { score, subscores, status }
 */
export function computeScore(metrics) {
  const subscores = {
    reciprocity: scoreReciprocity(metrics.reciprocityRatio),
    frequency: scoreFrequency(metrics.messageFrequency),
    recency: scoreRecency(metrics.daysSinceLastInteraction),
    trend: scoreTrend(metrics.frequencyTrend),
    depth: scoreDepth(metrics.conversationDepth),
    initiation: scoreInitiation(metrics.initiationRatio),
  };

  // Weighted sum
  const score = Math.round(
    Object.entries(WEIGHTS).reduce(
      (sum, [key, weight]) => sum + subscores[key] * weight,
      0
    )
  );

  const clampedScore = Math.max(0, Math.min(100, score));
  const status = classifyScore(clampedScore);

  return {
    contactName: metrics.contactName,
    score: clampedScore,
    subscores,
    status,
  };
}

/**
 * Score all contacts.
 * @param {Object[]} allMetrics - Array of metric objects
 * @returns {Object[]} Array of score objects
 */
export function scoreAll(allMetrics) {
  return allMetrics.map(computeScore);
}
