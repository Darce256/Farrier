import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { CustomerSelect } from "@/components/ui/customer-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the validation schema
const horseFormSchema = z.object({
  Name: z.string().min(1, "Horse name is required"),
  "Barn / Trainer": z.string().min(1, "Barn/Trainer is required"),
  "Owner Email": z.string().email("Invalid email").optional().or(z.literal("")),
  "Owner Phone": z.string().optional(),
  status: z.string(),
  alert: z.string().optional(),
  Customers: z.string().optional(),
});

type FormValues = z.infer<typeof horseFormSchema>;

export default function EditHorse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [existingBarns, setExistingBarns] = useState<string[]>([]);
  const [showBarnSuggestions, setShowBarnSuggestions] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(horseFormSchema),
    defaultValues: {
      Name: "",
      "Barn / Trainer": "",
      "Owner Email": "",
      "Owner Phone": "",
      status: "pending",
      alert: "",
      Customers: "",
    },
  });

  useEffect(() => {
    if (id) {
      fetchHorse();
    } else {
      setLoading(false);
    }
    fetchExistingBarns();
  }, [id]);

  const fetchHorse = async () => {
    try {
      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      form.reset(data);
      if (data.Customers) {
        setSelectedCustomers(data.Customers.split(", ").filter(Boolean));
      }
    } catch (error) {
      console.error("Error fetching horse:", error);
      toast.error("Failed to fetch horse details");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingBarns = async () => {
    try {
      const { data, error } = await supabase
        .from("horses")
        .select('"Barn / Trainer"')
        .not('"Barn / Trainer"', "is", null);

      if (error) throw error;

      const uniqueBarns = Array.from(
        new Set(data.map((item) => item["Barn / Trainer"]))
      )
        .filter(Boolean)
        .sort();

      setExistingBarns(uniqueBarns);
    } catch (err) {
      console.error("Error fetching barns:", err);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      values.Customers = selectedCustomers.join(", ");

      const horseData = {
        ...values,
        id: id || undefined,
      };

      const { error } = id
        ? await supabase.from("horses").update(horseData).eq("id", id)
        : await supabase.from("horses").insert(horseData);

      if (error) throw error;

      toast.success(
        id ? "Horse updated successfully" : "Horse created successfully"
      );
      navigate("/shoeings-approval-panel?tab=horses");
    } catch (error) {
      console.error("Error saving horse:", error);
      toast.error("Failed to save horse");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">
          {id ? "Edit Horse" : "New Horse"}
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Barn / Trainer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barn / Trainer</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          onFocus={() => setShowBarnSuggestions(true)}
                        />
                        {showBarnSuggestions && existingBarns.length > 0 && (
                          <ScrollArea className="absolute w-full z-10 max-h-[200px] bg-white border rounded-md shadow-lg">
                            {existingBarns
                              .filter((barn) =>
                                barn
                                  .toLowerCase()
                                  .includes(field.value.toLowerCase())
                              )
                              .map((barn) => (
                                <Button
                                  key={barn}
                                  type="button"
                                  variant="ghost"
                                  className="w-full text-left flex items-center px-2 py-1 hover:bg-accent"
                                  onClick={() => {
                                    field.onChange(barn);
                                    setShowBarnSuggestions(false);
                                  }}
                                >
                                  {barn}
                                </Button>
                              ))}
                          </ScrollArea>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Owner Email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Owner Phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alert"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Customers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customers</FormLabel>
                    <FormControl>
                      <div>
                        <CustomerSelect
                          selectedCustomers={selectedCustomers}
                          onCustomerChange={(selected) => {
                            setSelectedCustomers(selected);
                            field.onChange(selected.join(", "));
                          }}
                          placeholder="Search and select customers..."
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/shoeings-approval-panel?tab=horses")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {id ? "Saving..." : "Creating..."}
                  </>
                ) : id ? (
                  "Save Changes"
                ) : (
                  "Create Horse"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
