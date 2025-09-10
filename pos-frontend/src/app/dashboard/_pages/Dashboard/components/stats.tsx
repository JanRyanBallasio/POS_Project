import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart } from 'lucide-react';
import { useSaleItems } from "@/hooks/global/fetching/useSaleItems";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useSales } from "@/hooks/global/fetching/useSales"; // Make sure you have this hook

export default function Stats() {
    // aggregated overall (could be used elsewhere if needed)
    const { saleItems: allAggregated = [], loading: saleItemsLoading } = useSaleItems();

    // other hooks
    const { products = [], loading: productsLoading } = useProducts();
    const { sales = [], loading: salesLoading } = useSales();

    // Get today's date boundaries (local) and convert to ISO for the controller
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayFromIso = startOfToday.toISOString();
    const todayToIso = endOfToday.toISOString();

    // Fetch aggregated sale-items only for today
    const { saleItems: todaysSaleItems = [], loading: todaysSaleItemsLoading } = useSaleItems({
      from: todayFromIso,
      to: todayToIso
    });

    // Items Sold Today (sum quantities from aggregated server response for today's range)
    const itemsSoldToday = (todaysSaleItems || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // Get today's sales from Sales rows (unchanged)
    const getUTCDateString = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toISOString().slice(0, 10);
    };
    const todayUTC = getUTCDateString(new Date());
    const todaysSalesList = (sales || []).filter(sale => {
        return getUTCDateString(sale.created_at) === todayUTC;
    });

    const todaysSales = todaysSalesList.reduce((sum, sale) => sum + sale.total_purchase, 0);
    const todaysTransactions = todaysSalesList.length;
    const totalProducts = (products || []).length;

    const statsData = [
        {
            title: "Today's Sales",
            content: salesLoading ? "..." : `₱ ${todaysSales.toLocaleString()}`,
            icon: <DollarSign size={20} />,
        },
        {
            title: "Items Sold Today",
            content: (saleItemsLoading || todaysSaleItemsLoading) ? "..." : itemsSoldToday.toLocaleString(),
            icon: <Package size={20} />,
        },
        {
            title: "Today's Transactions",
            content: salesLoading ? "..." : todaysTransactions.toLocaleString(),
            icon: <ShoppingCart size={20} />,
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4 w-full h-full">
            {statsData.map((stat, idx) => (
                <Card key={idx} className="gap-0 flex justify-center">
                    <CardHeader className="mb-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-md font-semibold">{stat.title}</CardTitle>
                        <div className="opacity-60">{stat.icon}</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-6">{stat.content}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}