import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Horse } from "@/lib/horseService";
import { supabase } from "@/lib/supabaseClient";
import {
  House,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/Contexts/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Shoeing {
  id: string;
  "Date of Service": string;
  "Base Service": string;
  "Front Add-On's": string;
  "Other Custom Services": string;
  "Location of Service": string;
  "Shoe Notes": string;
}

interface XRayImagesResponse {
  "x-ray-images": string[];
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function HorseProfile() {
  const { id } = useParams<{ id: string }>();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [xRayImages, setXRayImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setHasAlert] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteSubject, setNewNoteSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchHorse() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("horses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setHorse(data);
        setHasAlert(data?.alert || false);
      } catch (err) {
        console.error("Error fetching horse:", err);
        setError("Failed to load horse profile");
      } finally {
        setLoading(false);
      }
    }

    fetchHorse();
  }, [id]);

  useEffect(() => {
    async function fetchShoeings() {
      if (!horse) return;

      try {
        // Try to fetch shoeings using horse_id first
        let { data, error } = await supabase
          .from("shoeings")
          .select("*")
          .eq("horse_id", horse.id);

        // If no results or error, try the old method with string concatenation
        if (
          (error || !data || data.length === 0) &&
          horse.Name &&
          horse["Barn / Trainer"]
        ) {
          const horseIdentifier = `${horse.Name} - [${horse["Barn / Trainer"]}]`;
          const oldMethodResult = await supabase
            .from("shoeings")
            .select("*")
            .eq("Horses", horseIdentifier);

          if (
            !oldMethodResult.error &&
            oldMethodResult.data &&
            oldMethodResult.data.length > 0
          ) {
            console.log("Using legacy identifier method for shoeings");
            data = oldMethodResult.data;
            error = null;

            // Update these records with the correct horse_id for future use
            for (const shoeing of data) {
              await supabase
                .from("shoeings")
                .update({ horse_id: horse.id })
                .eq("id", shoeing.id)
                .then((res) => {
                  if (res.error) {
                    console.error(
                      `Failed to update shoeing ${shoeing.id} with horse_id`,
                      res.error
                    );
                  }
                });
            }
          }
        }

        if (error) throw error;

        // Parse and sort the shoeings by date
        const sortedShoeings = (data || [])
          .filter((shoeing) => shoeing["Date of Service"]) // Filter out entries with no date
          .sort((a, b) => {
            try {
              // Convert MM/DD/YYYY to Date objects
              const dateA = new Date(
                a["Date of Service"]
                  .split("/")
                  .map((num: string) => num.padStart(2, "0"))
                  .join("/")
              );
              const dateB = new Date(
                b["Date of Service"]
                  .split("/")
                  .map((num: string) => num.padStart(2, "0"))
                  .join("/")
              );
              return dateB.getTime() - dateA.getTime(); // Sort descending (most recent first)
            } catch (err) {
              console.warn("Invalid date format:", { a, b });
              return 0; // Keep original order if dates are invalid
            }
          });

        setShoeings(sortedShoeings);
      } catch (err) {
        console.error("Error fetching shoeings:", err);
        setError("Failed to load shoeing history");
      }
    }

    async function fetchXRayImages() {
      if (!horse) return;

      try {
        const { data, error } = await supabase
          .from("horses")
          .select("x-ray-images")
          .eq("id", horse.id)
          .single<XRayImagesResponse>();

        if (error) throw error;

        if (data && Array.isArray(data["x-ray-images"])) {
          setXRayImages(data["x-ray-images"]);
        } else {
          setXRayImages([]);
        }
      } catch (error) {
        console.error("Error fetching X-ray images:", error);
        setXRayImages([]);
      }
    }

    async function fetchNotes() {
      if (!horse) return;

      try {
        const { data, error } = await supabase
          .from("horse_notes")
          .select("notes(id, content, created_at)")
          .eq("horse_id", horse.id);

        if (error) throw error;

        const formattedNotes = data
          ? data.map((item: any) => item.notes).filter((note) => note !== null)
          : [];

        // Sort notes by created_at in descending order
        formattedNotes.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setNotes(formattedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        setNotes([]);
      }
    }

    fetchShoeings();
    fetchXRayImages();
    fetchNotes();
  }, [horse]);

  const handleXRayUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !horse) return;

    // Create loading toast and store its ID
    const loadingToastId = toast.loading("Uploading X-ray images...");

    try {
      const newXRayUrls: string[] = [];

      for (const file of files) {
        // Generate a unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${horse.id}-${Date.now()}.${fileExt}`;

        // Upload file to Supabase storage
        const { data: _uploadData, error: uploadError } = await supabase.storage
          .from("x-ray-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from("x-ray-images")
          .getPublicUrl(fileName);

        if (urlData) {
          newXRayUrls.push(urlData.publicUrl);
        }
      }

      // Update the horse record with new x-ray images
      const { error: updateError } = await supabase
        .from("horses")
        .update({
          "x-ray-images": [...xRayImages, ...newXRayUrls],
        })
        .eq("id", horse.id);

      if (updateError) throw updateError;

      // Update local state
      setXRayImages((prev) => [...prev, ...newXRayUrls]);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success("X-ray images uploaded successfully");
    } catch (error) {
      console.error("Error uploading x-ray images:", error);
      // Dismiss loading toast and show error
      toast.dismiss(loadingToastId);
      toast.error("Failed to upload x-ray images");
    } finally {
      // Clear the input
      event.target.value = "";
    }
  };

  const handleAddNote = async () => {
    if (!user || !horse) return;

    setIsSubmitting(true);
    try {
      // Create the note
      const { data: noteData, error: noteError } = await supabase
        .from("notes")
        .insert([
          {
            content: newNoteContent,
            user_id: user.id,
            subject: newNoteSubject,
          },
        ])
        .select()
        .single();

      if (noteError) throw noteError;

      // Create the horse_notes relation
      const { error: horseNoteError } = await supabase
        .from("horse_notes")
        .insert({
          note_id: noteData.id,
          horse_id: horse.id,
        });

      if (horseNoteError) throw horseNoteError;

      // Update local state
      setNotes((prevNotes) => [noteData, ...prevNotes]);

      // Reset form
      setNewNoteContent("");
      setNewNoteSubject("");
      setIsAddNoteDialogOpen(false);
      toast.success("Note added successfully!");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;
  if (error) return <div className="container mx-auto p-4">{error}</div>;
  if (!horse)
    return <div className="container mx-auto p-4">Horse not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full rounded-lg shadow-md border border-gray-200">
        <CardHeader className="bg-primary p-6 rounded-t-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <h2 className="text-2xl font-bold text-white">{horse.Name}</h2>
              <div className="flex items-center text-white">
                <House className="w-4 h-4 mr-2" />
                <p>{horse["Barn / Trainer"]}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {horse.alert && (
            <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-md mb-4">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{horse.alert}</span>
            </div>
          )}
          <Tabs defaultValue="shoeing" className="w-full">
            <TabsList className="mb-4 flex justify-between bg-primary">
              <TabsTrigger
                value="shoeing"
                className="flex-1 text-center text-white data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Shoeing History
              </TabsTrigger>
              <TabsTrigger
                value="xrays"
                className="flex-1 text-center text-white data-[state=active]:bg-white data-[state=active]:text-black"
              >
                X-Rays
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="flex-1 text-center text-white data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="shoeing">
              <Accordion type="single" collapsible className="w-full">
                {shoeings.length > 0 ? (
                  shoeings.map((shoeing, index) => (
                    <AccordionItem key={shoeing.id} value={`shoeing-${index}`}>
                      <AccordionTrigger className="font-semibold">
                        {new Date(
                          shoeing["Date of Service"]
                        ).toLocaleDateString()}{" "}
                        - {shoeing["Location of Service"]}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          <strong>Base Service:</strong>{" "}
                          {shoeing["Base Service"]}
                        </p>
                        {shoeing["Front Add-On's"] && (
                          <p>
                            <strong>Front Add-On's:</strong>{" "}
                            {shoeing["Front Add-On's"]}
                          </p>
                        )}
                        {shoeing["Other Custom Services"] && (
                          <p>
                            <strong>Other Custom Services:</strong>{" "}
                            {shoeing["Other Custom Services"]}
                          </p>
                        )}
                        {shoeing["Shoe Notes"] && (
                          <p>
                            <strong>Shoe Notes:</strong> {shoeing["Shoe Notes"]}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <p>No shoeing history available.</p>
                )}
              </Accordion>
            </TabsContent>
            <TabsContent value="xrays">
              <div className="grid gap-4">
                <div className="flex justify-end mb-2">
                  <div className="relative">
                    <input
                      type="file"
                      id="x-ray-upload"
                      multiple
                      accept="image/*"
                      onChange={handleXRayUpload}
                      className="hidden"
                    />
                    <label htmlFor="x-ray-upload">
                      <Button
                        variant="outline"
                        className="cursor-pointer flex items-center gap-2"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4" />
                          Upload X-rays
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                {selectedImageIndex !== null ? (
                  <div className="flex flex-col h-full">
                    <div className="relative flex justify-center items-center border rounded-md p-2 mb-2">
                      <img
                        src={xRayImages[selectedImageIndex]}
                        alt={`X-Ray ${selectedImageIndex + 1}`}
                        className="max-w-full h-auto object-contain max-h-[400px]"
                      />
                      <button
                        className="absolute top-1/2 left-2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2"
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev !== null
                              ? (prev - 1 + xRayImages.length) %
                                xRayImages.length
                              : null
                          )
                        }
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2"
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev !== null
                              ? (prev + 1) % xRayImages.length
                              : null
                          )
                        }
                      >
                        <ChevronRight size={24} />
                      </button>
                      <button
                        className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2"
                        onClick={() => setSelectedImageIndex(null)}
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div className="h-[80px] overflow-x-auto">
                      <div className="flex space-x-2 pb-2">
                        {xRayImages.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`X-Ray ${index + 1}`}
                            className={`h-[60px] w-auto object-cover cursor-pointer border rounded-md ${
                              index === selectedImageIndex
                                ? "border-2 border-primary"
                                : "border-gray-200"
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : xRayImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {xRayImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`X-Ray ${index + 1}`}
                        className="w-full h-[100px] object-cover cursor-pointer md:h-[120px]"
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="mb-4">No X-Ray images available.</p>
                    <label htmlFor="x-ray-upload">
                      <Button
                        variant="outline"
                        className="cursor-pointer flex items-center gap-2"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4" />
                          Upload your first X-ray
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="notes">
              <div className="flex justify-end mb-2">
                <Button
                  variant="outline"
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => setIsAddNoteDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add New Note
                </Button>
              </div>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {notes.length > 0 || shoeings.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {notes.length > 0 && (
                      <AccordionItem value="general-notes">
                        <AccordionTrigger className="font-semibold">
                          General Notes
                        </AccordionTrigger>
                        <AccordionContent>
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              className="border border-gray-400 p-2 rounded-md mb-2"
                            >
                              <p className="text-sm">
                                <span className="font-semibold">
                                  {new Date(
                                    note.created_at
                                  ).toLocaleDateString()}
                                  :
                                </span>{" "}
                                <span
                                  className="text-sm"
                                  dangerouslySetInnerHTML={{
                                    __html: note.content.replace(
                                      /@\[(.*?)\](?:\((.*?)\))?/g,
                                      (_match, name) => {
                                        const cleanName = name
                                          .split(" - ")[0]
                                          .trim();
                                        return `<strong>${cleanName}</strong>`;
                                      }
                                    ),
                                  }}
                                />
                              </p>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {shoeings.length > 0 && (
                      <AccordionItem value="shoeing-notes">
                        <AccordionTrigger className="font-semibold">
                          Shoeing Notes
                        </AccordionTrigger>
                        <AccordionContent>
                          {shoeings
                            .filter((shoeing) => shoeing["Shoe Notes"])
                            .map((shoeing, index) => (
                              <div
                                key={index}
                                className="border border-gray-400 p-2 rounded-md mb-2"
                              >
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    {new Date(
                                      shoeing["Date of Service"]
                                    ).toLocaleDateString()}
                                    :
                                  </span>{" "}
                                  <span className="text-sm">
                                    {shoeing["Shoe Notes"]}
                                  </span>
                                </p>
                              </div>
                            ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                ) : (
                  <p>No notes available.</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Note for {horse?.Name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={newNoteSubject}
                onChange={(e) => setNewNoteSubject(e.target.value)}
                placeholder="Enter subject..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter your note..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
