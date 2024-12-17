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
import { useAuth } from "@/components/Contexts/AuthProvider";
import { BellIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useNotifications } from "@/components/Contexts/NotificationProvider";

import { supabase } from "@/lib/supabaseClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { capitalize } from "lodash";
import React from "react";

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
  const { notifications, markAsRead, fetchNotifications } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [horseName, setHorseName] = useState<string | null>(null);

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
    await markAsRead(notificationId, !currentStatus);
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

  const handleNotificationClick = (notification: Notification) => {
    setIsDropdownOpen(false);
    navigate(`/inbox?notificationId=${notification.id}`);
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment);

    return (
      <Breadcrumb>
        <BreadcrumbList>
          {user?.isAdmin && (
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}
          {pathSegments.map((segment, index) => {
            const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
            const isLast = index === pathSegments.length - 1;

            if (segment === "dashboard" && !user?.isAdmin) return null;

            let displayName = capitalize(segment);

            // Special case for horses routes
            if (segment === "horses") {
              const isHorsesPage = pathSegments.length === 1; // Check if we're on the main horses page

              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isHorsesPage ? (
                      <BreadcrumbPage>Horses</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to="/shoeings-approval-panel?tab=horses">
                          Horses
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            }

            // Make edit/new breadcrumbs non-clickable and update text for horses
            if (segment === "edit" || segment === "new") {
              const previousSegment = pathSegments[index - 1];
              const label =
                previousSegment === "horses"
                  ? segment === "edit"
                    ? "Edit Horse"
                    : "New Horse"
                  : segment === "edit"
                  ? "Edit Customer"
                  : "New Customer";

              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </React.Fragment>
              );
            }

            // Special case for customers routes
            if (segment === "customers") {
              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/shoeings-approval-panel?tab=customers">
                        Customers
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              );
            }

            // Skip IDs in breadcrumbs
            if (
              pathSegments[index - 1] === "customers" &&
              segment.length === 36
            ) {
              return null;
            }

            return (
              <React.Fragment key={segment}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>
                      {id && horseName ? horseName : displayName}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={url}>{displayName}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-b-gray-400 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4 sm:ml-0 ml-14">
        {getBreadcrumbs()}
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
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 h-64 flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                {notifications.length > 0 ? (
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
                              {new Date(
                                notification.created_at
                              ).toLocaleString()}
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
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No Notifications Available</p>
                  </div>
                )}
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
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
