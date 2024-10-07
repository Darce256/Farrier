import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Trash2 } from "lucide-react"; // Import Trash2 icon
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/Contexts/AuthProvider";
import { MdMailOutline } from "react-icons/md";
import { useNotifications } from "@/components/Contexts/NotificationProvider";
import { getRelativeTimeString } from "@/lib/dateUtils";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: string;
  read: boolean;
  related_id: string;
  creator_id: string;
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
    <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
      {getInitials(creator?.name)}
    </div>
  );
};

export default function Inbox() {
  const { notifications, setNotifications } = useNotifications(); // Use the NotificationProvider
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const notificationId = searchParams.get("notificationId");
    if (notificationId) {
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        setSelectedNotification(notification as Notification);
        setShowDetail(true);
        markAsRead(notificationId);
      }
    }
  }, [searchParams, notifications]);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

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
        .eq("deleted", false) // Only fetch non-deleted notifications
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else if (data) {
        setNotifications(data);
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ deleted: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    } else {
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n.id !== notificationId)
      );
      toast.success("Notification deleted successfully");
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null);
        setShowDetail(false);
        setSearchParams({});
      }
    }
  };

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      setSelectedNotification(notification);
      setShowDetail(true);
      setSearchParams({ notificationId: notification.id });
      if (!notification.read) {
        markAsRead(notification.id);
      }
    },
    [setSearchParams]
  );

  const handleBackToInbox = useCallback(() => {
    setShowDetail(false);
    setSearchParams({}); // Clear the URL parameters
  }, [setSearchParams]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 align-middle mb-4">
        <MdMailOutline className="text-3xl" />
        <h1 className="text-3xl font-bold text-black">Inbox</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] max-h-[600px]">
            <div
              className={`w-full md:w-1/3 ${
                showDetail ? "hidden md:block" : ""
              } md:overflow-hidden md:flex md:flex-col h-full`}
            >
              <Card className="h-full rounded-none border-0 flex flex-col border-r border-gray-200">
                <CardHeader className="py-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    {unreadCount} unread messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100%-80px)] px-4 pb-4">
                    {notifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`flex items-start space-x-4 p-3 cursor-pointer hover:bg-accent rounded-md ${
                          selectedNotification?.id === notification.id
                            ? "bg-accent"
                            : ""
                        } ${!notification.read ? "font-bold" : ""}`}
                      >
                        <div
                          className="flex items-start space-x-3 flex-grow min-w-0"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <Avatar creator={notification.creator} />
                          <div className="space-y-1 flex-grow min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {notification.title}
                            </p>
                            <p
                              className="text-sm text-muted-foreground line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: notification.message,
                              }}
                            ></p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTimeString(
                                new Date(notification.created_at)
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            <div
              className={`w-full md:w-2/3 ${
                showDetail ? "" : "hidden md:block"
              } md:overflow-hidden md:flex md:flex-col h-full`}
            >
              <Card className="h-full rounded-none border-0 flex flex-col">
                <CardHeader className="py-3">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      className="p-0 md:hidden mr-2"
                      onClick={handleBackToInbox}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {selectedNotification && (
                      <div className="flex items-center space-x-3">
                        <Avatar creator={selectedNotification.creator} />
                        <div>
                          <CardTitle className="text-lg">
                            {selectedNotification.creator.name}
                          </CardTitle>
                          <CardDescription>
                            {selectedNotification.title}
                          </CardDescription>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto p-4">
                  {selectedNotification && (
                    <div>
                      <span
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: selectedNotification.message,
                        }}
                      ></span>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getRelativeTimeString(
                          new Date(selectedNotification.created_at)
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
