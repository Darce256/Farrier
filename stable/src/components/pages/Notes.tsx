import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRegStickyNote } from "react-icons/fa";
import { MentionsInput, Mention, OnChangeHandlerFunc } from "react-mentions";
import { createClient } from "@supabase/supabase-js";
import MentionInputStyles from "../../MentionInputStyles.ts";
import MentionStyles from "../../MentionStyles.ts";

import { supabase } from "@/lib/supabaseClient";

type Note = {
  id: number;
  content: string;
  createdAt: Date;
};

type UserProfile = {
  id: string;
  name: string;
};

export default function Notes() {
  const [newNote, setNewNote] = useState("");

  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name");
      if (data) {
        setUserProfiles(data);
      }
    };
    fetchUserProfiles();
  }, []);

  const handleAddNote = () => {
    console.log(newNote);
  };

  const handleTextareaChange: OnChangeHandlerFunc = (
    event: any,
    newValue: string,
    newPlainTextValue: string,
    mentions: any
  ) => {
    setNewNote(event.target.value);
  };
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    setIsSelected(!isSelected);
  };
  const renderSuggestion = (suggestion: any) => {
    console.log(suggestion);
    return (
      <div className=" text-white font-semibold"> {suggestion.display}</div>
    );
  };
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 align-middle mb-6">
        <FaRegStickyNote className="text-4xl " />
        <h1 className="text-4xl font-bold  text-black">Notes</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 sm:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Add New Note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative">
                <MentionsInput
                  style={MentionInputStyles}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
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
                <Button onClick={handleAddNote}>Add Note</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
