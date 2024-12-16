import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Horse {
  id: string;
  Name: string;
  Customers: string | null;
  "Barn / Trainer": string | null;
  "Owner Email": string | null;
  "Owner Phone": string | null;
  History: string | null;
  "Horse Notes History": string | null;
  "Note w/ Time Stamps (from History)": string | null;
  status: string;
  alert: string | null;
}

export default function EditHorse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [horse, setHorse] = useState<Horse | null>(null);
  const isNewHorse = !id;

  useEffect(() => {
    const fetchHorse = async () => {
      if (isNewHorse) {
        setHorse({
          id: "",
          Name: "",
          Customers: null,
          "Barn / Trainer": null,
          "Owner Email": null,
          "Owner Phone": null,
          History: null,
          "Horse Notes History": null,
          "Note w/ Time Stamps (from History)": null,
          status: "active",
          alert: null,
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("horses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setHorse(data);
      } catch (error) {
        console.error("Error fetching horse:", error);
        toast.error("Failed to fetch horse details");
      } finally {
        setLoading(false);
      }
    };

    fetchHorse();
  }, [id, isNewHorse]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const horseData = Object.fromEntries(formData.entries());

      if (isNewHorse) {
        const { error } = await supabase.from("horses").insert([horseData]);
        if (error) throw error;
        toast.success("Horse created successfully");
      } else {
        const { error } = await supabase
          .from("horses")
          .update(horseData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Horse updated successfully");
      }

      navigate("/shoeings-approval-panel?tab=horses");
    } catch (error) {
      console.error("Error saving horse:", error);
      toast.error(`Failed to ${isNewHorse ? "create" : "update"} horse`);
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

  if (!horse && !isNewHorse) {
    return <div>Horse not found</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isNewHorse ? "New Horse" : "Edit Horse"}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate("/shoeings-approval-panel?tab=horses")}
        >
          Cancel
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
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
            <Input
              id="Barn / Trainer"
              name="Barn / Trainer"
              defaultValue={horse?.["Barn / Trainer"] || ""}
            />
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
            <Label htmlFor="Customers">Customers</Label>
            <Input
              id="Customers"
              name="Customers"
              defaultValue={horse?.Customers || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={horse?.status || "active"}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="alert">Alert</Label>
          <Input id="alert" name="alert" defaultValue={horse?.alert || ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="History">History</Label>
          <Textarea
            id="History"
            name="History"
            defaultValue={horse?.History || ""}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Horse Notes History">Horse Notes History</Label>
          <Textarea
            id="Horse Notes History"
            name="Horse Notes History"
            defaultValue={horse?.["Horse Notes History"] || ""}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Note w/ Time Stamps (from History)">
            Notes with Timestamps
          </Label>
          <Textarea
            id="Note w/ Time Stamps (from History)"
            name="Note w/ Time Stamps (from History)"
            defaultValue={horse?.["Note w/ Time Stamps (from History)"] || ""}
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-4">
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
                {isNewHorse ? "Creating..." : "Saving..."}
              </>
            ) : isNewHorse ? (
              "Create Horse"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
