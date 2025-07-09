import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100 flex flex-col gap-4">
      dis is da landing page
      <Link href={"dashboard/main"}>
        <Button variant="destructive">Destructive</Button>
      </Link>
    </div>
  );
}
