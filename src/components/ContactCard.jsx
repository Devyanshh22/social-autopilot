import { MessageSquare, Instagram, Mail, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const platformIcons = {
  whatsapp: <MessageSquare className="w-4 h-4 text-green-400" />,
  instagram: <Instagram className="w-4 h-4 text-pink-400" />,
  email: <Mail className="w-4 h-4 text-blue-400" />,
};

/**
 * Circular score ring SVG component
 */
function ScoreRing({ score, color, size = 56 }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

/**
 * Mini sparkline chart
 */
function Sparkline({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const width = 100;
  const height = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ContactCard({ contact, onClick }) {
  const { metrics, score: scoreObj, anomalies, platform } = contact;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className="glass rounded-xl p-5 cursor-pointer hover:border-slate-500/30 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, ${scoreObj.status.color}40, ${scoreObj.status.color}20)`,
              color: scoreObj.status.color,
            }}
          >
            {metrics.contactName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 group-hover:text-white">
              {metrics.contactName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {platformIcons[platform] || platformIcons.whatsapp}
              <span className="text-xs text-slate-500 capitalize">{platform}</span>
            </div>
          </div>
        </div>
        <ScoreRing score={scoreObj.score} color={scoreObj.status.color} />
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: `${scoreObj.status.color}20`,
            color: scoreObj.status.color,
          }}
        >
          {scoreObj.status.emoji} {scoreObj.status.label}
        </span>
        <span className="text-xs text-slate-500">
          {metrics.daysSinceLastInteraction === 0
            ? "Active today"
            : `${metrics.daysSinceLastInteraction}d ago`}
        </span>
      </div>

      {/* Sparkline */}
      <div className="mb-2">
        <Sparkline
          data={metrics.weeklyMessageCounts}
          color={scoreObj.status.color}
        />
      </div>

      {/* Anomaly Badges */}
      {anomalies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {anomalies.slice(0, 2).map((a, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400"
            >
              <AlertTriangle className="w-3 h-3" />
              {a.type.replace(/_/g, " ")}
            </span>
          ))}
          {anomalies.length > 2 && (
            <span className="text-[10px] text-slate-500">
              +{anomalies.length - 2} more
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
