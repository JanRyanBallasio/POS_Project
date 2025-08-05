import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart } from 'lucide-react';
import { useSaleItems } from "@/hooks/global/fetching/useSaleItems";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useSales } from "@/hooks/global/fetching/useSales"; // Make sure you have this hook

export default function Stats() {
    const { saleItems, loading: saleItemsLoading } = useSaleItems();
    const { products, loading: productsLoading } = useProducts();
    const { sales, loading: salesLoading } = useSales();

    // Get today's date in UTC (YYYY-MM-DD)
    const getUTCDateString = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toISOString().slice(0, 10);
    };
    const todayUTC = getUTCDateString(new Date());

    // Filter sales for today (UTC)
    const todaysSalesList = sales.filter(sale => {
        return getUTCDateString(sale.created_at) === todayUTC;
    });

    // Today's Sales (sum total_purchase for today's sales)
    const todaysSales = todaysSalesList.reduce((sum, sale) => sum + sale.total_purchase, 0);

    // Today's Transactions (count of sales today)
    const todaysTransactions = todaysSalesList.length;

    // Total Products
    const totalProducts = products.length;

    // Items Sold Today (sum quantity from saleItems for today)
    const todaysSaleItems = saleItems.filter(item => getUTCDateString(item.created_at) === todayUTC);
    const itemsSoldToday = todaysSaleItems.reduce((sum, item) => sum + item.quantity, 0);

    const statsData = [
        {
            title: "Today's Sales",
            content: salesLoading ? "..." : `₱ ${todaysSales.toLocaleString()}`,
            icon: <DollarSign size={20} />,
        },
        {
            title: "Items Sold Today",
            content: saleItemsLoading ? "..." : itemsSoldToday.toLocaleString(),
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