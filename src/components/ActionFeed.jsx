import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Check,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const priorityConfig = {
  1: {
    label: "Urgent",
    icon: AlertCircle,
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  2: {
    label: "Important",
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  3: {
    label: "Suggested",
    icon: Lightbulb,
    color: "#3b82f6",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

function ActionItem({ action, onDone }) {
  const [done, setDone] = useState(false);
  const config = priorityConfig[action.priority] || priorityConfig[3];
  const Icon = config.icon;

  const handleDone = () => {
    setDone(true);
    onDone?.(action);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: done ? 0.4 : 1, x: 0 }}
      className={`glass rounded-xl p-4 border ${config.border} ${done ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Priority Icon */}
        <div
          className={`${config.bg} p-2 rounded-lg shrink-0 mt-0.5`}
        >
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: `${config.color}20`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">
              {action.type.replace(/_/g, " ")}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-slate-200 mb-1">
            {action.title}
          </h4>

          {/* Description */}
          <p className="text-xs text-slate-400 mb-3">{action.description}</p>

          {/* Suggested Message */}
          <div className="bg-slate-800/50 rounded-lg p-3 mb-3 border border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageCircle className="w-3 h-3 text-sky-400" />
              <span className="text-[10px] text-sky-400 font-medium uppercase tracking-wider">
                Suggested Message
              </span>
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{action.suggestedMessage}"
            </p>
          </div>

          {/* Reasoning */}
          <p className="text-[11px] text-slate-500 mb-3">
            <span className="text-slate-400 font-medium">Why:</span>{" "}
            {action.reasoning}
          </p>

          {/* Done Button */}
          <button
            onClick={handleDone}
            disabled={done}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              done
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
            }`}
          >
            {done ? (
              <>
                <Check className="w-3.5 h-3.5" /> Done
              </>
            ) : (
              <>
                Mark as Done <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ActionFeed({ actions }) {
  const [completedActions, setCompletedActions] = useState(new Set());

  const handleDone = (action) => {
    setCompletedActions((prev) => new Set([...prev, action.title]));
  };

  const pendingCount = actions.length - completedActions.size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Action Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {pendingCount} action{pendingCount !== 1 ? "s" : ""} pending
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        <AnimatePresence>
          {actions.map((action, i) => (
            <ActionItem
              key={`${action.contactName}-${action.type}-${i}`}
              action={action}
              onDone={handleDone}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
