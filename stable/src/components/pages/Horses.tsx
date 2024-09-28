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
  DialogTrigger,
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
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { getHorses, Horse } from "@/lib/horseService";
import { Spinner } from "@/components/ui/spinner";

export default function Horses() {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [filterBarnTrainer, setFilterBarnTrainer] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHorses() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedHorses = await getHorses();
        const sortedHorses = fetchedHorses.sort((a, b) =>
          (a.Name || "").localeCompare(b.Name || "")
        );
        setHorses(sortedHorses);
        setIsLoading(false);
      } catch (err) {
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

  const filteredHorses = horses.filter(
    (horse) =>
      (!filterBarnTrainer || horse["Barn / Trainer"] === filterBarnTrainer) &&
      (horse.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        horse["Barn / Trainer"]
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        horse.Customers?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Select
          value={filterBarnTrainer || ""}
          onValueChange={(value) => setFilterBarnTrainer(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
            className="pl-8 pr-8"
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
        <Button
          onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {viewMode === "card" ? "Table View" : "Card View"}
        </Button>
        <Button onClick={clearFilters} variant="outline">
          Clear Filters
        </Button>
      </div>

      {isLoading ? (
        <HorsesSkeleton viewMode={viewMode} />
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : isFiltering ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : filteredHorses.length === 0 ? (
        <div className="text-center">No horses found.</div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHorses.map((horse) => (
            <HorseCard
              key={horse.id}
              horse={horse}
              onSelect={() => setSelectedHorse(horse)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <HorseTable horses={filteredHorses} onSelect={setSelectedHorse} />
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <div style={{ display: "none" }}></div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedHorse?.Name}</DialogTitle>
          </DialogHeader>
          {selectedHorse && <HorseDetails horse={selectedHorse} />}
        </DialogContent>
      </Dialog>
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
          <TableHead>Name</TableHead>
          <TableHead>Barn / Trainer</TableHead>
          <TableHead>Customers</TableHead>
          <TableHead>X-rays</TableHead>
          <TableHead>Actions</TableHead>
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
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-black text-3xl">{horse.Name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Barn / Trainer: {horse["Barn / Trainer"]}</p>
        <p>Customers: {horse.Customers}</p>
        <p>
          X-rays: {horse["X-Ray Images (from History)"]?.split(",").length || 0}
        </p>
        <Button
          onClick={onSelect}
          className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
    <Table>
      <TableHeader>
        <TableRow className="bg-primary text-primary-foreground">
          <TableHead>Name</TableHead>
          <TableHead>Barn / Trainer</TableHead>
          <TableHead>Customers</TableHead>
          <TableHead>X-rays</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {horses.map((horse) => (
          <TableRow key={horse.id}>
            <TableCell>{horse.Name}</TableCell>
            <TableCell>{horse["Barn / Trainer"]}</TableCell>
            <TableCell>{horse.Customers}</TableCell>
            <TableCell>
              {horse["X-Ray Images (from History)"]?.split(",").length || 0}
            </TableCell>
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
  );
}

function HorseDetails({ horse }: { horse: Horse }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-4">
      <p>
        <strong className="text-primary">Barn / Trainer:</strong>{" "}
        {horse["Barn / Trainer"]}
      </p>
      <p>
        <strong className="text-primary">Customers:</strong> {horse.Customers}
      </p>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-primary">
          X-ray Images
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {horse["X-Ray Images (from History)"]
            ?.split(",")
            .map((xray, index) => (
              <img
                key={index}
                src={xray.trim()}
                alt={`X-ray ${index + 1}`}
                className="rounded-md w-full"
              />
            ))}
        </div>
      </div>
      <div>
        <Button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {showHistory ? (
            <ChevronUp className="mr-2" />
          ) : (
            <ChevronDown className="mr-2" />
          )}
          Horse History
        </Button>
        {showHistory && (
          <ScrollArea className="h-[200px] mt-2">
            {horse["Note w/ Time Stamps (from History)"]
              ?.split("\n")
              .map((event, index) => (
                <div key={index} className="mb-2">
                  <p>{event}</p>
                </div>
              ))}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
