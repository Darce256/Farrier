import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaRegStickyNote, FaUser } from "react-icons/fa";
import {
  MentionsInput,
  Mention,
  OnChangeHandlerFunc,
  SuggestionDataItem,
} from "react-mentions";
import MentionInputStyles from "../../MentionInputStyles.ts";
import MentionStyles from "../../MentionStyles.ts";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/Contexts/AuthProvider";
import { LiaHorseHeadSolid } from "react-icons/lia"; // Import horse icon

type UserProfile = {
  id: string;
  name: string;
};

type HorseProfile = {
  id: string;
  Name: string;
};

export default function Notes() {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [horseProfiles, setHorseProfiles] = useState<HorseProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, name");
      if (userError) {
        console.error("Error fetching user profiles:", userError);
      } else {
        setUserProfiles(userData);
      }

      const { data: horseData, error: horseError } = await supabase
        .from("horses")
        .select("id, Name");
      if (horseError) {
        console.error("Error fetching horse profiles:", horseError);
      } else {
        setHorseProfiles(horseData);
      }
    };
    fetchProfiles();
  }, []);

  const handleAddNote = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      console.log(newNote);

      const { data: noteData, error: noteError } = await supabase
        .from("notes")
        .insert([{ content: newNote, user_id: user.id }])
        .select();

      if (noteError) throw noteError;

      const noteId = noteData[0].id;

      const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
      let match;
      const mentions = [];
      while ((match = mentionRegex.exec(newNote)) !== null) {
        mentions.push({ name: match[1], id: match[2] });
      }

      let cleanedNote = newNote.replace(mentionRegex, "@$1");

      for (const mention of mentions) {
        const notificationMessage = cleanedNote.replace(
          new RegExp(`@${mention.name}`, "g"),
          `<strong>@${mention.name}</strong>`
        );

        await supabase.from("notifications").insert([
          {
            mentioned_user_id: mention.id,
            creator_id: user.id,
            message: `You were mentioned in a note: "${notificationMessage}"`,
            type: "mention",
            related_id: noteId,
          },
        ]);
      }

      setNewNote("");
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
              data={[
                ...userProfiles.map((user) => ({
                  id: user.id,
                  display: user.name,
                  type: "user",
                })),
                ...horseProfiles.map((horse) => ({
                  id: horse.id,
                  display: horse.Name,
                  type: "horse",
                })),
              ]}
              markup={"@[__display__](__id__)"}
              trigger={"@"}
              renderSuggestion={(
                suggestion: SuggestionDataItem,
                highlightedDisplay
              ) => (
                <div className="flex items-center gap-2">
                  {(suggestion as { type?: string }).type === "user" ? (
                    <FaUser className="text-gray-500" />
                  ) : (
                    <LiaHorseHeadSolid className="text-gray-500" />
                  )}
                  <span>{suggestion.display}</span>
                </div>
              )}
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
