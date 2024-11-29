import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/Contexts/AuthProvider";
import { getRelativeTimeString } from "@/lib/dateUtils";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  type: "note_mention" | "direct_message";
  note_id?: string;
  created_at: string;
  read: boolean;
  sender: {
    id: string;
    name: string;
  };
  note?: {
    id: string;
    subject: string;
    content: string;
    created_at: string;
    user_id: string;
    creator: {
      name: string;
    };
  };
}

interface ConversationThread {
  id: string;
  participants: string[];
  last_message_at: string;
  created_at: string;
  profiles: {
    id: string;
    name: string;
  }[];
}

const Avatar = ({
  creator,
  isCurrentUser,
}: {
  creator: { name: string } | null;
  isCurrentUser: boolean;
}) => {
  const getInitials = (name: string | undefined) => {
    if (isCurrentUser) return "You";
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

// Helper function to clean up mentions in content
const cleanMentionText = (content: string) => {
  console.log("Cleaning mention text:", content);
  return content.replace(/@\[(.*?)\]\((.*?)\)/g, "@$1");
};

export default function Inbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThread, setSelectedThread] =
    useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Add these useEffects after the state declarations
  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]); // Fetch threads when user changes or component mounts

  useEffect(() => {
    const threadId = searchParams.get("threadId");
    if (threadId && threads.length > 0) {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        handleThreadClick(thread);
      }
    }
  }, [searchParams, threads]); // Handle URL params and thread selection

  // Fetch all conversation threads for the current user
  const fetchThreads = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First, get the threads
      const { data: threadsData, error } = await supabase
        .from("conversation_threads")
        .select(
          `
          id,
          participants,
          last_message_at,
          created_at
        `
        )
        .contains("participants", [user.id])
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Then, fetch the profiles for all participants
      if (threadsData) {
        // Get unique participant IDs from all threads
        const participantIds = [
          ...new Set(threadsData.flatMap((thread) => thread.participants)),
        ];

        // Fetch all profiles in one query
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", participantIds);

        if (profilesError) throw profilesError;

        // Combine thread data with profiles
        const threadsWithProfiles = threadsData.map((thread) => ({
          ...thread,
          profiles: thread.participants
            .map((participantId: string) =>
              profilesData?.find((profile) => profile.id === participantId)
            )
            .filter(Boolean), // Remove any undefined profiles
        }));

        setThreads(threadsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for a specific thread
  const fetchMessages = async (threadId: string) => {
    const { data: messagesData, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        thread_id,
        sender_id,
        content,
        type,
        note_id,
        created_at,
        read,
        sender:sender_id(id, name),
        note:note_id(
          id,
          subject,
          content,
          created_at,
          user_id,
          creator:user_id(name)
        )
      `
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    console.log("Fetched messages:", messagesData);
    setMessages(messagesData as any[]);
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!user || !selectedThread || !replyContent.trim()) return;

    setIsLoading(true);
    try {
      // Insert the new message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            thread_id: selectedThread.id,
            sender_id: user.id,
            content: replyContent,
            type: "direct_message",
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (messageError) throw messageError;

      // Update thread's last_message_at
      await supabase
        .from("conversation_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedThread.id);

      // Update UI
      setMessages((prev) => [...prev, messageData[0]]);
      setReplyContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a thread
  const handleThreadClick = async (thread: ConversationThread) => {
    setSelectedThread(thread);
    await fetchMessages(thread.id);
    setSearchParams({ threadId: thread.id });
  };

  // Add a MessageBubble component to handle different message types
  const MessageBubble = ({
    message,
    isCurrentUser,
  }: {
    message: Message;
    isCurrentUser: boolean;
  }) => {
    console.log("Rendering message:", message);
    return (
      <div
        className={`flex items-start space-x-3 ${
          isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        <Avatar creator={message.sender} isCurrentUser={isCurrentUser} />
        <div
          className={`flex flex-col max-w-[70%] ${
            isCurrentUser ? "items-end" : "items-start"
          }`}
        >
          {message.type === "note_mention" && (
            <div className="text-xs text-muted-foreground mb-1">
              {isCurrentUser
                ? `You mentioned ${selectedThread?.profiles
                    .filter((p) => p.id !== user?.id)
                    .map((p) => p.name)
                    .join(", ")} in a note`
                : `${message.sender.name} mentioned you in a note`}
            </div>
          )}
          <div
            className={`rounded-lg p-3 ${
              isCurrentUser
                ? "bg-primary text-primary-foreground"
                : "bg-background border"
            }`}
          >
            {message.type === "note_mention" && message.note ? (
              <>
                <div className="text-sm font-medium mb-1">
                  {message.note.subject || "Untitled Note"}
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {cleanMentionText(message.note.content)}
                </div>
              </>
            ) : message.type === "note_mention" ? (
              <div className="text-sm whitespace-pre-wrap">
                {cleanMentionText(message.content)}
              </div>
            ) : (
              <div className="text-sm">{cleanMentionText(message.content)}</div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {getRelativeTimeString(new Date(message.created_at))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-10rem-2rem)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Conversations List - add max-height for desktop */}
        <div className="col-span-1 bg-white rounded-lg shadow h-[30vh] md:h-full md:max-h-[800px] overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Conversations</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No conversations yet. Start by mentioning someone in a note!
                </div>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-3 cursor-pointer hover:bg-accent rounded-md ${
                      selectedThread?.id === thread.id ? "bg-accent" : ""
                    }`}
                    onClick={() => handleThreadClick(thread)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        creator={
                          thread.profiles.find((p) => p.id !== user?.id) || null
                        }
                        isCurrentUser={false}
                      />
                      <div>
                        <p className="font-semibold">
                          {thread.profiles
                            .filter((p) => p.id !== user?.id)
                            .map((p) => p.name)
                            .join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getRelativeTimeString(
                            new Date(thread.last_message_at)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Thread - add max-height for desktop */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow h-[calc(70vh-10rem)] md:h-full md:max-h-[720px] flex flex-col">
          {selectedThread ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2 className="font-semibold">
                  {selectedThread.profiles
                    .filter((p) => p.id !== user?.id)
                    .map((p) => p.name)
                    .join(", ")}
                </h2>
              </div>

              <ScrollArea className="flex-1 mb-auto">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isCurrentUser={message.sender_id === user?.id}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input - fixed height at bottom */}
              <div className="p-4 border-t bg-white">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Write a message..."
                  rows={3}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="mt-2"
                >
                  Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
