import { useState, useEffect } from "react";
import { Trash2, Edit, Plus } from "lucide-react";
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
  Name: string;
  Type: "Base Service" | "Add-on";
  [key: string]: string | number | null;
};

const LOCATIONS = [
  "Home Barns",
  "Austin Barns",
  "White Fox Manor",
  "Sherwood Sporthorses",
  "Other Travel",
  "Michigan",
  "Wellington",
  "Kentucky",
  "Ocala",
  "Pennsylvania",
  "Gulf Port",
  "Katy",
];

export default function PricesTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("prices").select("*");
    if (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } else {
      setProducts(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      Name: formData.get("Name") as string,
      Type: formData.get("Type") as "Base Service" | "Add-on",
    };

    LOCATIONS.forEach((location) => {
      const price = Math.max(
        0,
        Math.floor(Number(formData.get(location)) || 0)
      );
      newProduct[location] = `$${price}`; // Add "$" prefix to the price
    });

    if (editingProduct) {
      const { error } = await supabase
        .from("prices")
        .update(newProduct)
        .eq("Name", editingProduct.Name);
      if (error) {
        console.error("Error updating product:", error);
        if (error.code === "42501") {
          // PostgreSQL permission denied error
          toast.error("You don't have permission to update products");
        } else {
          toast.error("Failed to update product");
        }
      } else {
        toast.success("Product updated");
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("prices").insert(newProduct);
      if (error) {
        console.error("Error adding product:", error);
        if (error.code === "42501") {
          // PostgreSQL permission denied error
          toast.error("You don't have permission to add products");
        } else {
          toast.error("Failed to add product");
        }
      } else {
        toast.success("Product added");
        fetchProducts();
      }
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

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Product Admin Panel</h1>
      <Button className="mt-2 mb-4" onClick={openAddDialog}>
        <Plus className="mr-2 h-4 w-4" /> Add New Product
      </Button>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.Name}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{product.Name}</span>
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
                Type: {product.Type}
              </p>
              <div className="space-y-1">
                {LOCATIONS.map((location) => (
                  <div key={location} className="flex justify-between text-sm">
                    <span>{location}:</span>
                    <span>{product[location] || "$0"}</span>
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
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="Name">Product Name</Label>
              <Input
                id="Name"
                name="Name"
                defaultValue={editingProduct?.Name}
                required
              />
            </div>
            <div>
              <Label htmlFor="Type">Product Type</Label>
              <Select
                name="Type"
                defaultValue={editingProduct?.Type || "Base Service"}
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
            {LOCATIONS.map((location) => (
              <div key={location}>
                <Label htmlFor={location}>Price in {location}</Label>
                <Input
                  id={location}
                  name={location}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={Math.floor(
                    Number(
                      editingProduct?.[location]?.toString().replace("$", "")
                    ) || 0
                  )}
                  required
                />
              </div>
            ))}
            <Button type="submit">
              {editingProduct ? "Update Product" : "Add Product"}
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
            Are you sure you want to delete the product "{deletingProduct?.Name}
            "?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProduct(deletingProduct!.Name)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
