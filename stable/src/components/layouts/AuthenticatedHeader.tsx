import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  BellIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { TbHorseshoe } from "react-icons/tb";
import { supabase } from "@/lib/supabaseClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

export default function AuthenticatedHeader() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const fetchNotifications = async () => {
    if (user) {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setNotifications(data as any);
      }
    }
  };

  const toggleReadStatus = async (
    notificationId: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: !currentStatus })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prevNotifications: any) =>
        prevNotifications.map((notification: any) =>
          notification.id === notificationId
            ? { ...notification, read: !currentStatus }
            : notification
        )
      );
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as Node).contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

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
    <header className="sticky top-0 z-10 flex h-16 sm:h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 pt-0 sm:pt-0">
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
      <div className="container mx-auto flex items-center justify-end gap-4 max-w-7xl">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <BellIcon className="h-5 w-5" />
            {notifications.filter((n: any) => !n.read).length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs">
                {notifications.filter((n: any) => !n.read).length}
              </span>
            )}
          </Button>
          {isDropdownOpen && notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 h-64 flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                <ul className="overflow-y-auto flex-grow">
                  {notifications.map((notification: any) => (
                    <li
                      key={notification.id}
                      className="py-2 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className="flex-grow pr-2"
                          dangerouslySetInnerHTML={{
                            __html: notification.message,
                          }}
                        ></span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReadStatus(
                              notification.id,
                              notification.read
                            );
                          }}
                        >
                          {notification.read ? (
                            <EyeOffIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
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
      </div>
    </header>
  );
}
