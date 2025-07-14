import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  return (
    <nav  className="py-4 px-2 flex items-center w-full h-full border-b">
      <SidebarTrigger className="" />
    </nav >
  );
}
