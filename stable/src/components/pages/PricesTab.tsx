import { useState, useEffect } from "react";
import { Trash2, Edit, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

type Product = {
  id: number;
  name: string;
  type: "Service" | "Add-on";
};

type Location = {
  id: number;
  service_location: string;
  location_color: string;
};

type LocationPrice = {
  id: number;
  price: number;
  location_id: number;
  locations?: Location;
};

type ProductWithPrices = Product & {
  location_prices: LocationPrice[];
};

export default function PricesTab() {
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithPrices[]>(
    []
  );
  const [editingProduct, setEditingProduct] =
    useState<ProductWithPrices | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] =
    useState<ProductWithPrices | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLocations();
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("service_location");

    if (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to fetch locations");
    } else {
      setLocations(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("prices")
      .select(
        `
        id,
        name,
        type,
        location_prices (
          id,
          price,
          location_id,
          locations (
            id,
            service_location,
            location_color
          )
        )
      `
      )
      .order("name");

    if (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } else {
      const transformedData: ProductWithPrices[] = data.map((product: any) => ({
        id: product.id,
        name: product.name,
        type: product.type,
        location_prices: product.location_prices.map((lp: any) => ({
          id: lp.id,
          price: lp.price,
          location_id: lp.location_id,
          locations: lp.locations,
        })),
      }));
      setProducts(transformedData);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      // Step 1: Create or update the product
      const productData = {
        name: formData.get("Name") as string,
        type: formData.get("Type") === "Base Service" ? "Service" : "Add-on",
      };

      let productId: number;

      if (editingProduct) {
        const { data, error } = await supabase
          .from("prices")
          .update(productData)
          .eq("id", editingProduct.id)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      } else {
        const { data, error } = await supabase
          .from("prices")
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Step 2: Handle location prices
      if (editingProduct) {
        await supabase
          .from("location_prices")
          .delete()
          .eq("price_id", productId);
      }

      // Create new location prices using location IDs instead of names
      const locationPrices = locations.map((location) => ({
        price_id: productId,
        location_id: location.id,
        price: Number(formData.get(`location-${location.id}`)) || 0,
      }));

      const { error: priceError } = await supabase
        .from("location_prices")
        .insert(locationPrices);

      if (priceError) throw priceError;

      toast.success(editingProduct ? "Product updated" : "Product added");
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(
        error.code === "42501"
          ? "You don't have permission to modify products"
          : "Failed to save product"
      );
    }

    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const deleteProduct = async (name: string) => {
    const { error } = await supabase.from("prices").delete().eq("Name", name);
    if (error) {
      console.error("Error deleting product:", error);
      if (error.code === "42501") {
        // PostgreSQL permission denied error
        toast.error("You don't have permission to delete products");
      } else {
        toast.error("Failed to delete product");
      }
    } else {
      toast.success("Product deleted");
      fetchProducts();
    }
    setDeletingProduct(null);
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: ProductWithPrices) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (product: ProductWithPrices) => {
    setDeletingProduct(product);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const displayType = (type: string) => {
    return type === "Service" ? "Base Service" : type;
  };

  const getLocationPrice = (product: ProductWithPrices, locationId: number) => {
    const locationPrice = product.location_prices?.find(
      (lp) => lp.location_id === locationId
    );
    return locationPrice ? `$${locationPrice.price}` : "$0";
  };

  // Add this helper function to get the default price for a location
  const getDefaultLocationPrice = (
    product: ProductWithPrices | null,
    locationId: number
  ) => {
    if (!product) return 0;
    const locationPrice = product.location_prices.find(
      (lp) => lp.location_id === locationId
    );
    return locationPrice?.price || 0;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Service Admin Panel</h1>
      <div className="flex items-center mb-4">
        <Button
          className="mr-2 hover:bg-black hover:text-white"
          onClick={openAddDialog}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Service
        </Button>
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 bg-white"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.name}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-2xl font-bold">{product.name}</span>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-gray-500 mb-4">
                Type: {displayType(product.type)}
              </p>
              <div className="space-y-1">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex justify-between text-sm"
                  >
                    <span>{location.service_location}:</span>
                    <span>{getLocationPrice(product, location.id)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="Name">Product Name</Label>
              <Input
                id="Name"
                name="Name"
                defaultValue={editingProduct?.name}
                required
              />
            </div>
            <div>
              <Label htmlFor="Type">Product Type</Label>
              <Select
                name="Type"
                defaultValue={editingProduct?.type || "Base Service"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Base Service">Base Service</SelectItem>
                  <SelectItem value="Add-on">Add-on</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {locations.map((location) => (
              <div key={location.id}>
                <Label htmlFor={`location-${location.id}`}>
                  Price in {location.service_location}
                </Label>
                <Input
                  id={`location-${location.id}`}
                  name={`location-${location.id}`}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={getDefaultLocationPrice(
                    editingProduct,
                    location.id
                  )}
                  required
                />
              </div>
            ))}
            <Button className="hover:bg-black hover:text-white" type="submit">
              {editingProduct ? "Update Service" : "Add Service"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingProduct}
        onOpenChange={() => setDeletingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the product "{deletingProduct?.name}
            "?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProduct(deletingProduct!.name)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
