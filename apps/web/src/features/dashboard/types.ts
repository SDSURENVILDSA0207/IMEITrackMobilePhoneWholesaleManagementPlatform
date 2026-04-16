import type { PurchaseOrderStatus } from "@/features/purchase-orders/types";
import type { SalesOrderStatus } from "@/features/sales-orders/types";

export type KpiCounts = {
  total_suppliers: number;
  total_customers: number;
  total_available_devices: number;
  total_sold_devices: number;
  total_reserved_devices: number;
};

export type LowStockProductModelRow = {
  product_model_id: number;
  brand: string;
  model_name: string;
  storage: string;
  color: string;
  available_units: number;
};

export type LowStockSummary = {
  threshold: number;
  rows: LowStockProductModelRow[];
};

export type RecentPurchaseOrderRow = {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string | null;
  status: PurchaseOrderStatus;
  total_amount: string | null;
  created_at: string;
};

export type RecentSalesOrderRow = {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string | null;
  status: SalesOrderStatus;
  total_amount: string | null;
  created_at: string;
};

export type ReturnStatusCount = {
  status: string;
  count: number;
};

export type ConditionGradeCount = {
  condition_grade: string;
  count: number;
};

export type DashboardAnalytics = {
  kpis: KpiCounts;
  low_stock: LowStockSummary;
  recent_purchase_orders: RecentPurchaseOrderRow[];
  recent_sales_orders: RecentSalesOrderRow[];
  returns_by_status: ReturnStatusCount[];
  inventory_by_condition_grade: ConditionGradeCount[];
};
