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
import { PlusCircle, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // Shadcn UI Dialog components
import toast, { Toaster } from "react-hot-toast";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuth } from "@/components/Contexts/AuthProvider"; // Adjust the import path as necessary
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  horseName: z.string({
    required_error: "Please select a horse.",
  }),
  dateOfService: z.date({
    required_error: "A date of service is required.",
  }),
  locationOfService: z.string({
    required_error: "Please select a location.",
  }),
  baseService: z.string().optional(),
  frontAddOns: z.array(z.string()).optional(),
  hindAddOns: z.array(z.string()).optional(),
  customServices: z.string().optional(),
  shoeingNotes: z.string().optional(),
});

type Horse = {
  id: string;
  name: string | null; // Allow name to be null for filtering
  barn: string | null; // Allow barn to be null for conditional display
};

// Update the schema to include customerName and phone number validation
const newHorseSchema = z.object({
  horseName: z.string().nonempty("Horse name is required"),
  barnName: z.string().nonempty("Barn name is required"),
  customerName: z.string().nonempty("Customer name is required"),
  ownerEmail: z.string().email("Invalid email address").optional(),
  ownerPhone: z
    .string()
    .regex(/^\d*$/, "Phone number must contain only digits")
    .optional(),
});

type NewHorseFormValues = z.infer<typeof newHorseSchema>;

// New component for submitted shoeings
function SubmittedShoeings({ onEdit }: { onEdit: (shoeing: any) => void }) {
  const [shoeings, setShoeings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubmittedShoeings();
    }
  }, [user]);

  async function fetchSubmittedShoeings() {
    const { data, error } = await supabase
      .from("shoeings")
      .select("*")
      .eq("user_id", user?.id || "")
      .order("Date of Service", { ascending: false });

    if (error) {
      console.error("Error fetching shoeings:", error);
      toast.error("Failed to fetch submitted shoeings");
    } else {
      console.log("Fetched shoeings:", data);
      setShoeings(data as any);
    }
  }

  const filteredShoeings = shoeings.filter(
    (shoeing: any) =>
      shoeing["Horse Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoeing["Base Service"]
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shoeing["Location of Service"]
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="mb-4 px-4 sm:px-0 relative">
        <Input
          type="text"
          placeholder="Search shoeings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
        <Search
          className="absolute left-7 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
        />
      </div>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-300">
              <thead>
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
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShoeings.map((shoeing: any) => (
                  <tr key={shoeing.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {new Date(
                        shoeing["Date of Service"]
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-4 text-sm text-black">
                      <div className="font-medium font-semibold">
                        {shoeing["Horse Name"]}
                      </div>
                      <div>{shoeing["Base Service"]}</div>
                      <div>{shoeing["Location of Service"]}</div>
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
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      {shoeing.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => onEdit(shoeing)}
                        >
                          Edit
                          <span className="sr-only">
                            , {shoeing["Horse Name"]}
                          </span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
  const [barnSearchQuery, setBarnSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef<HTMLButtonElement>(null);
  const isNewHorseAdded = useRef(false);

  // Add refs for MultiSelect components
  const frontAddOnsRef = useRef(null);
  const hindAddOnsRef = useRef(null);

  const [activeTab, setActiveTab] = useState("new-shoeing");
  const [editingShoeing, setEditingShoeing] = useState<any>(null);
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const newHorseForm = useForm<NewHorseFormValues>({
    resolver: zodResolver(newHorseSchema),
  });

  const [submittedShoeingsKey, setSubmittedShoeingsKey] = useState(0);

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

      form.reset({
        horseName: selectedHorse.id,
        dateOfService: new Date(editingShoeing["Date of Service"]),
        locationOfService: editingShoeing["Location of Service"],
        baseService: editingShoeing["Base Service"],
        frontAddOns: editingShoeing["Front Add-On's"]
          ? editingShoeing["Front Add-On's"].split(" and ")
          : [],
        hindAddOns: editingShoeing["Hind Add-On's"]
          ? editingShoeing["Hind Add-On's"].split(" and ")
          : [],
        customServices: editingShoeing["Other Custom Services"] || "",
        shoeingNotes: editingShoeing["Shoe Notes"] || "",
      });

      // Update the selected values for dropdowns
      setSelectedLocation(editingShoeing["Location of Service"]);
      setSelectedBaseService(editingShoeing["Base Service"]);

      // Force re-render of all form components
      setForceUpdate((prev) => !prev);
    }
  }, [editingShoeing, form, horses]);

  const handleEdit = (shoeing: any) => {
    console.log("Editing shoeing:", shoeing);
    setEditingShoeing(shoeing);
    setActiveTab("new-shoeing");
  };

  async function fetchLocations() {
    const { data, error } = await supabase
      .from("shoeings")
      .select('"Location of Service"')
      .not("Location of Service", "is", null);

    if (error) {
      console.error("Error fetching locations:", error);
    } else {
      const uniqueLocations = [
        ...new Set(data.map((item: any) => item["Location of Service"])),
      ];
      setLocations(uniqueLocations.sort());
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
        .select('id, "Name", "Barn / Trainer"')
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

    // Filter out horses with null names, map the data to include the barn property, and sort alphabetically
    const formattedData = allHorses
      .filter((horse) => horse.Name !== null)
      .map((horse) => ({
        id: horse.id,
        name: horse.Name,
        barn: horse["Barn / Trainer"],
      }))
      .sort((a, b) => a.name!.localeCompare(b.name!));
    setHorses(formattedData);
  }

  async function fetchServicesAndAddOns() {
    const { data, error } = await supabase.from("prices").select("Name, Type");

    if (error) {
      console.error("Error fetching services and add-ons:", error);
    } else {
      const services = data
        .filter(
          (item) =>
            item.Type === "Service" && item.Name && item.Name.trim() !== ""
        )
        .map((item) => item.Name.trim())
        .sort();
      const addOnsData = data
        .filter(
          (item) =>
            item.Type === "Add-on" && item.Name && item.Name.trim() !== ""
        )
        .map((item) => item.Name.trim())
        .sort();

      setBaseServices([...new Set(services)]);
      setAddOns([...new Set(addOnsData)]);
    }
  }

  const filteredHorses = horses.filter((horse) =>
    horse.name!.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBarns = useMemo(() => {
    return existingBarns.filter((barn) =>
      barn.toLowerCase().includes(barnSearchQuery.toLowerCase())
    );
  }, [existingBarns, barnSearchQuery]);

  // Add these new state variables
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    undefined
  );
  const [selectedBaseService, setSelectedBaseService] = useState<
    string | undefined
  >(undefined);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!user) {
        toast.error("You must be logged in to submit a shoeing record.");
        return;
      }

      const selectedHorse = horses.find(
        (horse) => horse.id === values.horseName
      );
      if (!selectedHorse) {
        throw new Error("Selected horse not found");
      }

      const frontAddOns = values.frontAddOns || [];
      const hindAddOns = values.hindAddOns || [];

      // Recalculate costs
      const allAddOns = [...new Set([...frontAddOns, ...hindAddOns])];
      const { data: pricesData, error: pricesError } = await supabase
        .from("prices")
        .select("*")
        .in("Name", [values.baseService, ...allAddOns]);

      if (pricesError) throw pricesError;

      // Helper function to parse price strings
      const parsePrice = (priceString: string | null): number => {
        if (!priceString) return 0;
        return parseFloat(priceString.replace(/[^0-9.-]+/g, ""));
      };

      let baseServiceCost = 0;
      let frontAddOnsCost = 0;
      let hindAddOnsCost = 0;

      const priceMap = new Map(
        pricesData.map((price) => [
          price.Name,
          parsePrice(price[values.locationOfService]),
        ])
      );

      baseServiceCost = priceMap.get(values.baseService) || 0;

      frontAddOns.forEach((addOn) => {
        frontAddOnsCost += priceMap.get(addOn) || 0;
      });

      hindAddOns.forEach((addOn) => {
        hindAddOnsCost += priceMap.get(addOn) || 0;
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
      if (frontAddOns.length > 0) {
        description += ` with front add-ons: ${frontAddOns.join(" and ")}`;
      }
      if (hindAddOns.length > 0) {
        description += ` and hind add-ons: ${hindAddOns.join(" and ")}`;
      }

      const shoeingData = {
        "Horse Name": selectedHorse.name,
        Horses: `${selectedHorse.name} - [${selectedHorse.barn || "No Barn"}]`,
        "Date of Service": format(values.dateOfService, "MM/dd/yyyy"),
        "Location of Service": values.locationOfService,
        "Base Service": values.baseService,
        "Front Add-On's": frontAddOns.join(" and "),
        "Hind Add-On's": hindAddOns.join(" and "),
        "Other Custom Services": values.customServices,
        "Shoe Notes": values.shoeingNotes,
        "Cost of Service": baseServiceCost,
        "Cost of Front Add-Ons": frontAddOnsCost,
        "Cost of Hind Add-Ons": hindAddOnsCost,
        "Total Cost": totalCost,
        Description: description,
        // ... other fields ...
      };

      let data, error;

      if (editingShoeing) {
        console.log(
          "Updating existing shoeing record with ID:",
          editingShoeing.id
        );
        ({ data, error } = await supabase
          .from("shoeings")
          .update(shoeingData)
          .eq("id", editingShoeing.id)
          .select());
      } else {
        // ... handle insert case ...
      }

      if (error) throw error;

      console.log("Shoeing record saved successfully:", data);
      toast.success(
        editingShoeing
          ? "Shoeing record updated successfully!"
          : "Shoeing record added successfully!"
      );

      // Reset form and clear all values
      form.reset({
        horseName: "",
        dateOfService: new Date(),
        locationOfService: "",
        baseService: "",
        frontAddOns: [],
        hindAddOns: [],
        customServices: "",
        shoeingNotes: "",
      });

      // Clear any selected values in dropdowns or multi-selects
      setSelectedLocation("");
      setSelectedBaseService("");
      // If you have state for selected add-ons, reset those too
      // setSelectedFrontAddOns([]);
      // setSelectedHindAddOns([]);

      // Reset editing state
      setEditingShoeing(null);

      // Switch to the submitted shoeings tab
      setActiveTab("submitted-shoeings");

      // Trigger a refresh of the SubmittedShoeings component
      setSubmittedShoeingsKey((prevKey) => prevKey + 1);

      // Scroll to top of the page
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error saving shoeing record:", error);
      toast.error("Failed to save shoeing record. Please try again.");
    }
  }

  const handleAddNewHorse = async (values: NewHorseFormValues) => {
    // Trim the barn name
    const trimmedBarnName = values.barnName.trim();

    // Check if horse with same name and barn already exists
    const existingHorse = horses.find(
      (horse) =>
        horse.name?.toLowerCase() === values.horseName.toLowerCase() &&
        horse.barn?.toLowerCase().trim() === trimmedBarnName.toLowerCase()
    );

    if (existingHorse) {
      toast.error("A horse with this name and barn/trainer already exists.");
      return;
    }

    // Start a Supabase transaction
    const { data: horseData, error: horseError } = await supabase
      .from("horses")
      .insert([
        {
          Name: values.horseName,
          "Barn / Trainer": trimmedBarnName, // Use trimmed barn name
          "Owner Email": values.ownerEmail,
          Customers: values.customerName,
        },
      ])
      .select();

    if (horseError) {
      console.error("Error adding new horse:", horseError);
      toast.error("Failed to add new horse. Please try again.");
      return;
    }

    // If horse was added successfully, add the customer
    const { error: customerError } = await supabase.from("customers").insert([
      {
        "Display Name": values.customerName,
        Horses: values.horseName,
        "Owner Email": values.ownerEmail,
        Phone: values.ownerPhone,
      },
    ]);

    if (customerError) {
      console.error("Error adding new customer:", customerError);
      toast.error("Horse added, but failed to add customer. Please try again.");
      return;
    }

    // If both operations were successful
    if (horseData) {
      const newHorse = {
        id: horseData[0].id,
        name: horseData[0].Name,
        barn: horseData[0]["Barn / Trainer"],
      };

      setHorses((prevHorses) => {
        const updatedHorses = [...prevHorses, newHorse];
        return updatedHorses;
      });

      setIsModalOpen(false);
      setIsDropdownOpen(false);
      isNewHorseAdded.current = true;

      setTimeout(() => {
        form.setValue("horseName", newHorse.id);

        if (selectRef.current) {
          selectRef.current.click();
          selectRef.current.click();
        }
      }, 0);

      toast.success("New horse and customer added successfully.");
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
    newHorseForm.setValue("ownerPhone", value);
  };

  // Add a state to force re-render
  const [forceUpdate, setForceUpdate] = useState(false);

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 align-middle mb-6">
        <TbHorseshoe className="text-4xl " />
        <h1 className="text-4xl font-bold  text-black">Shoeings</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 px-4 sm:px-1 bg-primary text-white">
          <TabsTrigger value="new-shoeing">New Shoeing</TabsTrigger>
          <TabsTrigger value="submitted-shoeings">
            My Submitted Shoeings
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
                        render={({ field }) => {
                          return (
                            <FormItem>
                              <FormLabel>Horse Name*</FormLabel>
                              {loading ? (
                                <Skeleton className="h-10 w-full" />
                              ) : (
                                <Select
                                  open={isDropdownOpen}
                                  onOpenChange={setIsDropdownOpen}
                                  value={field.value}
                                  onValueChange={(value) => {
                                    if (
                                      isNewHorseAdded.current &&
                                      value === ""
                                    ) {
                                      isNewHorseAdded.current = false;
                                      return;
                                    }
                                    field.onChange(value);
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger ref={selectRef}>
                                      <SelectValue placeholder="Select a Horse">
                                        {field.value ? (
                                          <>
                                            <span className="font-bold">
                                              {
                                                horses.find(
                                                  (horse) =>
                                                    horse.id === field.value
                                                )?.name
                                              }
                                            </span>
                                            <span className="ml-2 bg-primary text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                              {horses.find(
                                                (horse) =>
                                                  horse.id === field.value
                                              )?.barn || "No Barn Available"}
                                            </span>
                                          </>
                                        ) : (
                                          "Select a Horse"
                                        )}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <div className="p-2 flex items-center space-x-2">
                                      <div className="relative flex-grow">
                                        <Input
                                          type="text"
                                          placeholder="Search horses..."
                                          value={searchQuery}
                                          onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                          }
                                          className="pr-8"
                                        />
                                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap bg-primary text-white hover:bg-primary hover:text-white"
                                        onClick={() => setIsModalOpen(true)}
                                      >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add New Horse
                                      </Button>
                                    </div>
                                    <List
                                      height={200}
                                      itemCount={filteredHorses.length}
                                      itemSize={35}
                                      width="100%"
                                    >
                                      {({ index, style }) => (
                                        <SelectItem
                                          key={filteredHorses[index].id}
                                          value={filteredHorses[index].id}
                                          style={style}
                                        >
                                          <span className="font-bold">
                                            {filteredHorses[index].name}
                                          </span>
                                          <span className="ml-2 bg-primary text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                            {filteredHorses[index].barn ||
                                              "No Barn Available"}
                                          </span>
                                        </SelectItem>
                                      )}
                                    </List>
                                  </SelectContent>
                                </Select>
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfService"
                        render={({ field }) => (
                          <FormItem className="flex flex-col mt-2">
                            <FormLabel>Date of Service*</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
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
                            <FormLabel>Location of Service</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedLocation(value);
                              }}
                              value={selectedLocation}
                              key={`location-${forceUpdate}`}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map((location) => (
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
                            <FormLabel>Base Service</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedBaseService(value);
                              }}
                              value={selectedBaseService}
                              key={`baseService-${forceUpdate}`}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a base service" />
                              </SelectTrigger>
                              <SelectContent>
                                {baseServices.map((service) => (
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
                        control={form.control}
                        name="frontAddOns"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Front Add-On's</FormLabel>
                            <MultiSelect
                              options={addOns.map((addOn) => ({
                                value: addOn,
                                label: addOn,
                              }))}
                              onValueChange={(values) => field.onChange(values)}
                              selected={field.value}
                              placeholder="Select front add-on's"
                              key={`front-${forceUpdate}`}
                            />
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
                    <Button type="submit" className="w-full sm:w-auto">
                      {editingShoeing ? "Update Shoeing" : "Submit New Shoeing"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submitted-shoeings">
          <SubmittedShoeings onEdit={handleEdit} key={submittedShoeingsKey} />
        </TabsContent>
      </Tabs>

      {/* Modal for adding new horse */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
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
                    <FormLabel>Barn Name*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Enter barn name"
                          onChange={(e) => {
                            const trimmedValue = e.target.value.trim();
                            field.onChange(trimmedValue);
                            setBarnSearchQuery(trimmedValue);
                          }}
                          onBlur={(e) => {
                            const trimmedValue = e.target.value.trim();
                            field.onChange(trimmedValue);
                          }}
                        />
                        {barnSearchQuery && (
                          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto">
                            {filteredBarns.map((barn, index) => (
                              <li
                                key={index}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  field.onChange(barn.trim());
                                  setBarnSearchQuery("");
                                }}
                              >
                                {barn}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newHorseForm.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter customer name" />
                    </FormControl>
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
