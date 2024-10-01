import { useRef } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRegStickyNote } from "react-icons/fa";
import { MentionInput } from "@/components/MentionInput";

type Note = {
  id: number;
  content: string;
  category: "Invoicing/Billing" | "Team";
  tags: string[];
  createdAt: Date;
};

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [category, setCategory] = useState<"Invoicing/Billing" | "Team">(
    "Team"
  );
  const [tags, setTags] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const newNoteObj: Note = {
        id: Date.now(),
        content: newNote,
        category,
        tags,
        createdAt: new Date(),
      };
      setNotes((prevNotes) => [newNoteObj, ...prevNotes]);
      setNewNote("");
      setTags([]);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl" ref={containerRef}>
      <div className="flex items-center gap-2 align-middle mb-6">
        <FaRegStickyNote className="text-4xl " />
        <h1 className="text-4xl font-bold  text-black">Notes</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MentionInput
              value={newNote}
              onChange={(value) => setNewNote(value)}
              containerRef={containerRef}
            />
            <Button onClick={handleAddNote}>Add Note</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
