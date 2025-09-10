// Stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart } from "lucide-react";
import { useSaleItems } from "@/hooks/global/fetching/useSaleItems";
import { useProducts } from "@/hooks/global/fetching/useProducts";
import { useSales } from "@/hooks/global/fetching/useSales";
function getCalendarDayRange() {
    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0); // 12:00 AM

    const end = new Date(now);
    end.setHours(23, 59, 59, 999); // 11:59 PM

    return { from: start.toISOString(), to: end.toISOString() };
}

export default function Stats() {
    const { products = [], loading: productsLoading } = useProducts();

    const { from, to } = getCalendarDayRange();

    const { sales = [], loading: salesLoading } = useSales({ from, to });
    const { saleItems: todaysSaleItems = [], loading: saleItemsLoading } =
        useSaleItems({ from, to });

    const todaysSales = sales.reduce((sum, sale) => sum + sale.total_purchase, 0);
    const todaysTransactions = sales.length;
    const itemsSoldToday = todaysSaleItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
    );

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
                        <CardTitle className="text-md font-semibold">
                            {stat.title}
                        </CardTitle>
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
