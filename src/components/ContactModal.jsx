import { X, Clock, MessageSquare, ArrowUpDown, TrendingUp, Send, Reply, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { USER_NAME } from "../data/syntheticChats";

const MetricItem = ({ icon: Icon, label, value, color = "#94a3b8" }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
    <Icon className="w-4 h-4 shrink-0" style={{ color }} />
    <div className="flex-1">
      <span className="text-xs text-slate-500">{label}</span>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  </div>
);

function ChatBubble({ msg }) {
  const isUser = msg.sender === USER_NAME;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] px-3.5 py-2 text-sm ${
          isUser ? "chat-bubble-sent text-white" : "chat-bubble-received text-slate-200"
        }`}
      >
        {msg.message}
        <p className="text-[10px] mt-1 opacity-50">
          {new Date(msg.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default function ContactModal({ contact, onClose }) {
  if (!contact) return null;

  const { metrics, score: scoreObj, anomalies, actions: contactActions } = contact;
  const messages = contact.messages || [];

  // Weekly frequency bar chart data
  const weeklyData = (metrics.weeklyMessageCounts || []).map((count, i) => ({
    week: `W${i + 1}`,
    messages: count,
  }));

  const last5Messages = messages.slice(-5);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 glass-strong rounded-t-2xl p-5 border-b border-slate-700/30 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
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
                <h2 className="text-xl font-bold text-white">
                  {metrics.contactName}
                </h2>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full inline-block mt-1"
                  style={{
                    background: `${scoreObj.status.color}20`,
                    color: scoreObj.status.color,
                  }}
                >
                  {scoreObj.status.emoji} {scoreObj.status.label} — Score: {scoreObj.score}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Metrics Grid */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                <MetricItem
                  icon={MessageSquare}
                  label="Total Messages"
                  value={metrics.totalMessages}
                  color="#38bdf8"
                />
                <MetricItem
                  icon={ArrowUpDown}
                  label="Reciprocity Ratio"
                  value={metrics.reciprocityRatio}
                  color={metrics.reciprocityRatio > 0.7 ? "#10b981" : "#f59e0b"}
                />
                <MetricItem
                  icon={Clock}
                  label="Avg Response Time"
                  value={metrics.avgResponseTime !== null ? `${metrics.avgResponseTime}h` : "N/A"}
                  color="#818cf8"
                />
                <MetricItem
                  icon={TrendingUp}
                  label="Msgs/Week"
                  value={metrics.messageFrequency}
                  color="#10b981"
                />
                <MetricItem
                  icon={Send}
                  label="Sent / Received"
                  value={`${metrics.sentByUser} / ${metrics.sentByContact}`}
                  color="#38bdf8"
                />
                <MetricItem
                  icon={Reply}
                  label="Initiation Ratio"
                  value={`${Math.round(metrics.initiationRatio * 100)}% you`}
                  color="#f59e0b"
                />
                <MetricItem
                  icon={Gauge}
                  label="Conversation Depth"
                  value={`${metrics.conversationDepth} turns/session`}
                  color="#8b5cf6"
                />
                <MetricItem
                  icon={Clock}
                  label="Peak Hour"
                  value={`${metrics.peakActivityHour}:00 UTC`}
                  color="#64748b"
                />
              </div>
            </div>

            {/* Weekly Frequency Chart */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Weekly Message Frequency
              </h3>
              <div className="h-40 bg-slate-800/30 rounded-lg p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.9)",
                        border: "1px solid rgba(148,163,184,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="messages"
                      fill={scoreObj.status.color}
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Anomalies */}
            {anomalies.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Anomalies Detected
                </h3>
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div
                      key={i}
                      className={`text-xs p-3 rounded-lg border ${
                        a.severity === "high"
                          ? "bg-red-500/10 border-red-500/20 text-red-300"
                          : a.severity === "medium"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                      }`}
                    >
                      <span className="font-semibold capitalize">
                        {a.type.replace(/_/g, " ")}
                      </span>{" "}
                      — {a.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {contactActions && contactActions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Recommended Actions
                </h3>
                <div className="space-y-2">
                  {contactActions.map((action, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                      <p className="text-sm font-medium text-slate-200">{action.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                      <div className="mt-2 p-2 rounded bg-slate-800/50 text-xs text-slate-300 italic">
                        "{action.suggestedMessage}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Chat Preview */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Recent Messages
              </h3>
              <div className="bg-slate-900/50 rounded-xl p-4 space-y-1">
                {last5Messages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))}
                {last5Messages.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No recent messages
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
