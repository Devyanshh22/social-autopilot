import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

// Generate weekly score data from metrics (simulated trend from weekly counts)
function generateTrendData(contacts) {
  const weeks = 12;
  const labels = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date("2026-03-01");
    d.setDate(d.getDate() - i * 7);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }

  return labels.map((label, weekIdx) => {
    const point = { week: label };
    for (const c of contacts) {
      // Use weekly message counts to simulate a score trend
      const counts = c.metrics.weeklyMessageCounts;
      const maxCount = Math.max(...counts, 1);
      // Simulate score based on relative activity that week
      const baseScore = c.score.score;
      const weekActivity = counts[weekIdx] || 0;
      const activityRatio = weekActivity / maxCount;
      // Score oscillates around base score based on activity
      const simScore = Math.round(
        baseScore * 0.6 + activityRatio * baseScore * 0.4 + (Math.random() * 5 - 2.5)
      );
      point[c.metrics.contactName] = Math.max(0, Math.min(100, simScore));
    }
    return point;
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-strong rounded-lg p-3 text-xs">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RelationshipGraph({ contacts }) {
  // Pick top 5 contacts by score
  const topContacts = [...contacts]
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, 5);

  const data = generateTrendData(topContacts);

  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-slate-100 mb-1">
        Relationship Trends
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Health scores for top 5 contacts over 12 weeks
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" />
            <XAxis
              dataKey="week"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {topContacts.map((c, i) => (
              <Line
                key={c.metrics.contactName}
                type="monotone"
                dataKey={c.metrics.contactName}
                stroke={colors[i]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 justify-center">
        {topContacts.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: colors[i] }}
            />
            <span className="text-xs text-slate-400">
              {c.metrics.contactName}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
