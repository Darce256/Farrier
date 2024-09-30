import { useState, useEffect } from "react";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  SelectSeparator,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TbHorseshoe } from "react-icons/tb";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

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

interface Horse {
  Name: string;
  "Barn / Trainer": string;
}

export default function ShoeingForm() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHorses();
  }, []);

  async function fetchHorses() {
    let allHorses: Horse[] = [];
    let page = 0;
    const pageSize = 1000; // Supabase's maximum limit

    while (true) {
      const { data, error, count } = await supabase
        .from("horses")
        .select('Name, "Barn / Trainer"', { count: "exact" })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("Error fetching horses:", error);
        break;
      }

      if (data) {
        allHorses = allHorses.concat(data as Horse[]);
      }

      if (!count || allHorses.length >= count) {
        break;
      }

      page++;
    }

    const sortedHorses = allHorses
      .filter((horse) => horse.Name && horse["Barn / Trainer"])
      .sort((a, b) => a.Name.localeCompare(b.Name));

    setHorses(sortedHorses);
    setIsLoading(false);
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would typically send this data to your backend
  }

  // Helper function to create a unique key for each horse
  const createHorseKey = (horse: Horse) => {
    const sanitizedName = horse.Name.trim().replace(/\s+/g, "-").toLowerCase();
    const sanitizedBarnTrainer = horse["Barn / Trainer"]
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    return `[${sanitizedName}-${sanitizedBarnTrainer}]`;
  };

  return (
    <div className="container mx-auto p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex items-center gap-2 align-middle mb-6">
            <TbHorseshoe className="text-4xl " />
            <h1 className="text-4xl font-bold text-black">New Shoeing</h1>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="horseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horse Name*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a horse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        <SelectItem value="new">
                          <div className="flex items-center">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Horse
                          </div>
                        </SelectItem>
                        <SelectSeparator />
                        {isLoading
                          ? // Skeleton loaders
                            Array.from({ length: 5 }).map((_, index) => (
                              <div
                                key={`skeleton-${index}`}
                                className="flex items-center space-x-2 p-2"
                              >
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            ))
                          : horses.map((horse) => (
                              <SelectItem
                                key={createHorseKey(horse)}
                                value={horse.Name}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold">
                                    {horse.Name.trim()}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {horse["Barn / Trainer"]
                                      .split(",")
                                      .map((barn, barnIndex) => (
                                        <Badge
                                          key={`${createHorseKey(
                                            horse
                                          )}-barn-${barnIndex}`}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {barn.trim()}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stable1">Main Stable</SelectItem>
                      <SelectItem value="stable2">North Paddock</SelectItem>
                      <SelectItem value="stable3">South Barn</SelectItem>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select base service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="trim">Trim</SelectItem>
                      <SelectItem value="fullSet">Full Set</SelectItem>
                      <SelectItem value="frontSet">Front Set</SelectItem>
                      <SelectItem value="hindSet">Hind Set</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select front add-on's" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pads">Pads</SelectItem>
                      <SelectItem value="studs">Studs</SelectItem>
                      <SelectItem value="specialShoes">
                        Special Shoes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hindAddOns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hind Add-On's</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hind add-on's" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pads">Pads</SelectItem>
                      <SelectItem value="studs">Studs</SelectItem>
                      <SelectItem value="specialShoes">
                        Special Shoes
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Input placeholder="Enter any custom services" {...field} />
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
  );
}
