import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaRegStickyNote } from "react-icons/fa";
import { MentionsInput, Mention, OnChangeHandlerFunc } from "react-mentions";
import MentionInputStyles from "../../MentionInputStyles.ts";
import MentionStyles from "../../MentionStyles.ts";
import { Loader2 } from "lucide-react"; // Import the spinner icon
import toast from "react-hot-toast"; // Import react-hot-toast

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/Contexts/AuthProvider"; // Assuming you have an AuthProvider

type UserProfile = {
  id: string;
  name: string;
};

export default function Notes() {
  const { user } = useAuth(); // Get the authenticated user
  const [newNote, setNewNote] = useState("");
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name");
      if (error) {
        console.error("Error fetching profiles:", error);
      } else {
        console.log("Fetched profiles:", data);
        setUserProfiles(data);
      }
    };
    fetchUserProfiles();
  }, []);

  const handleAddNote = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      console.log(newNote);

      // Add the note to the notes table
      const { data: noteData, error: noteError } = await supabase
        .from("notes")
        .insert([{ content: newNote, user_id: user.id }])
        .select();

      if (noteError) throw noteError;

      const noteId = noteData[0].id;

      // Extract mentions from the note
      const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
      let match;
      const mentions = [];
      while ((match = mentionRegex.exec(newNote)) !== null) {
        mentions.push({ name: match[1], id: match[2] });
      }

      // Clean up the note content to replace mentions with just the user's name
      let cleanedNote = newNote.replace(mentionRegex, "@$1");

      // Add notifications for mentioned users
      for (const mention of mentions) {
        const notificationMessage = cleanedNote.replace(
          new RegExp(`@${mention.name}`, "g"),
          `<strong>@${mention.name}</strong>`
        );

        await supabase.from("notifications").insert([
          {
            user_id: mention.id,
            message: `You were mentioned in a note: "${notificationMessage}"`,
            type: "mention",
            related_id: noteId,
          },
        ]);
      }

      // Clear the note input
      setNewNote("");

      // Show success toast
      toast.success("Note added successfully!");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaChange: OnChangeHandlerFunc = (event: any) => {
    setNewNote(event.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 align-middle mb-6">
        <FaRegStickyNote className="text-4xl " />
        <h1 className="text-4xl font-bold  text-black">Notes</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sm:p-8">
        <div className="space-y-4 relative">
          <h2 className="text-2xl font-semibold">Add New Note</h2>
          <MentionsInput
            style={MentionInputStyles}
            value={newNote}
            onChange={handleTextareaChange}
          >
            <Mention
              style={MentionStyles}
              data={userProfiles.map((user) => ({
                id: user.id,
                display: user.name,
              }))}
              markup={"@[__display__](__id__)"}
              trigger={"@"}
            />
          </MentionsInput>
          <Button onClick={handleAddNote} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Note...
              </>
            ) : (
              "Add Note"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
