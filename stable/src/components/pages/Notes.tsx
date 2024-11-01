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
import { LiaHorseHeadSolid } from "react-icons/lia";

type UserProfile = {
  id: string;
  name: string;
};

type HorseProfile = {
  id: string;
  Name: string;
  "Barn / Trainer": string;
};

export default function Notes() {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [horseProfiles, setHorseProfiles] = useState<HorseProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState("");

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

      let allHorses: HorseProfile[] = [];
      let lastFetchedIndex = 0;
      const pageSize = 1000; // Adjust this value based on your needs

      while (true) {
        const { data: horseData, error: horseError } = await supabase
          .from("horses")
          .select('id, Name, "Barn / Trainer"')
          .range(lastFetchedIndex, lastFetchedIndex + pageSize - 1);

        if (horseError) {
          console.error("Error fetching horse profiles:", horseError);
          break;
        }

        if (horseData && horseData.length > 0) {
          allHorses = [...allHorses, ...horseData];
          lastFetchedIndex += horseData.length;

          if (horseData.length < pageSize) {
            // We've fetched all horses
            break;
          }
        } else {
          // No more horses to fetch
          break;
        }
      }

      setHorseProfiles(allHorses);
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
        .insert([
          {
            content: newNote,
            user_id: user.id,
            subject: subject,
          },
        ])
        .select();

      if (noteError) throw noteError;

      const noteId = noteData[0].id;

      const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
      let match;
      const mentions = [];
      while ((match = mentionRegex.exec(newNote)) !== null) {
        const [display, id] = match.slice(1);
        const isUser = userProfiles.some((profile) => profile.id === id);
        mentions.push({ name: display, id, type: isUser ? "user" : "horse" });
      }

      let cleanedNote = newNote.replace(mentionRegex, "@$1");

      for (const mention of mentions) {
        const notificationMessage = cleanedNote.replace(
          new RegExp(`@${mention.name}`, "g"),
          `<strong>@${mention.name}</strong>`
        );
        console.log("Adding outside of notification for user:", mention);

        if (mention.type === "user") {
          console.log("Adding notification for user:", mention);
          await supabase.from("notifications").insert([
            {
              mentioned_user_id: mention.id,
              creator_id: user.id,
              message: `You were mentioned in a note: "${notificationMessage}"`,
              type: "mention",
              related_id: noteId,
            },
          ]);
        } else {
          await supabase.from("horse_notes").insert([
            {
              note_id: noteId,
              horse_id: mention.id,
            },
          ]);
        }
      }

      setNewNote("");
      setSubject("");
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
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
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
                  display: `${horse.Name} - ${horse["Barn / Trainer"]}`,
                  type: "horse",
                })),
              ]}
              markup={"@[__display__](__id__)"}
              trigger={"@"}
              renderSuggestion={(suggestion: SuggestionDataItem) => (
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
          <Button
            onClick={handleAddNote}
            className="hover:bg-black hover:text-white"
            disabled={isLoading}
          >
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
