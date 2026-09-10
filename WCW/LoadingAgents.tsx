import { AgentState, AgentStatus } from "../types";

interface Props {
  agents: AgentState[];
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Waiting",
  running: "Running",
  done: "Done",
  error: "Error",
};

export function LoadingAgents({ agents }: Props) {
  return (
    <div className="loading-agents">
      <p className="agents-title">Cosmo is consulting all agents in parallel</p>
      <div className="agents-grid">
        {agents.map((agent) => (
          <div key={agent.id} className={`agent-card agent-${agent.status}`}>
            <span className="agent-icon">{agent.icon}</span>
            <div className="agent-info">
              <span className="agent-label">{agent.label}</span>
              <span className="agent-status-badge">{STATUS_LABEL[agent.status]}</span>
            </div>
            {agent.status === "running" && (
              <div className="agent-pulse-bar">
                <div className="pulse-fill" />
              </div>
            )}
            {agent.status === "done" && agent.durationMs && (
              <span className="agent-duration">{agent.durationMs}ms</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
