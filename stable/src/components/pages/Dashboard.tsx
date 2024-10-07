import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [pendingShoeingsCount, setPendingShoeingsCount] = useState(0);

  useEffect(() => {
    fetchPendingShoeingsCount();
  }, []);

  async function fetchPendingShoeingsCount() {
    const { count, error } = await supabase
      .from("shoeings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching pending shoeings count:", error);
    } else {
      setPendingShoeingsCount(count || 0);
    }
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="pb-2">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-4xl">$1,329</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +25% from last week
            </div>
          </CardContent>
          <CardFooter>
            <Progress value={25} aria-label="25% increase" />
          </CardFooter>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-4xl">$5,329</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +10% from last month
            </div>
          </CardContent>
          <CardFooter>
            <Progress value={12} aria-label="12% increase" />
          </CardFooter>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="pb-2">
            <CardDescription>New Customers</CardDescription>
            <CardTitle className="text-4xl">+250</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +15% from last month
            </div>
          </CardContent>
          <CardFooter>
            <Progress value={15} aria-label="15% increase" />
          </CardFooter>
        </Card>
        <Card x-chunk="dashboard-01-chunk-3">
          <CardHeader className="pb-2">
            <CardDescription>Shoeing Approvals</CardDescription>
            <CardTitle className="text-4xl">
              {pendingShoeingsCount} Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Review and approve new shoeing submissions.
            </div>
          </CardContent>
          <CardFooter>
            <Link to={"/shoeings-approval-panel"} className="text-primary">
              Go to Shoeing Approvals
            </Link>
          </CardFooter>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
        <Card x-chunk="dashboard-01-chunk-4">
          <CardHeader className="pb-2">
            <CardDescription>Top Products</CardDescription>
            <CardTitle className="text-4xl ">Full Shoeing</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="">
                  <TableHead className="text-md text-gray-400">
                    Product
                  </TableHead>
                  <TableHead className="text-md text-gray-400">Sales</TableHead>
                  <TableHead className="text-md text-gray-400">
                    Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Full Shoeing</div>
                  </TableCell>
                  <TableCell>25</TableCell>
                  <TableCell>$499.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Horse Spaghetti</div>
                  </TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>$129.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Glue Sticks</div>
                  </TableCell>
                  <TableCell>50</TableCell>
                  <TableCell>$39.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Cowboy Hats</div>
                  </TableCell>
                  <TableCell>75</TableCell>
                  <TableCell>$59.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Ponytail Extensions</div>
                  </TableCell>
                  <TableCell>30</TableCell>
                  <TableCell>$199.99</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader className="pb-2">
            <CardDescription>Top Customers</CardDescription>
            <CardTitle className="text-4xl">John Doe</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-md text-gray-400">
                    Customer
                  </TableHead>
                  <TableHead className="text-md text-gray-400">
                    Orders
                  </TableHead>
                  <TableHead className="text-md text-gray-400">
                    Total Spend
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">John Doe</div>
                  </TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>$1,299.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Jane Smith</div>
                  </TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>$899.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Sam Wilson</div>
                  </TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>$1,199.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Chris Evans</div>
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>$499.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Natasha Romanoff</div>
                  </TableCell>
                  <TableCell>6</TableCell>
                  <TableCell>$1,599.99</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
