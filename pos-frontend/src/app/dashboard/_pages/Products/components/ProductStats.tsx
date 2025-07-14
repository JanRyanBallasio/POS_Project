import { Card, CardContent } from "@/components/ui/card";

const statsData = [
  {
    title: "Total Products",
    content: "50",
  },
  {
    title: "Low Stock Items",
    content: "4",
  },
  {
    title: "Out of Stock",
    content: "0",
  },
  {
    title: "Total Value",
    content: "Rs. 799260.00",
  }
];

export default function ProductsStats() {
  return (
    <div className="grid grid-cols-4 gap-4 w-full h-full">
      {statsData.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="flex flex-col justify-center items-start h-full">
            <h1 className="text-xl font-semibold pb-4">{stat.title}</h1>
            <p className="text-2xl font-bold ">{stat.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}