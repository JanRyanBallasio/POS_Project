import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import StockMovementTable from "./stockTable";
export default function CardTable() {
    return (
        <Card className="h-full border">
            <CardContent>
                <StockMovementTable />
            </CardContent>
        </Card>
    )
}