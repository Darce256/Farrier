import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useQueryClient } from "react-query";

export default function NewHorse() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [barnInput, setBarnInput] = useState("");
  const [existingBarns, setExistingBarns] = useState<string[]>([]);
  const [showBarnSuggestions, setShowBarnSuggestions] = useState(false);

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const horseData = Object.fromEntries(formData.entries());

    try {
      const { error } = await supabase.from("horses").insert([horseData]);

      if (error) throw error;

      await queryClient.invalidateQueries("horses");

      toast.success("Horse added successfully");
      navigate("/shoeings-approval-panel?tab=horses");
    } catch (error) {
      console.error("Error adding horse:", error);
      toast.error("Failed to add horse");
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Add New Horse</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Name">Name</Label>
              <Input id="Name" name="Name" required />
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
              <Input id="Owner Email" name="Owner Email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Owner Phone">Owner Phone</Label>
              <Input id="Owner Phone" name="Owner Phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="accepted">
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
              <Input id="alert" name="alert" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shoeings-approval-panel?tab=horses")}
            >
              Cancel
            </Button>
            <Button type="submit">Add Horse</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
