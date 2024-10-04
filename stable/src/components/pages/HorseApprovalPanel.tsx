import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Search } from "lucide-react";

// Mock data for horse submissions
const initialHorses = [
  {
    id: 1,
    name: "Thunderbolt",
    breed: "Arabian",
    age: 5,
    submittedBy: "John Doe",
    status: "pending",
  },
  {
    id: 2,
    name: "Midnight",
    breed: "Friesian",
    age: 7,
    submittedBy: "Jane Smith",
    status: "pending",
  },
  {
    id: 3,
    name: "Starlight",
    breed: "Appaloosa",
    age: 3,
    submittedBy: "Mike Johnson",
    status: "pending",
  },
  {
    id: 4,
    name: "Shadow",
    breed: "Thoroughbred",
    age: 6,
    submittedBy: "Emily Brown",
    status: "pending",
  },
  {
    id: 5,
    name: "Blaze",
    breed: "Quarter Horse",
    age: 4,
    submittedBy: "David Wilson",
    status: "pending",
  },
];

export default function Component() {
  const [horses, setHorses] = useState(initialHorses);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAccept = (id: number) => {
    setHorses(
      horses.map((horse) =>
        horse.id === id ? { ...horse, status: "accepted" } : horse
      )
    );
  };

  const handleReject = (id: number) => {
    setHorses(
      horses.map((horse) =>
        horse.id === id ? { ...horse, status: "rejected" } : horse
      )
    );
  };

  const filteredHorses = horses.filter(
    (horse) =>
      horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horse.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horse.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Horse Submission Admin Panel</h1>
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search horses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
      <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Horse
                </TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                  Details
                </TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHorses.map((horse) => (
                <TableRow key={horse.id}>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {horse.name}
                    </div>
                    <div className="text-gray-500 sm:hidden">
                      {horse.breed}, {horse.age} years
                      <br />
                      Submitted by {horse.submittedBy}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                    <div>
                      {horse.breed}, {horse.age} years
                    </div>
                    <div>Submitted by {horse.submittedBy}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        horse.status === "accepted"
                          ? "bg-green-200 text-green-800"
                          : horse.status === "rejected"
                          ? "bg-red-200 text-red-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {horse.status.charAt(0).toUpperCase() +
                        horse.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm">
                    {horse.status === "pending" && (
                      <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-500 text-white hover:bg-green-600 w-full sm:w-auto"
                          onClick={() => handleAccept(horse.id)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-500 text-white hover:bg-red-600 w-full sm:w-auto"
                          onClick={() => handleReject(horse.id)}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
