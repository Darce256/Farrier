import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { HorseSelect } from "../ui/horse-select";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Horse {
  id: string;
  Name: string;
  "Barn / Trainer": string;
}

export default function NewCustomer() {
  const navigate = useNavigate();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorses, setSelectedHorses] = useState<string[]>([]);
  const [barnInput, setBarnInput] = useState("");
  const [existingBarns, setExistingBarns] = useState<string[]>([]);
  const [showBarnSuggestions, setShowBarnSuggestions] = useState(false);

  useEffect(() => {
    fetchHorses();
    fetchExistingBarns();
  }, []);

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

  const fetchHorses = async () => {
    try {
      const { data, error } = await supabase
        .from("horses")
        .select('id, Name, "Barn / Trainer"')
        .order("Name");

      if (error) throw error;
      setHorses(data || []);
    } catch (error) {
      console.error("Error fetching horses:", error);
      toast.error("Failed to fetch horses");
    }
  };

  const fetchExistingBarns = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = Object.fromEntries(formData.entries());

    try {
      const { error } = await supabase.from("customers").insert([customerData]);
      if (error) throw error;

      toast.success("Customer added successfully");
      navigate("/shoeings-approval-panel?tab=customers");
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add New Customer</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/shoeings-approval-panel?tab=customers")}
        >
          Cancel
        </Button>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Display Name">Display Name</Label>
              <Input id="Display Name" name="Display Name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Company/Horses Name">Company/Horses Name</Label>
              <Input id="Company/Horses Name" name="Company/Horses Name" />
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
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
              <Label htmlFor="Owner Email">Email</Label>
              <Input id="Owner Email" name="Owner Email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Phone">Phone</Label>
              <Input id="Phone" name="Phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Horses">Horses</Label>
              <HorseSelect
                horses={horses}
                selectedHorses={selectedHorses}
                onHorseChange={(selected) => {
                  setSelectedHorses(selected);
                  const input = document.querySelector(
                    'input[name="Horses"]'
                  ) as HTMLInputElement;
                  if (input) {
                    input.value = selected.join(", ");
                  }
                }}
                placeholder="Search and select horses..."
              />
              <Input
                id="Horses"
                name="Horses"
                type="hidden"
                value={selectedHorses.join(", ")}
                readOnly
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="Owner Notes">Notes</Label>
            <Textarea id="Owner Notes" name="Owner Notes" />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shoeings-approval-panel?tab=customers")}
            >
              Cancel
            </Button>
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
