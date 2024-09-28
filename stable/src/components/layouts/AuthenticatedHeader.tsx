import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/components/Contexts/AuthProvider";
import {
  MenuIcon,
  StoreIcon,
  UsersIcon,
  InfoIcon,
  SettingsIcon,
} from "lucide-react";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { TbHorseshoe } from "react-icons/tb";

export default function AuthenticatedHeader() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const getInitials = (name: string) => {
    const names = name.split(" ");
    const initials = names.map((n) => n[0]).join("");
    return initials.toUpperCase();
  };

  const navItems = [
    { name: "Dashboard", icon: StoreIcon, href: "/dashboard" },
    { name: "Horses", icon: LiaHorseHeadSolid, href: "/horses" },
    { name: "New Shoeings", icon: TbHorseshoe, href: "/new-shoeings" },
    { name: "Customers", icon: UsersIcon, href: "/customers" },
    { name: "Analytics", icon: InfoIcon, href: "/analytics" },
    { name: "Settings", icon: SettingsIcon, href: "/settings" },
  ];

  const getCurrentPageName = () => {
    const currentPath = location.pathname;
    const currentItem = navItems.find((item) => item.href === currentPath);
    return currentItem ? currentItem.name : "Overview";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 pt-0 sm:pt-0">
      {/* Mobile Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="mr-2 sm:hidden"
            onClick={() => setIsOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] sm:max-w-sm">
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

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {location.pathname !== "/dashboard" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getCurrentPageName()}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0"></div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {getInitials(user?.name || "JD")}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.name || "John Doe"}</span>
              <span className="text-sm text-muted-foreground">
                {user?.email || "john.doe@example.com"}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
