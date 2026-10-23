import { AgentConfig } from '../../types/agent';

interface AgentProps {
  config: AgentConfig;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function Agent({ config, onActivate, onDeactivate }: AgentProps) {
  return (
    <div className="agent">
      <h3>{config.name}</h3>
      <div className="agent-capabilities">
        {config.capabilities?.map((cap: string, i: number) => (
          <span key={i} className="capability-tag">{cap}</span>
        ))}
      </div>
      <div className="agent-controls">
        <button onClick={onActivate}>Activate</button>
        <button onClick={onDeactivate}>Deactivate</button>
      </div>
    </div>
  );
} 