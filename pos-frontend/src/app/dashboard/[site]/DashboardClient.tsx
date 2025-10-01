// src/app/dashboard/[site]/DashboardClient.tsx
"use client";

import MainDashboard from "../_pages/POS/pos-screen";
import ProductsPage from "../_pages/Products/productsScreen";
import DashboardScreen from "../_pages/Dashboard/dashboardScreen";
import StockMovementScreen from "../_pages/StockMovements/stockMScreen";

export default function DashboardClient({ site }: { site: string }) {
  switch (site) {
    case "main":
      return <MainDashboard />;
    case "db":
      return <DashboardScreen />;
    case "products":
      return <ProductsPage />;
    case "stock":
      return <StockMovementScreen />;
    default:
      return null;
  }
}
