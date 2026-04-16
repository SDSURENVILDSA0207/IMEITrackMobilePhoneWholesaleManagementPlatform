import api from "@/shared/api/client";

import type { DashboardAnalytics } from "./types";

export async function fetchDashboardAnalytics(params?: {
  low_stock_threshold?: number;
  recent_limit?: number;
}): Promise<DashboardAnalytics> {
  const { data } = await api.get<DashboardAnalytics>("/analytics/dashboard", { params });
  return data;
}
