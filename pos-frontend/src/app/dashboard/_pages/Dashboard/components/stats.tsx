import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';

export default function Stats() {
    const statsData = [
        {
            title: "Today's Sales",
            content: "10",
            icon: <DollarSign size={20}/>,
        },
        {
            title: "Total Products",
            content: "011",
            icon: <Package size={20}/>,
        },
        {
            title: "Transactions",
            content: "0111",
            icon: <ShoppingCart size={20}/>,
        }
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