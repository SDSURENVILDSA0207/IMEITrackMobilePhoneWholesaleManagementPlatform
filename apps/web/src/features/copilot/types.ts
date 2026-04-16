export type CopilotSeverity = "info" | "warning" | "danger";

export type CopilotItem = {
  id: string;
  title: string;
  detail: string;
  severity: CopilotSeverity;
  metric: string | null;
  action_label: string | null;
  action_path: string | null;
};

export type CopilotProductSnippet = {
  product_model_id: number;
  label: string;
  units: number;
};

export type CopilotSupplierSnippet = {
  supplier_id: number;
  name: string;
  purchase_orders_30d: number;
};

export type CopilotSalesTrend = {
  window_days: number;
  current_units: number;
  previous_units: number;
  change_pct: number | null;
};

export type CopilotOverview = {
  generated_at: string;
  summary: string;
  alerts: CopilotItem[];
  insights: CopilotItem[];
  suggestions: CopilotItem[];
  best_sellers: CopilotProductSnippet[];
  slow_movers: CopilotProductSnippet[];
  supplier_activity: CopilotSupplierSnippet[];
  sales_trend: CopilotSalesTrend | null;
};
