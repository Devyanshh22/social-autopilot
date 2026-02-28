import { useState, useMemo } from "react";
import {
  Users,
  HeartPulse,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

import { syntheticChats, USER_NAME } from "../data/syntheticChats";
import { ingest } from "../pipeline/ingest";
import { computeAllMetrics } from "../pipeline/metrics";
import { scoreAll } from "../pipeline/scorer";
import { detectAllAnomalies } from "../pipeline/anomaly";
import { generateActions } from "../pipeline/actions";

import ContactCard from "./ContactCard";
import RelationshipGraph from "./RelationshipGraph";
import ActionFeed from "./ActionFeed";
import InsightPanel from "./InsightPanel";
import PipelineVisualizer from "./PipelineVisualizer";
import ContactModal from "./ContactModal";

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-xl p-5 flex items-center gap-4"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [selectedContact, setSelectedContact] = useState(null);

  // Run the entire pipeline
  const pipelineData = useMemo(() => {
    // 1. Ingest
    const ingestedData = ingest(syntheticChats);

    // 2. Compute Metrics
    const allMetrics = computeAllMetrics(ingestedData);

    // 3. Score
    const allScores = scoreAll(allMetrics);

    // 4. Detect Anomalies
    const allAnomalies = detectAllAnomalies(ingestedData, allMetrics);

    // 5. Generate Actions
    const allActions = generateActions(allScores, allMetrics, allAnomalies, ingestedData);

    // Combine into per-contact objects
    const contacts = allMetrics.map((metrics) => {
      const score = allScores.find((s) => s.contactName === metrics.contactName);
      const anomalies = allAnomalies.filter(
        (a) => a.contactName === metrics.contactName
      );
      const actions = allActions.filter(
        (a) => a.contactName === metrics.contactName
      );
      const platform = ingestedData.contacts[metrics.contactName].platform;
      const messages = ingestedData.contacts[metrics.contactName].messages;
      return { metrics, score, anomalies, actions, platform, messages };
    });

    // Sort contacts: At-Risk and Dormant first, then by score ascending
    contacts.sort((a, b) => {
      const aUrgent = a.score.score < 50 ? 0 : 1;
      const bUrgent = b.score.score < 50 ? 0 : 1;
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return b.score.score - a.score.score;
    });

    // Pipeline stats
    const stats = {
      messagesProcessed: ingestedData.totalMessages,
      contactsAnalyzed: ingestedData.contactCount,
      contactsScored: allScores.length,
      anomaliesDetected: allAnomalies.length,
      actionsGenerated: allActions.length,
    };

    return {
      contacts,
      allMetrics,
      allScores,
      allAnomalies,
      allActions,
      stats,
    };
  }, []);

  const {
    contacts,
    allAnomalies,
    allActions,
    stats,
  } = pipelineData;

  const thrivingCount = contacts.filter(
    (c) => c.score.status.label === "Thriving"
  ).length;
  const needsAttentionCount = contacts.filter(
    (c) =>
      c.score.status.label === "At-Risk" ||
      c.score.status.label === "Dormant" ||
      c.score.status.label === "Cooling"
  ).length;

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Contacts"
          value={contacts.length}
          color="#38bdf8"
          delay={0}
        />
        <StatCard
          icon={HeartPulse}
          label="Thriving"
          value={thrivingCount}
          color="#10b981"
          delay={0.05}
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs Attention"
          value={needsAttentionCount}
          color="#f59e0b"
          delay={0.1}
        />
        <StatCard
          icon={Zap}
          label="Actions Pending"
          value={allActions.length}
          color="#ec4899"
          delay={0.15}
        />
      </div>

      {/* Pipeline Visualizer */}
      <PipelineVisualizer stats={stats} />

      {/* Contact Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Relationship Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.metrics.contactName}
              contact={contact}
              onClick={() => handleContactClick(contact)}
            />
          ))}
        </div>
      </div>

      {/* Two Column Layout: Graph + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RelationshipGraph contacts={contacts} />
        <InsightPanel
          contacts={contacts}
          anomalies={allAnomalies}
          actions={allActions}
        />
      </div>

      {/* Action Feed */}
      <ActionFeed
          actions={allActions}
          platformMap={Object.fromEntries(
            contacts.map((c) => [c.metrics.contactName, c.platform])
          )}
        />

      {/* Contact Detail Modal */}
      {selectedContact && (
        <ContactModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}
