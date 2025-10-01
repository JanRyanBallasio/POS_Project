import DashboardClient from "./DashboardClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { site: "main" },
    { site: "db" },
    { site: "products" },
    { site: "stock" },
  ];
}

// 👇 Notice the "async" and "props: { params }"
export default async function SiteDashboardPage(props: {
  params: Promise<{ site: string }>;
}) {
  const { site } = await props.params;
  return <DashboardClient site={site} />;
}
