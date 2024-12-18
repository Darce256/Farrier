import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "react-query";
import { CustomerSelect } from "@/components/ui/customer-select";

interface Horse {
  id: string;
  Name: string;
  "Barn / Trainer": string | null;
  "Owner Email": string | null;
  "Owner Phone": string | null;
  History: string | null;
  "Horse Notes History": string | null;
  status: string;
  alert: string | null;
  Customers: string | null;
}

export default function EditHorse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [barnInput, setBarnInput] = useState("");
  const [existingBarns, setExistingBarns] = useState<string[]>([]);
  const [showBarnSuggestions, setShowBarnSuggestions] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  useEffect(() => {
    fetchHorse();
    fetchExistingBarns();
  }, [id]);

  useEffect(() => {
    if (horse?.Customers) {
      setSelectedCustomers(horse.Customers.split(", ").filter(Boolean));
    }
  }, [horse]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#barn-trainer-input")) {
        setShowBarnSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const fetchHorse = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("horses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setHorse(data);
      setBarnInput(data["Barn / Trainer"] || "");
    } catch (error) {
      console.error("Error fetching horse:", error);
      toast.error("Failed to fetch horse details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const horseData = Object.fromEntries(formData.entries());

    try {
      // Start a transaction to update both the horse and related shoeings
      const horseName = horseData.Name as string;
      const barnTrainer = horseData["Barn / Trainer"] as string;
      const newCustomers = horseData.Customers as string;

      // 1. Update the horse record
      const { error: horseError } = await supabase
        .from("horses")
        .update(horseData)
        .eq("id", id);

      if (horseError) throw horseError;

      // 2. Update any pending shoeings for this horse
      // We identify related shoeings by matching the horse name and barn/trainer
      const horseIdentifier = `${horseName} - [${barnTrainer}]`;

      const { error: shoeingsError } = await supabase
        .from("shoeings")
        .update({
          "QB Customers": newCustomers, // Update the QB Customers field
          "Owner Email": horseData["Owner Email"], // Also update the owner email
        })
        .eq("Horses", horseIdentifier)
        .eq("status", "pending"); // Only update pending shoeings

      if (shoeingsError) throw shoeingsError;

      await queryClient.invalidateQueries("horses");

      toast.success("Horse and related shoeings updated successfully");
      navigate("/shoeings-approval-panel?tab=horses");
    } catch (error) {
      console.error("Error updating horse:", error);
      toast.error("Failed to update horse");
    }
  };

  const handleCancel = () => {
    navigate("/shoeings-approval-panel?tab=horses");
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
        <h3 className="text-lg font-semibold mb-4">Edit Horse</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Name">Name</Label>
              <Input
                id="Name"
                name="Name"
                defaultValue={horse?.Name || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Barn / Trainer">Barn / Trainer</Label>
              <div className="relative" id="barn-trainer-input">
                <Input
                  id="Barn / Trainer"
                  name="Barn / Trainer"
                  value={barnInput}
                  onChange={(e) => {
                    setBarnInput(e.target.value);
                    setShowBarnSuggestions(true);
                  }}
                  onFocus={() => setShowBarnSuggestions(true)}
                />
                {showBarnSuggestions && existingBarns.length > 0 && (
                  <div className="absolute w-full z-10 top-full mt-1 bg-white border rounded-md shadow-lg">
                    <ScrollArea className="max-h-[200px]">
                      <div className="p-1">
                        {existingBarns
                          .filter((barn) =>
                            barn.toLowerCase().includes(barnInput.toLowerCase())
                          )
                          .map((barn) => (
                            <Button
                              key={barn}
                              type="button"
                              variant="ghost"
                              className="w-full text-left flex items-center px-2 py-1 hover:bg-accent"
                              onClick={() => {
                                setBarnInput(barn);
                                setShowBarnSuggestions(false);
                              }}
                            >
                              {barn}
                            </Button>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Owner Email">Owner Email</Label>
              <Input
                id="Owner Email"
                name="Owner Email"
                type="email"
                defaultValue={horse?.["Owner Email"] || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Owner Phone">Owner Phone</Label>
              <Input
                id="Owner Phone"
                name="Owner Phone"
                defaultValue={horse?.["Owner Phone"] || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={horse?.status || "pending"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert">Alert</Label>
              <Input
                id="alert"
                name="alert"
                defaultValue={horse?.alert || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Customers">Customers</Label>
              <CustomerSelect
                selectedCustomers={selectedCustomers}
                onCustomerChange={(selected) => {
                  setSelectedCustomers(selected);
                  const input = document.querySelector(
                    'input[name="Customers"]'
                  ) as HTMLInputElement;
                  if (input) {
                    input.value = selected.join(", ");
                  }
                }}
                placeholder="Search and select customers..."
              />
              <Input
                id="Customers"
                name="Customers"
                type="hidden"
                value={selectedCustomers.join(", ")}
                readOnly
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
