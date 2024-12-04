import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TbHorseshoe } from "react-icons/tb";
import { useState, useEffect, useMemo, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import { supabase } from "../../lib/supabaseClient";
import { PlusCircle, Search, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // Shadcn UI Dialog components
import toast from "react-hot-toast";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuth } from "@/components/Contexts/AuthProvider"; // Adjust the import path as necessary
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IoFlagSharp } from "react-icons/io5";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/useMediaQuery"; // You'll need to create this hook
import { House } from "lucide-react";
import { Loader2 } from "lucide-react"; // Make sure this is imported

const formSchema = z.object({
  horseName: z.string().min(1, "Please select a horse."),
  dateOfService: z.date({
    required_error: "A date of service is required.",
  }),
  locationOfService: z.string().min(1, "Please select a location."),
  baseService: z.string().min(1, "Please select a base service."),
  frontAddOns: z.array(z.string()).optional(),
  hindAddOns: z.array(z.string()).optional(),
  customServices: z.string().optional(),
  shoeingNotes: z.string().optional(),
});

type Horse = {
  id: string;
  name: string | null; // Allow name to be null for filtering
  barn: string | null; // Allow barn to be null for conditional display
  alert?: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  customerName: string | null;
};

// Update the schema to include customerName and phone number validation
const newHorseSchema = z.object({
  horseName: z.string().nonempty("Horse name is required"),
  barnName: z.string().nonempty("Barn name is required"),
  ownerEmail: z.string().email("Invalid email address").optional(),
  ownerPhone: z
    .string()
    .regex(/^\d*$/, "Phone number must contain only digits")
    .optional(),
});

type NewHorseFormValues = z.infer<typeof newHorseSchema>;

// Add interface for Shoeing type
interface Shoeing {
  id: string;
  "Date of Service": string;
  "Horse Name": string;
  "Base Service": string;
  "Front Add-On's"?: string;
  "Hind Add-On's"?: string;
  "Other Custom Services"?: string;
  "Location of Service": string;
  "Shoe Notes"?: string;
  Horses: string;
  status: string;
}

// New component for submitted shoeings
function SubmittedShoeings({ onEdit }: { onEdit: (shoeing: any) => void }) {
  const [shoeings, setShoeings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shoeingToDelete, setShoeingToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubmittedShoeings();
    }
  }, [user]);

  async function fetchSubmittedShoeings() {
    const { data, error } = await supabase
      .from("shoeings")
      .select("*")
      .eq("status", "pending")
      .order("Date of Service", { ascending: false });

    if (error) {
      console.error("Error fetching shoeings:", error);
      toast.error("Failed to fetch submitted shoeings");
    } else {
      console.log("Fetched shoeings:", data);
      setShoeings(data as any);
    }
  }

  const openDeleteConfirm = (id: string) => {
    setShoeingToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (shoeingToDelete) {
      try {
        const { error } = await supabase
          .from("shoeings")
          .delete()
          .eq("id", shoeingToDelete)
          .eq("status", "pending");

        if (error) throw error;

        toast.success("Shoeing record deleted successfully");
        fetchSubmittedShoeings(); // Refresh the list
      } catch (error) {
        console.error("Error deleting shoeing record:", error);
        toast.error("Failed to delete shoeing record");
      }
    }
    setDeleteConfirmOpen(false);
    setShoeingToDelete(null);
  };

  const filteredShoeings = shoeings.filter((shoeing: any) => {
    const horseName = shoeing["Horse Name"]?.toLowerCase() || "";
    const baseService = shoeing["Base Service"]?.toLowerCase() || "";
    const location = shoeing["Location of Service"]?.toLowerCase() || "";
    const searchTermLower = searchTerm.toLowerCase();

    return (
      horseName.includes(searchTermLower) ||
      baseService.includes(searchTermLower) ||
      location.includes(searchTermLower)
    );
  });

  const renderServices = (shoeing: any) => {
    return (
      <div className="space-y-1">
        <div className="text-sm">
          <span className="font-semibold">Base Service: </span>
          {shoeing["Base Service"]}
        </div>
        {shoeing["Front Add-On's"] && (
          <div className="text-sm">
            <span className="font-semibold">Front Add-ons: </span>
            {shoeing["Front Add-On's"]}
          </div>
        )}
        {shoeing["Hind Add-On's"] && (
          <div className="text-sm">
            <span className="font-semibold">Hind Add-ons: </span>
            {shoeing["Hind Add-On's"]}
          </div>
        )}
        {shoeing["Other Custom Services"] && (
          <div className="text-sm">
            <span className="font-semibold">Custom Services: </span>
            {shoeing["Other Custom Services"]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4 px-4 sm:px-0 relative">
        <Input
          type="text"
          placeholder="Search shoeings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full bg-white"
        />
        <Search
          className="absolute left-7 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
        />
      </div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Details
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Notes
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredShoeings.length > 0 ? (
              filteredShoeings.map((shoeing: any) => (
                <tr key={shoeing.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {new Date(shoeing["Date of Service"]).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-4 text-sm text-black">
                    <div className="font-bold">{shoeing["Horse Name"]}</div>
                    <div className="flex items-center mt-2 font-medium text-gray-500">
                      <House className="h-4 w-4 mr-1" />
                      {shoeing.Horses.split(" - ")[1]
                        ?.replace(/[\[\]]/g, "")
                        .trim() || "No Barn/Trainer"}
                    </div>
                    {renderServices(shoeing)}
                    <div className="mt-1">
                      <Badge
                        variant="default"
                        className="text-xs hover:bg-black hover:text-white"
                      >
                        {shoeing["Location of Service"]}
                      </Badge>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        shoeing.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : shoeing.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {shoeing.status.charAt(0).toUpperCase() +
                        shoeing.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-black">
                    {shoeing["Shoe Notes"]}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                      <Button
                        onClick={() => onEdit(shoeing)}
                        className="w-full sm:w-auto"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {shoeing.status === "pending" && (
                        <Button
                          variant="destructive"
                          onClick={() => openDeleteConfirm(shoeing.id)}
                          className="w-full sm:w-auto"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-sm text-gray-500 text-center"
                >
                  No shoeings available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mb-4 sm:hidden">
        {filteredShoeings.length > 0 ? (
          filteredShoeings.map((shoeing: any) => (
            <Card key={shoeing.id} className="mx-4 mb-4">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-lg font-bold text-black mb-1">
                      {shoeing["Horse Name"]}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-black">
                        {new Date(
                          shoeing["Date of Service"]
                        ).toLocaleDateString()}
                      </p>
                      <Badge
                        variant="default"
                        className="text-xs hover:bg-black hover:text-white"
                      >
                        {shoeing["Location of Service"]}
                      </Badge>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <House className="h-4 w-4 mr-1" />
                      {shoeing.Horses.split(" - ")[1]
                        ?.replace(/[\[\]]/g, "")
                        .trim() || "No Barn/Trainer"}
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      shoeing.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : shoeing.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {shoeing.status.charAt(0).toUpperCase() +
                      shoeing.status.slice(1)}
                  </span>
                </div>
                {renderServices(shoeing)}

                {shoeing["Shoe Notes"] && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Shoeing Notes:</p>
                    <p className="text-sm text-black">
                      {shoeing["Shoe Notes"]}
                    </p>
                  </div>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    onClick={() => onEdit(shoeing)}
                    className="w-1/2"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {shoeing.status === "pending" && (
                    <Button
                      variant="destructive"
                      onClick={() => openDeleteConfirm(shoeing.id)}
                      className="w-1/2"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="mx-4">
            <CardContent className="pt-4">
              <p className="text-center text-gray-500">No shoeings available</p>
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] mx-auto rounded-lg sm:rounded-lg p-4 sm:p-6 w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this shoeing record?</p>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add this new component after the SubmittedShoeings component

function SentLastThirtyDays() {
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentShoeings();
  }, []);

  async function fetchSentShoeings() {
    setIsLoading(true);

    try {
      // Fetch all completed shoeings with pagination
      let allShoeings: Shoeing[] = [];
      let from = 0;
      const chunkSize = 1000;
      let to = chunkSize - 1;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await supabase
          .from("shoeings")
          .select("*")
          .eq("status", "completed")
          .range(from, to);

        if (error) throw error;

        if (data) {
          allShoeings = [...allShoeings, ...data];
        }

        // If we got less than the chunk size, we've reached the end
        if (!data || data.length < chunkSize) {
          fetchMore = false;
        } else {
          from += chunkSize;
          to += chunkSize;
        }
      }

      console.log("Total completed shoeings:", allShoeings.length);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      console.log("Date range:", {
        from: thirtyDaysAgo.toLocaleDateString(),
        to: now.toLocaleDateString(),
      });

      const filteredAndSortedData = allShoeings
        .filter((shoeing: Shoeing) => {
          if (!shoeing["Date of Service"]) {
            console.log("Skipping record - no date:", shoeing);
            return false;
          }

          try {
            const [month, day, year] = shoeing["Date of Service"].split("/");
            const shoeingDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );

            if (isNaN(shoeingDate.getTime())) {
              console.log(
                "Skipping record - invalid date:",
                shoeing["Date of Service"]
              );
              return false;
            }

            const isWithinRange =
              shoeingDate >= thirtyDaysAgo && shoeingDate <= now;

            console.log("Date check:", {
              original: shoeing["Date of Service"],
              parsed: shoeingDate.toLocaleDateString(),
              isWithinRange,
              thirtyDaysAgo: thirtyDaysAgo.toLocaleDateString(),
              now: now.toLocaleDateString(),
            });

            return isWithinRange;
          } catch (err) {
            console.warn("Invalid date format:", shoeing["Date of Service"]);
            return false;
          }
        })
        .sort((a: Shoeing, b: Shoeing) => {
          try {
            const [monthA, dayA, yearA] = a["Date of Service"].split("/");
            const [monthB, dayB, yearB] = b["Date of Service"].split("/");

            const dateA = new Date(
              parseInt(yearA),
              parseInt(monthA) - 1,
              parseInt(dayA)
            );
            const dateB = new Date(
              parseInt(yearB),
              parseInt(monthB) - 1,
              parseInt(dayB)
            );

            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;

            return dateB.getTime() - dateA.getTime();
          } catch (err) {
            console.warn("Error comparing dates:", { a, b });
            return 0;
          }
        });

      console.log("Filtered results:", filteredAndSortedData.length);
      console.log(
        "Sample of filtered data:",
        filteredAndSortedData.slice(0, 3)
      );

      setShoeings(filteredAndSortedData);
    } catch (err) {
      console.error("Error fetching sent shoeings:", err);
      toast.error("Failed to fetch sent shoeings");
    } finally {
      setIsLoading(false);
    }
  }

  const renderServices = (shoeing: any) => {
    return (
      <div className="space-y-1">
        <div className="text-sm">
          <span className="font-semibold">Base Service: </span>
          {shoeing["Base Service"]}
        </div>
        {shoeing["Front Add-On's"] && (
          <div className="text-sm">
            <span className="font-semibold">Front Add-ons: </span>
            {shoeing["Front Add-On's"]}
          </div>
        )}
        {shoeing["Hind Add-On's"] && (
          <div className="text-sm">
            <span className="font-semibold">Hind Add-ons: </span>
            {shoeing["Hind Add-On's"]}
          </div>
        )}
        {shoeing["Other Custom Services"] && (
          <div className="text-sm">
            <span className="font-semibold">Custom Services: </span>
            {shoeing["Other Custom Services"]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <p>Loading...</p>
      ) : shoeings.length > 0 ? (
        <div className="space-y-4">
          {shoeings.map((shoeing: any) => (
            <Card key={shoeing.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-lg font-bold text-black mb-1">
                      {shoeing["Horse Name"]}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-black">
                        {new Date(
                          shoeing["Date of Service"]
                        ).toLocaleDateString()}
                      </p>
                      <Badge
                        variant="default"
                        className="text-xs hover:bg-black hover:text-white"
                      >
                        {shoeing["Location of Service"]}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
                {renderServices(shoeing)}

                {shoeing["Shoe Notes"] && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Shoeing Notes:</p>
                    <p className="text-sm">{shoeing["Shoe Notes"]}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No completed shoeings in the last 30 days.</p>
      )}
    </div>
  );
}

export default function ShoeingForm() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [baseServices, setBaseServices] = useState<string[]>([]);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingBarns, setExistingBarns] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef<HTMLButtonElement>(null);

  const [activeTab, setActiveTab] = useState("new-shoeing");
  const [editingShoeing, setEditingShoeing] = useState<any>(null);
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      horseName: "",
      dateOfService: undefined,
      locationOfService: "",
      baseService: "",
      frontAddOns: [],
      hindAddOns: [],
      customServices: "",
      shoeingNotes: "",
    },
    mode: "onSubmit",
  });

  // Separate the new horse form state from the main form
  const newHorseForm = useForm<NewHorseFormValues>({
    resolver: zodResolver(newHorseSchema),
    mode: "onSubmit", // This ensures validation only happens on form submission
  });

  const [submittedShoeingsKey, setSubmittedShoeingsKey] = useState(0);

  const parseAddOns = useMemo(() => {
    return (
      addOnsString: string | string[] | null,
      validAddOns: string[]
    ): string[] => {
      if (!addOnsString) return [];

      let addOnsArray = Array.isArray(addOnsString)
        ? addOnsString
        : [addOnsString];

      return addOnsArray.flatMap((item) => {
        const foundAddOns = validAddOns.filter((addOn) => item.includes(addOn));
        return foundAddOns.length > 0 ? foundAddOns : item.trim();
      });
    };
  }, []); // Empty dependency array as this function doesn't depend on any props or state

  useEffect(() => {
    async function fetchData() {
      await Promise.all([
        fetchHorses(),
        fetchLocations(),
        fetchServicesAndAddOns(),
      ]);
      setLoading(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (horses.length > 0) {
      const uniqueBarns = [
        ...new Set(horses.map((horse) => horse.barn?.trim()).filter(Boolean)),
      ];
      setExistingBarns(uniqueBarns.sort() as any);
    }
  }, [horses]);

  useEffect(() => {
    if (editingShoeing) {
      console.log("Populating form with editing shoeing:", editingShoeing);

      // Parse the horse name and barn from the "Horses" field
      const [horseName, barnInfo] = editingShoeing["Horses"].split(" - ");
      const barn = barnInfo.replace(/^\[|\]$/g, ""); // Remove square brackets

      // Find the corresponding horse in the horses array
      const selectedHorse = horses.find(
        (h) => h.name === horseName && h.barn === barn
      );
      console.log("Selected horse:", selectedHorse);

      if (!selectedHorse) {
        console.error("Could not find matching horse in horses array");
        toast.error("Error loading horse data. Please refresh and try again.");
        return;
      }

      const frontAddOns = parseAddOns(editingShoeing["Front Add-On's"], addOns);
      const hindAddOns = parseAddOns(editingShoeing["Hind Add-On's"], addOns);

      console.log("Front Add-Ons (parsed):", frontAddOns);
      console.log("Hind Add-Ons (parsed):", hindAddOns);

      form.reset({
        horseName: selectedHorse.id,
        dateOfService: new Date(editingShoeing["Date of Service"]),
        locationOfService: editingShoeing["Location of Service"],
        baseService: editingShoeing["Base Service"],
        frontAddOns: frontAddOns,
        hindAddOns: hindAddOns,
        customServices: editingShoeing["Other Custom Services"] || "",
        shoeingNotes: editingShoeing["Shoe Notes"] || "",
      });

      // Update the selected values for dropdowns
      setSelectedLocation(editingShoeing["Location of Service"]);
      setSelectedBaseService(editingShoeing["Base Service"]);

      // Force re-render of all form components
      setForceUpdate((prev) => !prev);

      console.log("Form values after reset:", form.getValues());
    } else {
      // Clear the form when editingShoeing is null
      form.reset({
        horseName: "",
        dateOfService: undefined,
        locationOfService: "",
        baseService: "",
        frontAddOns: [],
        hindAddOns: [],
        customServices: "",
        shoeingNotes: "",
      });
    }
  }, [editingShoeing, form, horses, addOns, parseAddOns]);

  const handleEdit = (shoeing: any) => {
    console.log("Editing shoeing:", shoeing);
    setEditingShoeing(shoeing);
    setActiveTab("new-shoeing");
  };

  async function fetchLocations() {
    const { data, error } = await supabase
      .from("locations")
      .select("service_location")
      .order("service_location");

    if (error) {
      console.error("Error fetching locations:", error);
    } else {
      const uniqueLocations = data.map((item) => item.service_location);
      setLocations(uniqueLocations);
    }
  }

  async function fetchHorses() {
    let allHorses: any[] = [];
    let from = 0;
    const chunkSize = 1000;
    let to = chunkSize - 1;
    let fetchMore = true;

    while (fetchMore) {
      const { data, error } = await supabase
        .from("horses")
        .select(
          'id, "Name", "Barn / Trainer", alert, "Owner Email", "Owner Phone", "Customers"'
        )
        .range(from, to);

      if (error) {
        console.error("Error fetching horses:", error);
        fetchMore = false;
      } else {
        allHorses = [...allHorses, ...data];
        if (data.length < chunkSize) {
          fetchMore = false;
        } else {
          from += chunkSize;
          to += chunkSize;
        }
      }
    }

    const formattedData = allHorses
      .filter((horse) => horse.Name !== null)
      .map((horse) => ({
        id: horse.id,
        name: horse.Name,
        barn: horse["Barn / Trainer"],
        alert: horse.alert,
        ownerEmail: horse["Owner Email"],
        ownerPhone: horse["Owner Phone"],
        customerName: horse["Customers"],
      }))
      .sort((a, b) => a.name!.localeCompare(b.name!));
    setHorses(formattedData);
  }

  async function fetchServicesAndAddOns() {
    const { data, error } = await supabase.from("prices").select("name, type");

    if (error) {
      console.error("Error fetching services and add-ons:", error);
    } else {
      const services = data
        .filter(
          (item) =>
            item.type === "Service" && item.name && item.name.trim() !== ""
        )
        .map((item) => item.name.trim())
        .sort();
      const addOnsData = data
        .filter(
          (item) =>
            item.type === "Add-on" && item.name && item.name.trim() !== ""
        )
        .map((item) => item.name.trim())
        .sort();

      setBaseServices([...new Set(services)]);
      setAddOns([...new Set(addOnsData)]);
    }
  }

  const filteredHorses = useMemo(() => {
    return horses
      .filter(
        (horse) =>
          (horse.name?.toLowerCase() || "").includes(
            searchQuery.toLowerCase()
          ) ||
          (horse.barn?.toLowerCase() || "").includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // First, sort by alert status
        if (a.alert && !b.alert) return -1;
        if (!a.alert && b.alert) return 1;

        // If alert status is the same, sort alphabetically
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [horses, searchQuery]);

  // Add these new state variables
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    undefined
  );
  const [selectedBaseService, setSelectedBaseService] = useState<
    string | undefined
  >(undefined);

  const [isNewHorse, setIsNewHorse] = useState(false);

  // Add these state variables at the top of your component with other useState declarations
  const [, setSelectedFrontAddOns] = useState<string[]>([]);
  const [, setSelectedHindAddOns] = useState<string[]>([]);

  // Add this state at the top of your component
  const [resetTrigger, setResetTrigger] = useState(0);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Starting onSubmit with values:", values);
    try {
      let selectedHorse;

      // Always get the selected horse from the form value (horseId)
      selectedHorse = horses.find((h) => h.id === values.horseName);

      if (!selectedHorse) {
        console.error("Horse not found:", { horseId: values.horseName });
        throw new Error("Selected horse not found");
      }

      if (!user) {
        console.log("No user found, aborting submission");
        toast.error("You must be logged in to submit a shoeing record.");
        return;
      }

      console.log("Selected horse:", selectedHorse);

      const joinAddOns = (addOns: string[] | undefined): string => {
        return addOns ? addOns.join(" and ") : "";
      };

      const frontAddOns = joinAddOns(values.frontAddOns);
      const hindAddOns = joinAddOns(values.hindAddOns);

      // Recalculate costs
      const allAddOns = [
        ...new Set([
          ...frontAddOns.split(" and "),
          ...hindAddOns.split(" and "),
        ]),
      ];

      // First, get all the prices
      const { data: pricesData, error: pricesError } = await supabase
        .from("prices")
        .select(
          `
          id,
          name,
          type,
          location_prices (
            price,
            location_id,
            locations (
              service_location
            )
          )
        `
        )
        .in("name", [values.baseService, ...allAddOns]);

      if (pricesError) throw pricesError;

      // Get the location ID for the selected service location
      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select("id")
        .eq("service_location", values.locationOfService)
        .single();

      if (locationError) throw locationError;

      const locationId = locationData.id;

      // Create a price map for the selected location
      const priceMap = new Map(
        pricesData.map((price) => [
          price.name,
          price.location_prices.find((lp) => lp.location_id === locationId)
            ?.price || 0,
        ])
      );

      let baseServiceCost = priceMap.get(values.baseService) || 0;
      let frontAddOnsCost = 0;
      let hindAddOnsCost = 0;

      frontAddOns.split(" and ").forEach((addOn) => {
        if (addOn.trim()) {
          frontAddOnsCost += priceMap.get(addOn.trim()) || 0;
        }
      });

      hindAddOns.split(" and ").forEach((addOn) => {
        if (addOn.trim()) {
          hindAddOnsCost += priceMap.get(addOn.trim()) || 0;
        }
      });

      const totalCost = baseServiceCost + frontAddOnsCost + hindAddOnsCost;

      console.log("Calculated costs:", {
        baseServiceCost,
        frontAddOnsCost,
        hindAddOnsCost,
        totalCost,
      });

      // Create the updated description
      let description = `${selectedHorse.name} - ${values.baseService}`;
      if (frontAddOns) {
        description += ` with front add-ons: ${frontAddOns}`;
      }
      if (hindAddOns) {
        description += ` and hind add-ons: ${hindAddOns}`;
      }

      const shoeingData = {
        "Horse Name": selectedHorse.name,
        Horses: `${selectedHorse.name} - [${selectedHorse.barn || "No Barn"}]`,
        "Date of Service": values.dateOfService
          ? format(values.dateOfService, "MM/dd/yyyy")
          : null,
        "Location of Service": values.locationOfService,
        "Base Service": values.baseService,
        "Front Add-On's": frontAddOns,
        "Hind Add-On's": hindAddOns,
        "Other Custom Services": values.customServices,
        "Shoe Notes": values.shoeingNotes,
        "Cost of Service": baseServiceCost,
        "Cost of Front Add-Ons": frontAddOnsCost,
        "Cost of Hind Add-Ons": hindAddOnsCost,
        "Owner Email": selectedHorse.ownerEmail,
        "QB Customers": selectedHorse.customerName,
        "Total Cost": totalCost,
        Description: description,
        status: "pending",
        user_id: user.id,
        is_new_horse: isNewHorse,
      };

      console.log("Prepared shoeingData:", shoeingData);

      let result;
      if (editingShoeing) {
        // Update existing shoeing
        const { data, error } = await supabase
          .from("shoeings")
          .update(shoeingData)
          .eq("id", editingShoeing.id)
          .select();
        result = { data, error };
        console.log("Updating existing shoeing:", editingShoeing.id);
      } else {
        // Insert new shoeing
        const { data, error } = await supabase
          .from("shoeings")
          .insert([shoeingData])
          .select();
        result = { data, error };
        console.log("Inserting new shoeing");
      }

      console.log(
        "Supabase operation result - data:",
        result.data,
        "error:",
        result.error
      );

      if (result.error) throw result.error;

      if (!result.data || result.data.length === 0) {
        console.log("No data returned from Supabase operation");
        throw new Error("No data returned from database operation");
      }

      console.log("Shoeing record saved successfully:", result.data);
      toast.success(
        editingShoeing
          ? "Shoeing record updated successfully!"
          : "Shoeing record added successfully!"
      );

      // Reset form
      form.reset({
        horseName: "",
        dateOfService: undefined,
        locationOfService: "",
        baseService: "",
        frontAddOns: [],
        hindAddOns: [],
        customServices: "",
        shoeingNotes: "",
      });

      // Reset all state
      setSelectedLocation(undefined);
      setSelectedBaseService(undefined);
      setSearchQuery("");
      setSelectedFrontAddOns([]);
      setSelectedHindAddOns([]);

      // Trigger reset of MultiSelect
      setResetTrigger((prev) => prev + 1);

      // Force re-render
      setForceUpdate((prev) => !prev);

      // Update the submitted shoeings list
      setSubmittedShoeingsKey((prev) => prev + 1);

      // Reset the form state
      form.clearErrors();
      form.setFocus("horseName");

      // Force clear the MultiSelect components
      const frontAddOnsElement = document.querySelector(
        '[name="frontAddOns"]'
      ) as HTMLElement;
      if (frontAddOnsElement) {
        const clearButton = frontAddOnsElement.querySelector(
          'button[aria-label="Clear"]'
        );
        if (clearButton) {
          (clearButton as HTMLButtonElement).click();
        }
      }
    } catch (error: any) {
      console.error("Error adding shoeing record:", error);
      toast.error(
        error.code === "42501"
          ? "You don't have permission to add shoeing records"
          : "Failed to add shoeing record"
      );
    }
  }

  const handleAddNewHorseClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event propagation

    // Reset the new horse form when opening the modal
    newHorseForm.reset();
    setIsModalOpen(true);
  };

  // Add a new state for selected horse
  const [selectedHorseId, setSelectedHorseId] = useState<string>("");

  const handleAddNewHorse = async (values: NewHorseFormValues) => {
    console.log("Storing temporary new horse data:", values);

    // Check if horse with same name and barn already exists
    const existingHorse = horses.find(
      (horse) =>
        horse.name?.toLowerCase() === values.horseName.toLowerCase() &&
        horse.barn?.toLowerCase().trim() === values.barnName.toLowerCase()
    );

    if (existingHorse) {
      console.log("Horse already exists:", existingHorse);
      toast.error("A horse with this name and barn/trainer already exists.");
      return;
    }

    const tempHorse: Horse = {
      id: `temp_${Date.now()}`,
      name: values.horseName,
      barn: values.barnName,
      ownerEmail: values.ownerEmail || null,
      ownerPhone: values.ownerPhone || null,
      customerName: null,
    };

    // Add the new horse to the horses array
    setHorses((prev) => [...prev, tempHorse]);

    // Clear the new horse form and close modal
    newHorseForm.reset();
    setIsModalOpen(false);
    setIsNewHorse(true);

    // Force update and set the selected horse in a single update
    setTimeout(() => {
      setForceUpdate((prev) => !prev);
      setSelectedHorseId(tempHorse.id);
      form.setValue("horseName", tempHorse.id, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }, 0);
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
    newHorseForm.setValue("ownerPhone", value);
  };

  // Add a state to force re-render
  const [forceUpdate, setForceUpdate] = useState(false);

  const [isLoadingHorses, setIsLoadingHorses] = useState(false);

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 align-middle mb-6">
        <TbHorseshoe className="text-4xl" />
        <h1 className="text-4xl font-bold text-black">Shoeings</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-center sm:justify-start bg-primary text-white">
          <TabsTrigger
            value="new-shoeing"
            className="flex-1 sm:flex-initial"
            onClick={() => {
              if (editingShoeing) {
                setEditingShoeing(null);
              }
            }}
          >
            New Shoeing
          </TabsTrigger>
          <TabsTrigger
            value="submitted-shoeings"
            className="flex-1 sm:flex-initial"
          >
            Waiting to Invoice
          </TabsTrigger>
          <TabsTrigger
            value="sent-this-month"
            className="flex-1 sm:flex-initial"
          >
            Last 30 Days
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-shoeing">
          <div className="mt-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-6 sm:p-8">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="horseName"
                        render={({ field, fieldState }) => {
                          const selectedHorse = horses.find(
                            (horse) => horse.id === field.value
                          );
                          const isMobile = useMediaQuery("(max-width: 640px)");
                          const [isSearchOpen, setIsSearchOpen] =
                            useState(false);

                          // Define searchContent here
                          const searchContent = (
                            <div className="space-y-4">
                              <div className="relative">
                                <Input
                                  type="text"
                                  placeholder="Search horses or barns..."
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  className="pr-8"
                                  autoFocus
                                />
                                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                {filteredHorses.map((horse) => (
                                  <div
                                    key={horse.id}
                                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded-md"
                                    onClick={() => {
                                      field.onChange(horse.id);
                                      setSelectedHorseId(horse.id);
                                      setIsSearchOpen(false);
                                      setSearchQuery(""); // Clear search query when horse is selected
                                    }}
                                  >
                                    <div className="flex items-center w-full">
                                      {horse.alert && (
                                        <IoFlagSharp
                                          className="text-red-500 mr-2 flex-shrink-0"
                                          size={20}
                                        />
                                      )}
                                      <div className="flex flex-col sm:flex-row sm:items-center w-full">
                                        <span className="font-bold">
                                          {horse.name}
                                        </span>
                                        <span className="ml-0 sm:ml-2 mt-1 sm:mt-0 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
                                          <House className="h-3 w-3 mr-1" />
                                          {horse.barn || "No Barn Available"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {filteredHorses.length === 0 && (
                                  <div className="text-center text-gray-500 py-4">
                                    No horses found
                                  </div>
                                )}
                              </div>
                            </div>
                          );

                          return (
                            <FormItem>
                              <FormLabel>Horse Name*</FormLabel>
                              {loading ? (
                                <Skeleton className="h-10 w-full" />
                              ) : (
                                <>
                                  <div className="flex flex-col space-y-2">
                                    {isMobile ? (
                                      <>
                                        <div
                                          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                          onClick={() => {
                                            setIsLoadingHorses(true);
                                            setIsSearchOpen(true);
                                          }}
                                        >
                                          {selectedHorse ? (
                                            <div className="flex items-center">
                                              <span className="font-bold">
                                                {selectedHorse.name}
                                              </span>
                                              <span className="ml-2 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
                                                <House className="h-3 w-3 mr-1" />
                                                {selectedHorse.barn ||
                                                  "No Barn Available"}
                                              </span>
                                            </div>
                                          ) : (
                                            "Select a Horse"
                                          )}
                                        </div>
                                        <Dialog
                                          open={isSearchOpen}
                                          onOpenChange={(open) => {
                                            setIsSearchOpen(open);
                                            if (!open)
                                              setIsLoadingHorses(false);
                                          }}
                                        >
                                          <DialogContent
                                            className="sm:max-w-[425px] mx-auto rounded-lg sm:rounded-lg p-4 sm:p-6 w-[calc(100%-2rem)] sm:w-full"
                                            onOpenAutoFocus={(e) => {
                                              e.preventDefault();
                                              setIsLoadingHorses(false);
                                            }}
                                          >
                                            {isLoadingHorses ? (
                                              <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                              </div>
                                            ) : (
                                              searchContent
                                            )}
                                          </DialogContent>
                                        </Dialog>
                                      </>
                                    ) : (
                                      <Select
                                        key={`horse-select-${forceUpdate}`}
                                        open={isDropdownOpen}
                                        onOpenChange={setIsDropdownOpen}
                                        value={selectedHorseId || field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          setSelectedHorseId(value);
                                          setSearchQuery(""); // Clear the search query when a horse is selected
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger ref={selectRef}>
                                            <SelectValue placeholder="Select a Horse">
                                              {field.value ? (
                                                <div className="flex items-center">
                                                  <span className="font-bold">
                                                    {selectedHorse?.name}
                                                  </span>
                                                  <span className="ml-2 bg-primary text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded flex items-center">
                                                    <House className="h-3 w-3 mr-1" />
                                                    {selectedHorse?.barn ||
                                                      "No Barn Available"}
                                                  </span>
                                                  {selectedHorse?.alert && (
                                                    <IoFlagSharp
                                                      className="text-red-500"
                                                      size={20}
                                                    />
                                                  )}
                                                </div>
                                              ) : (
                                                "Select a Horse"
                                              )}
                                            </SelectValue>
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent
                                          className="sm:max-h-[300px] w-[var(--radix-select-trigger-width)]"
                                          position="popper"
                                          sideOffset={4}
                                        >
                                          <div
                                            className="sticky top-0 p-2 bg-white z-10 border-b"
                                            onClick={(e) => e.stopPropagation()}
                                            onPointerDown={(e) =>
                                              e.stopPropagation()
                                            }
                                          >
                                            <div className="relative">
                                              <Input
                                                type="text"
                                                placeholder="Search horses or barns..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  setSearchQuery(
                                                    e.target.value
                                                  );
                                                }}
                                                className="pr-8"
                                              />
                                              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                            </div>
                                          </div>

                                          {filteredHorses.length > 0 ? (
                                            <List
                                              height={200}
                                              itemCount={filteredHorses.length}
                                              itemSize={35}
                                              width="100%"
                                            >
                                              {({ index, style }) => (
                                                <SelectItem
                                                  key={filteredHorses[index].id}
                                                  value={
                                                    filteredHorses[index].id
                                                  }
                                                  style={style}
                                                >
                                                  <div className="flex items-center w-full">
                                                    {filteredHorses[index]
                                                      .alert && (
                                                      <IoFlagSharp
                                                        className="text-red-500 mr-2"
                                                        size={20}
                                                      />
                                                    )}
                                                    <span className="font-bold">
                                                      {
                                                        filteredHorses[index]
                                                          .name
                                                      }
                                                    </span>
                                                    <span className="flex items-center ml-2 bg-primary text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                                      <House className="h-3 w-3 mr-1" />{" "}
                                                      {filteredHorses[index]
                                                        .barn ||
                                                        "No Barn Available"}
                                                    </span>
                                                  </div>
                                                </SelectItem>
                                              )}
                                            </List>
                                          ) : (
                                            <div className="p-2 text-center text-gray-500">
                                              No horses found
                                            </div>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    )}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="whitespace-nowrap bg-primary text-white hover:bg-primary hover:text-white w-full sm:w-auto"
                                      onClick={handleAddNewHorseClick}
                                    >
                                      <PlusCircle className="h-4 w-4 mr-2" />
                                      Add New Horse
                                    </Button>
                                  </div>
                                  {selectedHorse?.alert && (
                                    <div className="flex items-center bg-red-100 text-red-700 p-2 rounded-md mt-2">
                                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                      <span className="text-sm">
                                        {selectedHorse.alert}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              <FormMessage>
                                {fieldState.error?.message}
                              </FormMessage>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfService"
                        render={({ field }) => (
                          <FormItem className="flex flex-col mt-2 ">
                            <FormLabel>Date of Service*</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal bg-white",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="locationOfService"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location of Service*</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedLocation(value);
                              }}
                              value={selectedLocation || undefined}
                              key={`location-${forceUpdate}`}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations
                                  .filter(
                                    (location) =>
                                      location && location.trim() !== ""
                                  )
                                  .map((location) => (
                                    <SelectItem key={location} value={location}>
                                      {location}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="baseService"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Service*</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedBaseService(value);
                              }}
                              value={selectedBaseService || undefined}
                              key={`baseService-${forceUpdate}`}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a base service" />
                              </SelectTrigger>
                              <SelectContent>
                                {baseServices
                                  .filter(
                                    (service) =>
                                      service && service.trim() !== ""
                                  )
                                  .map((service) => (
                                    <SelectItem key={service} value={service}>
                                      {service}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        key={resetTrigger}
                        control={form.control}
                        name="frontAddOns"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Front Add-Ons</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={addOns.map((addon) => ({
                                  label: addon,
                                  value: addon,
                                }))}
                                value={[]}
                                onValueChange={(values) => {
                                  field.onChange(values);
                                  setSelectedFrontAddOns(values);
                                }}
                                selected={resetTrigger ? [] : field.value}
                                placeholder="Select front add-on's"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hindAddOns"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hind Add-On's</FormLabel>
                            <MultiSelect
                              options={addOns.map((addOn) => ({
                                value: addOn,
                                label: addOn,
                              }))}
                              onValueChange={(values) => field.onChange(values)}
                              selected={field.value}
                              placeholder="Select hind add-on's"
                              key={`hind-${forceUpdate}`}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="customServices"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Services</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter any custom services"
                              {...field}
                              value={field.value || ""} // Ensure the value is never undefined
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shoeingNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shoeing Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any additional notes"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full sm:w-auto hover:bg-black hover:text-white"
                    >
                      {editingShoeing ? "Update Shoeing" : "Submit New Shoeing"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submitted-shoeings">
          <h2 className="text-2xl font-bold mb-4">Pending Shoeings</h2>
          <SubmittedShoeings onEdit={handleEdit} key={submittedShoeingsKey} />
        </TabsContent>

        <TabsContent value="sent-this-month">
          <h2 className="text-2xl font-bold mb-4">
            Completed Shoeings (Last 30 Days)
          </h2>
          <SentLastThirtyDays />
        </TabsContent>
      </Tabs>

      {/* Modal for adding new horse */}
      <Dialog
        open={isModalOpen}
        modal={false}
        onOpenChange={(open) => {
          if (!open) {
            // Reset form when closing the modal
            newHorseForm.reset();
          }
          setIsModalOpen(open);
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Horse</DialogTitle>
          </DialogHeader>
          <Form {...newHorseForm}>
            <form
              onSubmit={newHorseForm.handleSubmit(handleAddNewHorse)}
              className="space-y-4"
            >
              <FormField
                control={newHorseForm.control}
                name="horseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horse Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter horse name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newHorseForm.control}
                name="barnName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barn / Trainer*</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Barn/Trainer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingBarns
                          .filter((barn) => barn && barn.trim() !== "")
                          .map((barn) => (
                            <SelectItem key={barn} value={barn}>
                              {barn}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newHorseForm.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter owner email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newHorseForm.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="Enter owner phone number"
                        onChange={handlePhoneInput}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="hover:bg-black hover:text-white mb-4"
              type="submit"
              onClick={newHorseForm.handleSubmit(handleAddNewHorse)}
            >
              Add Horse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
