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
import { House, AlertCircle, ChevronLeft, ChevronRight, X } from "lucide-react";

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
  const [hasAlert, setHasAlert] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

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
        const horseIdentifier = `${horse.Name} - [${horse["Barn / Trainer"]}]`;
        const { data, error } = await supabase
          .from("shoeings")
          .select("*")
          .eq("Horses", horseIdentifier)
          .order("Date of Service", { ascending: false });

        if (error) throw error;
        setShoeings(data || []);
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

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;
  if (error) return <div className="container mx-auto p-4">{error}</div>;
  if (!horse)
    return <div className="container mx-auto p-4">Horse not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full rounded-lg shadow-md border border-gray-200">
        <CardHeader className="bg-primary p-6 rounded-t-lg">
          <div className="flex items-center gap-4">
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
          {hasAlert && (
            <div className="flex items-center text-red-500 mb-4">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>Alert: Critical Information</span>
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
                {selectedImageIndex !== null ? (
                  <div className="flex flex-col h-full">
                    <div className="relative flex-grow flex justify-center items-center border rounded-md p-2 mb-2">
                      <img
                        src={xRayImages[selectedImageIndex]}
                        alt={`X-Ray ${selectedImageIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
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
                    <div className="h-[100px] overflow-x-auto">
                      <div className="flex space-x-2 pb-2">
                        {xRayImages.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`X-Ray ${index + 1}`}
                            className={`h-[120px] w-auto object-cover cursor-pointer border rounded-md ${
                              index === selectedImageIndex
                                ? "border-2 border-primary"
                                : "border-gray-200"
                            } md:h-[150px]`} // Adjust height for desktop
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
                        className="w-full h-[120px] object-cover cursor-pointer md:h-[150px]" // Adjust height for desktop
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                ) : (
                  <p>No X-Ray images available.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="notes">
              <Accordion type="single" collapsible className="w-full">
                {notes.length > 0 ? (
                  notes.map((note, index) => (
                    <AccordionItem key={note.id} value={`note-${index}`}>
                      <AccordionTrigger className="font-semibold">
                        {new Date(note.created_at).toLocaleDateString()}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p
                          dangerouslySetInnerHTML={{
                            __html: note.content.replace(
                              /@\[(.*?)\](?:\((.*?)\))?/g,
                              (match, name) => {
                                const cleanName = name.split(" - ")[0].trim();
                                return cleanName === horse.Name.trim()
                                  ? `<strong>${cleanName}</strong>`
                                  : cleanName;
                              }
                            ),
                          }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <p>No notes available.</p>
                )}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
