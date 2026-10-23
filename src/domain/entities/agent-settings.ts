export const AGENT_MODEL_OPTIONS = [
  {
    value: 'deepseek-ai/DeepSeek-V4.1-Flash-1017',
    label: 'DeepSeek V4.1 Flash',
  },
] as const;

export type AgentModel = (typeof AGENT_MODEL_OPTIONS)[number]['value'];

export const DEFAULT_AGENT_PROVIDER_NAME = 'DeepInfra';

export interface AgentSettings {
  providerName: string;
  apiKey: string;
  model: AgentModel;
}

export function isAgentModel(value: unknown): value is AgentModel {
  return AGENT_MODEL_OPTIONS.some((option) => option.value === value);
}

export function isCompleteAgentSettings(
  value: unknown,
): value is AgentSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AgentSettings>;

  return (
    typeof candidate.providerName === 'string' &&
    candidate.providerName.trim().length > 0 &&
    typeof candidate.apiKey === 'string' &&
    candidate.apiKey.trim().length > 0 &&
    isAgentModel(candidate.model)
  );
}
