import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { getHorses, Horse } from "@/lib/horseService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface Shoeing {
  id: string;
  "Date of Service": string;
  "Base Service": string;
  "Front Add-On's": string;
  "Other Custom Services": string;
  "Location of Service": string;
  "Total Cost": number | string | null;
  "Shoe Notes": string;
}

export default function Horses() {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [filterBarnTrainer, setFilterBarnTrainer] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    async function fetchHorses() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedHorses = await getHorses();
        console.log("Fetched horses in component:", fetchedHorses.length);
        console.log("Sample horse:", fetchedHorses[0]); // Log a sample horse
        const sortedHorses = fetchedHorses.sort((a, b) =>
          (a.Name || "").localeCompare(b.Name || "")
        );
        setHorses(sortedHorses);
        setIsLoading(false);
      } catch (err) {
        console.error("Error in fetchHorses:", err);
        setError("Failed to fetch horses. Please try again later.");
        setIsLoading(false);
      }
    }
    fetchHorses();
  }, []);

  const uniqueBarnTrainers = [
    ...new Set(horses.map((horse) => horse["Barn / Trainer"] || "Unknown")),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const filteredHorses = horses
    .filter((horse) => {
      // Filter out horses with no name and empty barn/trainer
      if (!horse.Name && !horse["Barn / Trainer"]) {
        return false;
      }

      const matchesBarnTrainer =
        !filterBarnTrainer || horse["Barn / Trainer"] === filterBarnTrainer;

      if (searchQuery) {
        const lowerSearchQuery = searchQuery.toLowerCase();

        // First, check if the horse's name matches
        if (horse.Name?.toLowerCase().includes(lowerSearchQuery)) {
          return matchesBarnTrainer;
        }

        // If no match in name, then check other fields
        return (
          matchesBarnTrainer &&
          (horse["Barn / Trainer"]?.toLowerCase().includes(lowerSearchQuery) ||
            horse.Customers?.toLowerCase().includes(lowerSearchQuery))
        );
      }

      return matchesBarnTrainer;
    })
    .sort((a, b) => {
      if (searchQuery) {
        const aNameMatch = a.Name?.toLowerCase().includes(
          searchQuery.toLowerCase()
        )
          ? 1
          : 0;
        const bNameMatch = b.Name?.toLowerCase().includes(
          searchQuery.toLowerCase()
        )
          ? 1
          : 0;
        return bNameMatch - aNameMatch;
      }
      return 0;
    });

  const clearFilters = () => {
    setFilterBarnTrainer(null);
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 align-middle mb-6">
        <LiaHorseHeadSolid className="text-4xl " />
        <h1 className="text-4xl font-bold  text-black">Horses</h1>
      </div>

      {/* Filters, search, and view controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-grow flex flex-col md:flex-row gap-2 md:gap-4">
          <Select
            value={filterBarnTrainer || ""}
            onValueChange={(value) => setFilterBarnTrainer(value || null)}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Barn/Trainer" />
            </SelectTrigger>
            <SelectContent>
              {uniqueBarnTrainers.map((barnTrainer) => (
                <SelectItem key={barnTrainer} value={barnTrainer}>
                  {barnTrainer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search horses..."
              className="pl-8 pr-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isDesktop && (
            <Button
              onClick={() =>
                setViewMode(viewMode === "card" ? "table" : "card")
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {viewMode === "card" ? "Table View" : "Card View"}
            </Button>
          )}
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <HorsesSkeleton viewMode={isDesktop ? viewMode : "card"} />
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : filteredHorses.length === 0 ? (
        <div className="text-center">No horses found.</div>
      ) : !isDesktop || viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {filteredHorses.map((horse) => (
            <HorseCard
              key={horse.id}
              horse={horse}
              onSelect={() => {
                setSelectedHorse(horse);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <HorseTable
            horses={filteredHorses}
            onSelect={(horse) => {
              setSelectedHorse(horse);
              setIsModalOpen(true);
            }}
          />
        </div>
      )}

      {selectedHorse && (
        <HorseDetailsModal
          horse={selectedHorse}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function HorsesSkeleton({ viewMode }: { viewMode: "card" | "table" }) {
  return viewMode === "card" ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="border-primary/20 shadow-lg animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow className="bg-primary text-primary-foreground">
          <TableHead className="">Name</TableHead>
          <TableHead className="">Barn / Trainer</TableHead>
          <TableHead className="">Customers</TableHead>
          <TableHead className="">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </TableCell>
            <TableCell>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HorseCard({
  horse,
  onSelect,
}: {
  horse: Horse;
  onSelect: () => void;
}) {
  const customerNames = horse.Customers
    ? horse.Customers.split(",")
        .map((name) => name.trim())
        .map((name) => name.replace(/^"|"$/g, "").trim())
        .filter((name) => name.length > 0) // Filter out empty names
    : [];

  return (
    <Card className="border-primary/20 shadow-lg flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-black text-3xl">
          {horse.Name || horse["Barn / Trainer"] || "Unnamed Horse"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow pt-0">
        <div className="space-y-2 mb-4 flex-grow">
          {horse["Barn / Trainer"] && (
            <p className="text-sm">
              <strong className="font-semibold">Barn / Trainer:</strong>{" "}
              {horse["Barn / Trainer"]}
            </p>
          )}
          {customerNames.length > 0 && (
            <div className="text-sm">
              <strong className="font-semibold">Customers:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {customerNames.map((name, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={onSelect}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

function HorseTable({
  horses,
  onSelect,
}: {
  horses: Horse[];
  onSelect: (horse: Horse) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground">
            <TableHead className="hover:text-primary-foreground">
              Name
            </TableHead>
            <TableHead className="hover:text-primary-foreground">
              Barn / Trainer
            </TableHead>
            <TableHead className="hover:text-primary-foreground">
              Customers
            </TableHead>
            <TableHead className="hover:text-primary-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {horses.map((horse) => (
            <TableRow key={horse.id}>
              <TableCell className="font-medium">{horse.Name}</TableCell>
              <TableCell>{horse["Barn / Trainer"]}</TableCell>
              <TableCell>{horse.Customers}</TableCell>
              <TableCell>
                <Button
                  onClick={() => onSelect(horse)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function HorseDetailsModal({
  horse,
  isOpen,
  onClose,
}: {
  horse: Horse;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [xRayImages, setXRayImages] = useState<string[]>([]);
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && horse) {
      setXRayImages(
        horse["X-Ray Images (from History)"]?.split(",").filter(Boolean) || []
      );
      setNotes(
        horse["Note w/ Time Stamps (from History)"]
          ?.split(",")
          .filter(Boolean) || []
      );
      fetchShoeings();
    }
  }, [isOpen, horse]);

  async function fetchShoeings() {
    const horseIdentifier = `${horse.Name} - [${horse["Barn / Trainer"]}]`;
    const { data, error } = await supabase
      .from("shoeings")
      .select("*")
      .eq("Horses", horseIdentifier) // Note the capital 'H' in 'Horses'
      .order("Date of Service", { ascending: false });

    if (error) {
      console.error("Error fetching shoeings:", error);
    } else {
      setShoeings(data || []);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{horse.Name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="xrays" className="w-full">
          <TabsList>
            <TabsTrigger value="xrays">X-Rays</TabsTrigger>
            <TabsTrigger value="history">Shoeing History</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="xrays">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {xRayImages.length > 0 ? (
                xRayImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`X-Ray ${index + 1}`}
                    className="mb-4"
                  />
                ))
              ) : (
                <p>No X-Ray images available.</p>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="history">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {shoeings.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {shoeings.map((shoeing, index) => (
                    <AccordionItem key={shoeing.id} value={`item-${index}`}>
                      <AccordionTrigger>
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
                        <p>
                          <strong>Total Cost: </strong>
                          {typeof shoeing["Total Cost"] === "number"
                            ? `$${shoeing["Total Cost"].toFixed(2)}`
                            : shoeing["Total Cost"] || "N/A"}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p>No shoeing history available.</p>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="notes">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {notes.length > 0 ? (
                notes.map((note, index) => (
                  <p key={index} className="mb-2">
                    {note}
                  </p>
                ))
              ) : (
                <p>No notes available.</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
