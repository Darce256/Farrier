import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  creator: {
    name: string;
  };
}

const Avatar = ({ creator }: { creator: { name: string } | null }) => {
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length === 0) return "U";
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold overflow-hidden">
      {getInitials(creator?.name)}
    </div>
  );
};

export default function AuthenticatedHeader() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [horseName, setHorseName] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (user) {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          creator:profiles!notifications_creator_id_fkey(name)
        `
        )
        .eq("mentioned_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else if (data) {
        setNotifications(data as Notification[]);
      }
    }
  };
  useEffect(() => {
    if (id) {
      const fetchHorseName = async () => {
        const { data, error } = await supabase
          .from("horses")
          .select("Name")
          .eq("id", id)
          .single();

        if (!error && data) {
          setHorseName(data.Name);
        }
      };

      fetchHorseName();
    }
  }, [id]);
  const toggleReadStatus = async (
    notificationId: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: !currentStatus })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prevNotifications: Notification[]) =>
        prevNotifications.map((notification: Notification) =>
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

  const handleNotificationClick = (notification: Notification) => {
    setIsDropdownOpen(false);
    navigate(`/inbox?notificationId=${notification.id}`);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
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
            {location.pathname.startsWith("/horses") && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/horses">Horses</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {id && horseName && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{horseName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <BellIcon className="h-5 w-5" />
            {notifications.filter((n: Notification) => !n.read).length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs">
                {notifications.filter((n: Notification) => !n.read).length}
              </span>
            )}
          </Button>
          {isDropdownOpen && notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 h-64 flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                <ul className="overflow-y-auto flex-grow">
                  {notifications.map((notification: Notification) => (
                    <li
                      key={notification.id}
                      className="py-2 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar creator={notification.creator} />
                        <div className="flex-grow min-w-0">
                          <span
                            className="block truncate"
                            dangerouslySetInnerHTML={{
                              __html: notification.message,
                            }}
                          ></span>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
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
