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

export default function Dashboard() {
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
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-4xl">3.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +1.2% from last month
            </div>
          </CardContent>
          <CardFooter>
            <Progress value={12} aria-label="12% increase" />
          </CardFooter>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
        <Card x-chunk="dashboard-01-chunk-4">
          <CardHeader className="pb-2">
            <CardDescription>Top Products</CardDescription>
            <CardTitle className="text-4xl">Laser Lemonade Machine</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Laser Lemonade Machine</div>
                  </TableCell>
                  <TableCell>25</TableCell>
                  <TableCell>$499.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Hypernova Headphones</div>
                  </TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>$129.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">AeroGlow Desk Lamp</div>
                  </TableCell>
                  <TableCell>50</TableCell>
                  <TableCell>$39.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Gamer Gear Pro Controller</div>
                  </TableCell>
                  <TableCell>75</TableCell>
                  <TableCell>$59.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Luminous VR Headset</div>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
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
