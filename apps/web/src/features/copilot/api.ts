import api from "@/shared/api/client";

import type { CopilotOverview } from "./types";

export async function fetchCopilotOverview(params?: {
  low_stock_threshold?: number;
  trend_days?: number;
  slow_mover_days?: number;
  slow_mover_min_on_hand?: number;
  inactive_days?: number;
}): Promise<CopilotOverview> {
  const { data } = await api.get<CopilotOverview>("/copilot/overview", { params });
  return data;
}
