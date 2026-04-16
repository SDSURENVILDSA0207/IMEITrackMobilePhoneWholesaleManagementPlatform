import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";

import { AuthLayout } from "@/app/layouts/AuthLayout";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";

import { ProtectedRoute } from "./ProtectedRoute";

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));

const SuppliersListPage = lazy(() => import("@/features/suppliers/pages/SuppliersListPage"));
const SupplierCreatePage = lazy(() => import("@/features/suppliers/pages/SupplierCreatePage"));
const SupplierEditPage = lazy(() => import("@/features/suppliers/pages/SupplierEditPage"));

const CustomersListPage = lazy(() => import("@/features/customers/pages/CustomersListPage"));
const CustomerCreatePage = lazy(() => import("@/features/customers/pages/CustomerCreatePage"));
const CustomerEditPage = lazy(() => import("@/features/customers/pages/CustomerEditPage"));

const InventoryListPage = lazy(() => import("@/features/inventory/pages/InventoryListPage"));
const BatchDetailPage = lazy(() => import("@/features/inventory/pages/BatchDetailPage"));

const PurchaseOrdersListPage = lazy(() => import("@/features/purchase-orders/pages/PurchaseOrdersListPage"));
const PurchaseOrderCreatePage = lazy(() => import("@/features/purchase-orders/pages/PurchaseOrderCreatePage"));
const PurchaseOrderDetailPage = lazy(() => import("@/features/purchase-orders/pages/PurchaseOrderDetailPage"));

const SalesOrdersListPage = lazy(() => import("@/features/sales-orders/pages/SalesOrdersListPage"));
const SalesOrderCreatePage = lazy(() => import("@/features/sales-orders/pages/SalesOrderCreatePage"));
const SalesOrderDetailPage = lazy(() => import("@/features/sales-orders/pages/SalesOrderDetailPage"));

const ReturnsListPage = lazy(() => import("@/features/returns/pages/ReturnsListPage"));
const ReturnRequestCreatePage = lazy(() => import("@/features/returns/pages/ReturnRequestCreatePage"));
const ReturnRequestDetailPage = lazy(() => import("@/features/returns/pages/ReturnRequestDetailPage"));

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "suppliers/new", element: <SupplierCreatePage /> },
          { path: "suppliers/:supplierId/edit", element: <SupplierEditPage /> },
          { path: "suppliers", element: <SuppliersListPage /> },
          { path: "customers/new", element: <CustomerCreatePage /> },
          { path: "customers/:customerId/edit", element: <CustomerEditPage /> },
          { path: "customers", element: <CustomersListPage /> },
          { path: "inventory/batches/:batchId", element: <BatchDetailPage /> },
          { path: "inventory", element: <InventoryListPage /> },
          { path: "purchase-orders/new", element: <PurchaseOrderCreatePage /> },
          { path: "purchase-orders/:purchaseOrderId", element: <PurchaseOrderDetailPage /> },
          { path: "purchase-orders", element: <PurchaseOrdersListPage /> },
          { path: "sales-orders/new", element: <SalesOrderCreatePage /> },
          { path: "sales-orders/:salesOrderId", element: <SalesOrderDetailPage /> },
          { path: "sales-orders", element: <SalesOrdersListPage /> },
          { path: "returns/new", element: <ReturnRequestCreatePage /> },
          { path: "returns/:returnId", element: <ReturnRequestDetailPage /> },
          { path: "returns", element: <ReturnsListPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="app-bg flex min-h-screen flex-col items-center justify-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Loading page…</p>
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
