import {
  Database,
  BarChart3,
  HeartPulse,
  AlertTriangle,
  Zap,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const stages = [
  {
    icon: Database,
    title: "Ingestion",
    statKey: "messagesProcessed",
    statLabel: "messages",
    color: "#38bdf8",
  },
  {
    icon: BarChart3,
    title: "Metrics",
    statKey: "contactsAnalyzed",
    statLabel: "contacts",
    color: "#818cf8",
  },
  {
    icon: HeartPulse,
    title: "Scoring",
    statKey: "contactsScored",
    statLabel: "scored",
    color: "#10b981",
  },
  {
    icon: AlertTriangle,
    title: "Anomalies",
    statKey: "anomaliesDetected",
    statLabel: "detected",
    color: "#f59e0b",
  },
  {
    icon: Zap,
    title: "Actions",
    statKey: "actionsGenerated",
    statLabel: "generated",
    color: "#ec4899",
  },
];

export default function PipelineVisualizer({ stats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold text-slate-100 mb-1">
        Processing Pipeline
      </h2>
      <p className="text-xs text-slate-500 mb-5">
        End-to-end data flow from raw chats to actionable intelligence
      </p>

      {/* Pipeline Flow — responsive grid on small, flex on large */}
      <div className="grid grid-cols-5 gap-1 items-start">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const value = stats[stage.statKey] || 0;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              className="flex flex-col items-center gap-1.5 relative"
            >
              {/* Icon Node */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center pulse-glow"
                style={{
                  background: `${stage.color}15`,
                  boxShadow: `0 0 15px ${stage.color}30`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: stage.color }} />
              </div>

              {/* Label */}
              <span className="text-[11px] font-medium text-slate-300 text-center leading-tight">
                {stage.title}
              </span>

              {/* Stat */}
              <div className="text-center">
                <span
                  className="text-lg font-bold block"
                  style={{ color: stage.color }}
                >
                  {value}
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">{stage.statLabel}</p>
              </div>

              {/* Arrow connector (absolutely positioned between nodes) */}
              {i < stages.length - 1 && (
                <ChevronRight
                  className="w-4 h-4 text-slate-600 absolute -right-2.5 top-3.5"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
