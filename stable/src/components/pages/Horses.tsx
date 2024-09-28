import { useState, useMemo } from "react";
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
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { FaHorseHead } from "react-icons/fa6";

// Mock data for horses
const horses = [
  {
    id: 1,
    name: "Thunder",
    barn: "Sunset Stables",
    trainer: "John Doe",
    xrays: [
      "/placeholder.svg?height=200&width=200",
      "/placeholder.svg?height=200&width=200",
    ],
    history: [
      { date: "2023-05-15", event: "Routine checkup" },
      { date: "2023-03-10", event: "Won local competition" },
    ],
  },
  {
    id: 2,
    name: "Misty",
    barn: "Green Meadows",
    trainer: "Jane Smith",
    xrays: ["/placeholder.svg?height=200&width=200"],
    history: [
      { date: "2023-06-01", event: "Dental procedure" },
      { date: "2023-04-20", event: "Started new training program" },
    ],
  },
  {
    id: 3,
    name: "Blaze",
    barn: "Sunset Stables",
    trainer: "John Doe",
    xrays: [
      "/placeholder.svg?height=200&width=200",
      "/placeholder.svg?height=200&width=200",
      "/placeholder.svg?height=200&width=200",
    ],
    history: [
      { date: "2023-05-30", event: "Participated in regional show" },
      { date: "2023-04-15", event: "Annual vaccination" },
    ],
  },
  {
    id: 4,
    name: "Shadow",
    barn: "Mountain View Ranch",
    trainer: "Emily Brown",
    xrays: [],
    history: [
      { date: "2023-06-10", event: "New arrival at the ranch" },
      { date: "2023-06-15", event: "Initial health assessment" },
    ],
  },
];
export default function Horses() {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedHorse, setSelectedHorse] = useState<(typeof horses)[0] | null>(
    null
  );
  const [filterTrainer, setFilterTrainer] = useState<string | null>(null);
  const [filterBarn, setFilterBarn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueTrainers = useMemo(
    () => [...new Set(horses.map((horse) => horse.trainer))],
    []
  );
  const uniqueBarns = useMemo(
    () => [...new Set(horses.map((horse) => horse.barn))],
    []
  );

  const filteredHorses = useMemo(() => {
    return horses.filter(
      (horse) =>
        (!filterTrainer || horse.trainer === filterTrainer) &&
        (!filterBarn || horse.barn === filterBarn) &&
        (horse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          horse.trainer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          horse.barn.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [filterTrainer, filterBarn, searchQuery]);
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 align-middle mb-6">
        <FaHorseHead className="text-4xl " />
        <h1 className="text-4xl font-bold  text-black">Horses</h1>
      </div>
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-grow">
            <Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search horses..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            onValueChange={(value) =>
              setFilterTrainer(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Trainer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trainers</SelectItem>
              {uniqueTrainers.map((trainer) => (
                <SelectItem key={trainer} value={trainer}>
                  {trainer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              setFilterBarn(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Barn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Barns</SelectItem>
              {uniqueBarns.map((barn) => (
                <SelectItem key={barn} value={barn}>
                  {barn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {viewMode === "card" ? "Table View" : "Card View"}
          </Button>
        </div>
      </div>
      {viewMode === "card" ? (
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
      {selectedHorse && (
        <Dialog
          open={!!selectedHorse}
          onOpenChange={() => setSelectedHorse(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-primary text-2xl">
                {selectedHorse.name}
              </DialogTitle>
            </DialogHeader>
            <HorseDetails horse={selectedHorse} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function HorseCard({
  horse,
  onSelect,
}: {
  horse: (typeof horses)[0];
  onSelect: () => void;
}) {
  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-black text-2xl">{horse.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Barn: {horse.barn}</p>
        <p>Trainer: {horse.trainer}</p>
        <p>X-rays: {horse.xrays.length}</p>
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
  horses: any,
  onSelect,
}: {
  horses: typeof horses;
  onSelect: (horse: (typeof horses)[0]) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-primary text-primary-foreground">
          <TableHead>Name</TableHead>
          <TableHead>Barn</TableHead>
          <TableHead>Trainer</TableHead>
          <TableHead>X-rays</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {horses.map((horse: any) => (
          <TableRow key={horse.id}>
            <TableCell>{horse.name}</TableCell>
            <TableCell>{horse.barn}</TableCell>
            <TableCell>{horse.trainer}</TableCell>
            <TableCell>{horse.xrays.length}</TableCell>
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

function HorseDetails({ horse }: { horse: (typeof horses)[0] }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-4">
      <p>
        <strong className="text-primary">Barn:</strong> {horse.barn}
      </p>
      <p>
        <strong className="text-primary">Trainer:</strong> {horse.trainer}
      </p>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-primary">
          X-ray Images
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {horse.xrays.map((xray, index) => (
            <img
              key={index}
              src={xray}
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
            {horse.history.map((event, index) => (
              <div key={index} className="mb-2">
                <p className="font-semibold text-primary">{event.date}</p>
                <p>{event.event}</p>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
