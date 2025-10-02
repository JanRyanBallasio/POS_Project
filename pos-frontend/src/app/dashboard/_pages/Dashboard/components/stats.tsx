import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";

interface StatsData {
    todaysSales: number;
    todaysTransactions: number;
    itemsSoldToday: number;
}

export default function Stats() {
    const [stats, setStats] = useState<StatsData>({
        todaysSales: 0,
        todaysTransactions: 0,
        itemsSoldToday: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            console.log('📊 Fetching today\'s stats...');

            const res = await axios.get("/sales/stats"); 
            const data = res.data.data;

            console.log('📊 Stats received:', data);

            // Fix: Check if data exists and has the expected structure
            if (data && typeof data === 'object') {
                setStats({
                    todaysSales: data.todaysSales || 0,
                    todaysTransactions: data.todaysTransactions || 0,
                    itemsSoldToday: data.itemsSoldToday || 0
                });
            } else {
                console.warn('📊 Invalid stats data received:', data);
                // Keep default values
            }
        } catch (err) {
            console.error('📊 Stats error:', err);
            // Keep default values on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const statsData = [
        {
            title: "Today's Sales",
            content: loading ? "..." : `₱ ${stats.todaysSales.toLocaleString()}`,
            icon: <DollarSign size={20} />,
        },
        {
            title: "Items Sold Today",
            content: loading ? "..." : stats.itemsSoldToday.toLocaleString(),
            icon: <Package size={20} />,
        },
        {
            title: "Today's Transactions",
            content: loading ? "..." : stats.todaysTransactions.toLocaleString(),
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
