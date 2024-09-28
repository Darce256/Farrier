import { useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FaHorseHead } from "react-icons/fa6";
import { TbHorseshoe } from "react-icons/tb";
import {
  MenuIcon,
  StoreIcon,
  UsersIcon,
  InfoIcon,
  SettingsIcon,
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: StoreIcon, href: "/dashboard" },
    { name: "Horses", icon: FaHorseHead, href: "/horses" },
    { name: "New Shoeings", icon: TbHorseshoe, href: "/new-shoeings" },
    { name: "Customers", icon: UsersIcon, href: "/customers" },
    { name: "Analytics", icon: InfoIcon, href: "/analytics" },
    { name: "Settings", icon: SettingsIcon, href: "/settings" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Hamburger Menu */}
      <div className="fixed top-4 left-4 z-30 sm:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsOpen(true)}
            >
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[200px] sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
