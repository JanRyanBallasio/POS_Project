import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function POSRightColUpper() {
  return (
    <Card className="h-full ">
      <CardHeader>
        <CardTitle>Total</CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Cash</Label>
            </div>
            <Input />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full mt-5">Submit</Button>
      </CardFooter>
    </Card>
  );
}
