import api from "@/shared/api/client";

export type AssistantAction = {
  label: string;
  path: string;
};

export type AssistantChatResponse = {
  answer: string;
  grounded: boolean;
  actions: AssistantAction[];
  suggested_prompts: string[];
};

export async function fetchAssistantPrompts(): Promise<string[]> {
  const { data } = await api.get<{ prompts: string[] }>("/assistant/prompts");
  return data.prompts;
}

export async function sendAssistantMessage(payload: {
  message: string;
  context_route?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AssistantChatResponse> {
  const { data } = await api.post<AssistantChatResponse>("/assistant/chat", payload);
  return data;
}
