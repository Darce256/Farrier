import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  deleted: boolean;
  type: string;
  related_id: string;
  creator: {
    name: string;
  };
  note?: {
    subject: string;
    content: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  fetchNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  markAsRead: (id: string, isRead: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (user) {
      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          creator:profiles!notifications_creator_id_fkey(name)
        `
        )
        .eq("mentioned_user_id", user.id)
        .eq("deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      const mentionNotifications =
        notificationsData?.filter(
          (n) => n.type === "mention" && n.related_id
        ) || [];
      const noteIds = mentionNotifications.map((n) => n.related_id);

      if (noteIds.length > 0) {
        const { data: notesData, error: notesError } = await supabase
          .from("notes")
          .select("id, subject, content")
          .in("id", noteIds);

        if (notesError) {
          console.error("Error fetching notes:", notesError);
        } else {
          const enrichedNotifications = notificationsData?.map(
            (notification) => {
              if (notification.type === "mention" && notification.related_id) {
                const relatedNote = notesData?.find(
                  (note) => note.id === notification.related_id
                );
                return {
                  ...notification,
                  note: relatedNote || undefined,
                };
              }
              return notification;
            }
          );

          setNotifications(enrichedNotifications as Notification[]);
          return;
        }
      }

      setNotifications(notificationsData as Notification[]);
    }
  }, [user]);

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ deleted: true })
      .eq("id", id);

    if (error) {
      console.error("Error deleting notification:", error);
    } else {
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
    }
  };

  const markAsRead = async (id: string, isRead: boolean) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: isRead })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: isRead }
            : notification
        )
      );
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute instead

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        fetchNotifications,
        deleteNotification,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
