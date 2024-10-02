import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/Contexts/AuthProvider";

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
    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
      {getInitials(creator?.name)}
    </div>
  );
};

export default function Inbox() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const notificationId = searchParams.get("notificationId");
    if (notificationId) {
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        setSelectedNotification(notification);
        setShowDetail(true);
        markAsRead(notificationId);
      }
    }
  }, [searchParams, notifications]);

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
        setNotifications(data);
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetail(true);
    markAsRead(notification.id);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 align-middle mb-6">
        <Bell className="text-4xl" />
        <h1 className="text-4xl font-bold text-black">Inbox</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row h-[600px]">
            <div
              className={`w-full md:w-2/5 ${
                showDetail ? "hidden md:block" : ""
              }`}
            >
              <Card className="h-full rounded-none border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    {notifications.filter((n) => !n.read).length} unread
                    messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px] md:h-[520px] px-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-center space-x-4 p-4 cursor-pointer hover:bg-accent rounded-md ${
                          selectedNotification?.id === notification.id
                            ? "bg-accent"
                            : ""
                        } ${!notification.read ? "font-bold" : ""}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <Avatar creator={notification.creator} />
                        <div className="flex-grow min-w-0">
                          <span
                            className="block truncate"
                            dangerouslySetInnerHTML={{
                              __html: notification.message,
                            }}
                          ></span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            <div
              className={`w-full md:w-3/5 ${
                showDetail ? "" : "hidden md:block"
              }`}
            >
              <Card className="h-full rounded-none border-0 shadow-none">
                <CardHeader>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      className="p-0 md:hidden mr-2"
                      onClick={() => setShowDetail(false)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle>{selectedNotification?.title}</CardTitle>
                      <CardDescription>
                        {selectedNotification &&
                          new Date(
                            selectedNotification.created_at
                          ).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedNotification && (
                    <div className="flex items-start space-x-4">
                      <Avatar creator={selectedNotification.creator} />
                      <div>
                        <span
                          className="text-sm"
                          dangerouslySetInnerHTML={{
                            __html: selectedNotification.message,
                          }}
                        ></span>
                      </div>
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
