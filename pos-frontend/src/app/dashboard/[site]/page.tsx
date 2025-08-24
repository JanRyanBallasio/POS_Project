"use client";

import { use } from "react";
import MainDashboard from "../_pages/POS/pos-screen";
import ProductsPage from "../_pages/Products/productsScreen";
import DashboardScreen from "../_pages/Dashboard/dashboardScreen";

export default function SiteDashboardPage({
  params,
}: {
  params: Promise<{ site: string }>;
}) {
  const { site } = use(params);

  switch (site) {
    case "db":
      return <DashboardScreen />;
    case "main":
      return <MainDashboard />;
    case "products":
      return <ProductsPage />;
    default:
      return <div>{site}</div>;
  }
}
