import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Heart, Clock } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Generate text insights from pipeline data.
 */
function generateInsights(contacts, anomalies, actions) {
  const insights = [];

  // Find most balanced relationship
  const mostBalanced = [...contacts].sort(
    (a, b) =>
      Math.abs(1 - a.metrics.reciprocityRatio) -
      Math.abs(1 - b.metrics.reciprocityRatio)
  )[0];
  if (mostBalanced) {
    insights.push({
      icon: Heart,
      color: "#10b981",
      text: `Your most balanced relationship is with ${mostBalanced.metrics.contactName} — keep it up!`,
    });
  }

  // Find unanswered messages
  const ghostAnomalies = anomalies.filter((a) => a.type === "ghost_mode");
  for (const g of ghostAnomalies) {
    insights.push({
      icon: AlertCircle,
      color: "#ef4444",
      text: g.description,
    });
  }

  // Find one-sided conversations
  const oneSided = anomalies.filter((a) => a.type === "one_sided");
  for (const o of oneSided.slice(0, 1)) {
    insights.push({
      icon: TrendingDown,
      color: "#f97316",
      text: o.description,
    });
  }

  // Growing relationships
  const growing = contacts.filter(
    (c) => c.metrics.frequencyTrend === "increasing"
  );
  for (const g of growing.slice(0, 1)) {
    insights.push({
      icon: TrendingUp,
      color: "#3b82f6",
      text: `Your connection with ${g.metrics.contactName} is growing stronger — frequency is up!`,
    });
  }

  // Dormant contacts
  const dormant = contacts.filter(
    (c) => c.score.status.label === "Dormant"
  );
  for (const d of dormant) {
    insights.push({
      icon: Clock,
      color: "#64748b",
      text: `You and ${d.metrics.contactName} haven't spoken in ${d.metrics.daysSinceLastInteraction} days. A simple "hey" could help.`,
    });
  }

  // Highest activity contact
  const mostActive = [...contacts].sort(
    (a, b) => b.metrics.messageFrequency - a.metrics.messageFrequency
  )[0];
  if (mostActive) {
    insights.push({
      icon: Sparkles,
      color: "#8b5cf6",
      text: `${mostActive.metrics.contactName} is your most active contact with ${mostActive.metrics.messageFrequency} messages/week.`,
    });
  }

  // Missed follow-ups
  const missedCount = anomalies.filter((a) => a.type === "missed_followup").length;
  if (missedCount > 0) {
    insights.push({
      icon: AlertCircle,
      color: "#f59e0b",
      text: `You have ${missedCount} unanswered question${missedCount > 1 ? "s" : ""} across your contacts. Consider following up.`,
    });
  }

  // Deep conversations
  const deepest = [...contacts].sort(
    (a, b) => b.metrics.conversationDepth - a.metrics.conversationDepth
  )[0];
  if (deepest && deepest.metrics.conversationDepth > 3) {
    insights.push({
      icon: Heart,
      color: "#ec4899",
      text: `Your deepest conversations are with ${deepest.metrics.contactName} — avg ${deepest.metrics.conversationDepth} turns per session.`,
    });
  }

  return insights.slice(0, 8);
}

export default function InsightPanel({ contacts, anomalies, actions }) {
  const insights = generateInsights(contacts, anomalies, actions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-slate-100">AI Insights</h2>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50"
            >
              <Icon
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: insight.color }}
              />
              <p className="text-sm text-slate-300 leading-relaxed">
                {insight.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
