import React from "react";
import { Link } from "react-router";
import { FileText, FileSearch, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { agents, type Agent } from "../../data/agentsData";

const agentIcons: Record<string, React.ElementType> = {
  "invoice-extraction": FileText,
  "contract-parser":    FileSearch,
  "audit-agent":        ShieldCheck,
};

function AgentCard({ agent }: { agent: Agent }) {
  const Icon = agentIcons[agent.slug] ?? ShieldCheck;

  return (
    <div className="bg-white rounded-lg border border-gray-100 px-5 py-5 flex flex-col hover:border-gray-200 hover:shadow-sm transition-all">
      {/* Card header: icon + status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 border border-orange-100">
          <Icon size={18} className="text-[#F06B00]" />
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Name + description */}
      <h3 className="text-sm font-medium text-gray-900 mb-1.5">{agent.name}</h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{agent.description}</p>

      {/* Configure link */}
      <div className="mt-5 pt-4 border-t border-gray-50">
        <Link
          to={`/agents/${agent.slug}`}
          className="text-sm text-[#F06B00] hover:underline font-medium"
        >
          Configure →
        </Link>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-gray-900">Agents</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure AI-powered agents that process your data</p>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}
