/** CTA link rendered inside assistant messages (legacy + supplementary). */
export type AssistantAction = {
  label: string;
  path: string;
};

/** Primary executable action from the assistant (extensible by `type`). */
export type AssistantNavigateAction = {
  type: "navigate";
  target: string;
  query?: Record<string, string>;
  /** Optional semantic slug from the API (e.g. low_stock, imei_search). */
  context?: string | null;
};

export type AssistantChatResponse = {
  answer: string;
  grounded: boolean;
  intent?: string | null;
  action?: AssistantNavigateAction | null;
  actions: AssistantAction[];
  suggested_prompts: string[];
};

export function buildNavigateSearch(query?: Record<string, string> | null): string {
  if (!query || Object.keys(query).length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
