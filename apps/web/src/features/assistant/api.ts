import api from "@/shared/api/client";

import type { AssistantChatResponse } from "@/features/assistant/types";

export type { AssistantAction, AssistantChatResponse, AssistantNavigateAction } from "@/features/assistant/types";

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
