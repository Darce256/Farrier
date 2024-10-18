import { useState, useEffect } from "react";
import { Trash2, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

type Location = {
  id: number;
  service_location: string;
  location_color: string;
};

// Helper function to ensure color is a valid hex color with '#'
const ensureValidColor = (color: string): string => {
  if (!color) return "#000000";
  const normalizedColor = color.toLowerCase().replace(/\s/g, "");
  if (
    normalizedColor.startsWith("#") &&
    /^#[0-9a-f]{6}$/.test(normalizedColor)
  ) {
    return normalizedColor;
  }
  if (/^[0-9a-f]{6}$/.test(normalizedColor)) {
    return `#${normalizedColor}`;
  }
  console.warn(`Invalid color detected: ${color}`);
  return "#000000"; // Default color if invalid
};

export default function LocationsEditor() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState({
    service_location: "",
    location_color: "#000000",
  });
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(
    null
  );

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data, error } = await supabase.from("locations").select("*");
    if (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to fetch locations");
    } else {
      setLocations(
        data.map((loc) => {
          const validColor = ensureValidColor(loc.location_color);
          if (validColor !== loc.location_color) {
            console.warn(
              `Invalid color detected for ${loc.service_location}: ${loc.location_color}`
            );
          }
          return {
            ...loc,
            location_color: validColor,
          };
        }) as Location[]
      );
    }
  };

  const addLocation = async () => {
    if (newLocation.service_location.trim() !== "") {
      const validColor = ensureValidColor(newLocation.location_color);
      const { data, error } = await supabase
        .from("locations")
        .insert([
          {
            service_location: newLocation.service_location,
            location_color: validColor,
          },
        ])
        .select();

      if (error) {
        console.error("Error adding location:", error);
        toast.error("Failed to add location");
      } else {
        setLocations([...locations, data[0] as Location]);
        setNewLocation({ service_location: "", location_color: "#000000" });
        setIsAddDialogOpen(false);
        toast.success("Location added successfully");
      }
    }
  };

  const startEditing = (location: Location) => {
    setEditingLocation({
      ...location,
      location_color: ensureValidColor(location.location_color),
    });
    setIsEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (editingLocation) {
      const validColor = ensureValidColor(editingLocation.location_color);
      const { error } = await supabase
        .from("locations")
        .update({
          service_location: editingLocation.service_location,
          location_color: validColor,
        })
        .eq("id", editingLocation.id);

      if (error) {
        console.error("Error updating location:", error);
        toast.error("Failed to update location");
      } else {
        setLocations(
          locations.map((loc) =>
            loc.id === editingLocation.id
              ? {
                  ...editingLocation,
                  location_color: validColor,
                }
              : loc
          )
        );
        setEditingLocation(null);
        setIsEditDialogOpen(false);
        toast.success("Location updated successfully");
      }
    }
  };

  const startDeleting = (location: Location) => {
    setDeletingLocation(location);
  };

  const confirmDelete = async () => {
    if (deletingLocation) {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", deletingLocation.id);

      if (error) {
        console.error("Error deleting location:", error);
        toast.error("Failed to delete location");
      } else {
        setLocations(locations.filter((loc) => loc.id !== deletingLocation.id));
        toast.success("Location deleted successfully");
      }
      setDeletingLocation(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Location Admin Panel</h1>

      <div className="mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto hover:bg-black hover:text-white">
              <Plus className="mr-2 h-4 w-4" /> Add New Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service_location" className="text-right">
                  Name
                </Label>
                <Input
                  id="service_location"
                  value={newLocation.service_location}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      service_location: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_color" className="text-right">
                  Color
                </Label>
                <Input
                  id="location_color"
                  type="color"
                  value={newLocation.location_color}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      location_color: e.target.value,
                    })
                  }
                  className="col-span-3 h-10 w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="hover:bg-black hover:text-white"
                onClick={addLocation}
              >
                Save Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader className="bg-primary">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.service_location}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{
                        backgroundColor: ensureValidColor(
                          location.location_color
                        ),
                      }}
                    ></div>
                    {ensureValidColor(location.location_color)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog
                      open={
                        isEditDialogOpen && editingLocation?.id === location.id
                      }
                      onOpenChange={setIsEditDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => startEditing(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Location</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="edit-service_location"
                              className="text-right"
                            >
                              Name
                            </Label>
                            <Input
                              id="edit-service_location"
                              value={editingLocation?.service_location || ""}
                              onChange={(e) =>
                                setEditingLocation(
                                  editingLocation
                                    ? {
                                        ...editingLocation,
                                        service_location: e.target.value,
                                      }
                                    : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="edit-location_color"
                              className="text-right"
                            >
                              Color
                            </Label>
                            <Input
                              id="edit-location_color"
                              type="color"
                              value={
                                editingLocation?.location_color || "#000000"
                              }
                              onChange={(e) =>
                                setEditingLocation(
                                  editingLocation
                                    ? {
                                        ...editingLocation,
                                        location_color: e.target.value,
                                      }
                                    : null
                                )
                              }
                              className="col-span-3 h-10 w-full"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={saveEdit}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog
                      open={deletingLocation?.id === location.id}
                      onOpenChange={(open) =>
                        !open && setDeletingLocation(null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => startDeleting(location)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          Are you sure you want to delete the location "
                          {location.service_location}"?
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeletingLocation(null)}
                          >
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="sm:hidden space-y-4">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardHeader>
              <CardTitle>{location.service_location}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: ensureValidColor(
                        location.location_color
                      ),
                    }}
                  ></div>
                  {ensureValidColor(location.location_color)}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Dialog
                  open={isEditDialogOpen && editingLocation?.id === location.id}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(location)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Location</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="edit-service_location-mobile"
                          className="text-right"
                        >
                          Name
                        </Label>
                        <Input
                          id="edit-service_location-mobile"
                          value={editingLocation?.service_location || ""}
                          onChange={(e) =>
                            setEditingLocation(
                              editingLocation
                                ? {
                                    ...editingLocation,
                                    service_location: e.target.value,
                                  }
                                : null
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="edit-location_color-mobile"
                          className="text-right"
                        >
                          Color
                        </Label>
                        <Input
                          id="edit-location_color-mobile"
                          type="color"
                          value={editingLocation?.location_color || "#000000"}
                          onChange={(e) =>
                            setEditingLocation(
                              editingLocation
                                ? {
                                    ...editingLocation,
                                    location_color: e.target.value,
                                  }
                                : null
                            )
                          }
                          className="col-span-3 h-10 w-full"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveEdit}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={deletingLocation?.id === location.id}
                  onOpenChange={(open) => !open && setDeletingLocation(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startDeleting(location)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      Are you sure you want to delete the location "
                      {location.service_location}"?
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeletingLocation(null)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={confirmDelete}>
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
