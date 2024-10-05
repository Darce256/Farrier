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
import { useState, useEffect, useMemo } from "react";
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
  frontAddOns: z.string().optional(),
  hindAddOns: z.string().optional(),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const newHorseForm = useForm<NewHorseFormValues>({
    resolver: zodResolver(newHorseSchema),
  });

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
        ...new Set(horses.map((horse) => horse.barn).filter(Boolean)),
      ];
      setExistingBarns(uniqueBarns.sort() as any);
    }
  }, [horses]);

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would typically send this data to your backend
  }

  const handleAddNewHorse = async (values: NewHorseFormValues) => {
    // Check if horse with same name and barn already exists
    const existingHorse = horses.find(
      (horse) =>
        horse.name?.toLowerCase() === values.horseName.toLowerCase() &&
        horse.barn?.toLowerCase() === values.barnName.toLowerCase()
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
          "Barn / Trainer": values.barnName,
          "Owner Email": values.ownerEmail,
          Customers: values.customerName,
          "Owner Phone": values.ownerPhone,
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
      setHorses((prevHorses) => [...prevHorses, newHorse]);
      setIsModalOpen(false);
      toast.success("New horse and customer added successfully.");
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
    newHorseForm.setValue("ownerPhone", value);
  };

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-right" />
      <div className="flex items-center gap-2 align-middle mb-6">
        <TbHorseshoe className="text-4xl" />
        <h1 className="text-4xl font-bold text-black">New Shoeing</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="horseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horse Name*</FormLabel>
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a Horse">
                                {field.value ? (
                                  <>
                                    <span className="font-bold">
                                      {
                                        horses.find(
                                          (horse) => horse.id === field.value
                                        )?.name
                                      }
                                    </span>
                                    <span className="ml-2 bg-primary text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                      {horses.find(
                                        (horse) => horse.id === field.value
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
                  )}
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
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
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
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a location">
                                {field.value && (
                                  <span className="font-bold">
                                    {field.value}
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location} value={location}>
                                <span className="font-bold">{location}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select base service">
                                {field.value && (
                                  <span className="font-bold">
                                    {field.value}
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {baseServices.map(
                              (service) =>
                                service && (
                                  <SelectItem key={service} value={service}>
                                    <span className="font-bold">{service}</span>
                                  </SelectItem>
                                )
                            )}
                          </SelectContent>
                        </Select>
                      )}
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
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select front add-on's">
                                {field.value && (
                                  <span className="font-bold">
                                    {field.value}
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {addOns.map(
                              (addOn) =>
                                addOn && (
                                  <SelectItem key={addOn} value={addOn}>
                                    <span className="font-bold">{addOn}</span>
                                  </SelectItem>
                                )
                            )}
                          </SelectContent>
                        </Select>
                      )}
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
                      {loading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select hind add-on's">
                                {field.value && (
                                  <span className="font-bold">
                                    {field.value}
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {addOns.map(
                              (addOn) =>
                                addOn && (
                                  <SelectItem key={addOn} value={addOn}>
                                    <span className="font-bold">{addOn}</span>
                                  </SelectItem>
                                )
                            )}
                          </SelectContent>
                        </Select>
                      )}
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
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </div>

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
                            field.onChange(e);
                            setBarnSearchQuery(e.target.value);
                          }}
                        />
                        {barnSearchQuery && (
                          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto">
                            {filteredBarns.map((barn, index) => (
                              <li
                                key={index}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  field.onChange(barn);
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
