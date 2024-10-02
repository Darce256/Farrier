import { useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { TbHorseshoe } from "react-icons/tb";
import { FaRegStickyNote } from "react-icons/fa";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { MdMailOutline } from "react-icons/md"; // Add this import

import {
  MenuIcon,
  StoreIcon,
  InfoIcon,
  SettingsIcon,
  Bell,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: StoreIcon, href: "/dashboard" },
    { name: "Horses", icon: LiaHorseHeadSolid, href: "/horses" },
    { name: "New Shoeings", icon: TbHorseshoe, href: "/new-shoeings" },
    { name: "Notes", icon: FaRegStickyNote, href: "/notes" },
    { name: "Calendar", icon: IoCalendarNumberOutline, href: "/calendar" },
    { name: "Inbox", icon: MdMailOutline, href: "/inbox" }, // Updated icon
  ];

  const settingsItem = {
    name: "Settings",
    icon: SettingsIcon,
    href: "/settings",
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 py-5 h-full">
          <TooltipProvider>
            {navItems.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="z-50">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            <div className="flex-grow" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={settingsItem.href}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <settingsItem.icon className="h-5 w-5" />
                  <span className="sr-only">{settingsItem.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-50">
                <p>{settingsItem.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <SheetContent side="left" className="w-[250px] sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              {[...navItems, settingsItem].map((item) => (
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
