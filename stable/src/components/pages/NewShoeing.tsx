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

export default function ShoeingForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would typically send this data to your backend
  }

  return (
    <div className="container mx-auto p-4">
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
                          <SelectItem value="horse1">Thunder</SelectItem>
                          <SelectItem value="horse2">Storm</SelectItem>
                          <SelectItem value="horse3">Lightning</SelectItem>
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
                    <FormItem className="flex flex-col">
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
                      <Input
                        placeholder="Enter any custom services"
                        {...field}
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
    </div>
  );
}
