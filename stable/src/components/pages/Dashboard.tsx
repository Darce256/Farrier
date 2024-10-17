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
import { useAuth } from "@/components/Contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import TopSellingServicesChart from "@/components/ui/TopSellingServicesChart";
import TopSellingAddonsChart from "@/components/ui/TopSellingAddonsChart";
import LocationRevenueChart from "../ui/LocationRevenueChart";

interface Shoeing {
  "Base Service": string;
  "Front Add-On's": string;
  "Hind Add-On's": string;
  "Cost of Service": string;
  "Cost of Front Add-Ons": string;
  "Cost of Hind Add-Ons": string;
  "Date of Service": string;
  "Location of Service": string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingShoeingsCount, setPendingShoeingsCount] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [weeklyRevenueChange, setWeeklyRevenueChange] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyRevenueChange] = useState(0);
  const [allShoeings, setAllShoeings] = useState<Shoeing[]>([]);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/horses");
    } else {
      fetchPendingShoeingsCount();
      fetchAllShoeings();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (allShoeings.length > 0) {
      calculateWeeklyRevenue();
      calculateMonthlyRevenue();
    }
  }, [allShoeings]);

  async function fetchAllShoeings() {
    let allShoeings: Shoeing[] = [];
    let page = 0;
    const pageSize = 1000; // Supabase's maximum page size
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("shoeings")
        .select(
          '"Base Service", "Front Add-On\'s", "Hind Add-On\'s", "Cost of Service", "Cost of Front Add-Ons", "Cost of Hind Add-Ons", "Date of Service", "Location of Service"'
        )
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("Error fetching shoeings:", error);
        break;
      }

      if (data) {
        allShoeings = [...allShoeings, ...data];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log("Total shoeings fetched:", allShoeings.length);

    // Filter out any entries with null Date of Service
    const validShoeings = allShoeings.filter(
      (shoeing) => shoeing["Date of Service"] != null
    );

    if (validShoeings.length < allShoeings.length) {
      console.warn(
        `Filtered out ${
          allShoeings.length - validShoeings.length
        } shoeings with null Date of Service`
      );
    }

    console.log("Valid shoeings:", validShoeings);

    setAllShoeings(validShoeings);
  }

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

  function calculateWeeklyRevenue() {
    const today = new Date();
    const sevenDaysAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 7
    );

    console.log(
      "Calculating revenue from",
      sevenDaysAgo.toDateString(),
      "to",
      today.toDateString()
    );
    console.log("Total shoeings:", allShoeings.length);

    const thisWeekRevenue = allShoeings.reduce((sum, shoeing, index) => {
      const dateOfService = shoeing["Date of Service"];
      const costString = shoeing["Cost of Service"];

      if (!dateOfService || !costString) {
        return sum;
      }

      const [month, day, year] = dateOfService.split("/");
      const shoeingDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      // Set time to midnight for comparison
      const shoeingDateMidnight = new Date(
        shoeingDate.getFullYear(),
        shoeingDate.getMonth(),
        shoeingDate.getDate()
      );
      const sevenDaysAgoMidnight = new Date(
        sevenDaysAgo.getFullYear(),
        sevenDaysAgo.getMonth(),
        sevenDaysAgo.getDate()
      );
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (
        shoeingDateMidnight >= sevenDaysAgoMidnight &&
        shoeingDateMidnight <= todayMidnight
      ) {
        const cost = parseFloat(costString.replace("$", "").trim());
        if (!isNaN(cost)) {
          console.log(
            `Including shoeing ${index}:`,
            dateOfService,
            costString,
            cost
          );
          return sum + cost;
        }
      }
      return sum;
    }, 0);

    console.log("This week revenue:", thisWeekRevenue);

    // Calculate last week's revenue similarly
    const twoWeeksAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 14
    );
    const lastWeekRevenue = allShoeings.reduce((sum, shoeing) => {
      const dateOfService = shoeing["Date of Service"];
      const costString = shoeing["Cost of Service"];

      if (!dateOfService || !costString) return sum;

      const [month, day, year] = dateOfService.split("/");
      const shoeingDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      // Set time to midnight for comparison
      const shoeingDateMidnight = new Date(
        shoeingDate.getFullYear(),
        shoeingDate.getMonth(),
        shoeingDate.getDate()
      );
      const twoWeeksAgoMidnight = new Date(
        twoWeeksAgo.getFullYear(),
        twoWeeksAgo.getMonth(),
        twoWeeksAgo.getDate()
      );
      const sevenDaysAgoMidnight = new Date(
        sevenDaysAgo.getFullYear(),
        sevenDaysAgo.getMonth(),
        sevenDaysAgo.getDate()
      );

      if (
        shoeingDateMidnight >= twoWeeksAgoMidnight &&
        shoeingDateMidnight < sevenDaysAgoMidnight
      ) {
        const cost = parseFloat(costString.replace("$", "").trim());
        return isNaN(cost) ? sum : sum + cost;
      }
      return sum;
    }, 0);

    console.log("Last week revenue:", lastWeekRevenue);

    setWeeklyRevenue(thisWeekRevenue);
    setWeeklyRevenueChange(
      lastWeekRevenue !== 0
        ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
        : 0
    );
  }

  function calculateMonthlyRevenue() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    console.log(
      "Calculating monthly revenue from",
      firstDayOfMonth.toDateString(),
      "to",
      today.toDateString()
    );
    console.log("Total shoeings:", allShoeings.length);

    let includedCount = 0;
    const thisMonthRevenue = allShoeings.reduce((sum, shoeing, index) => {
      const dateOfService = shoeing["Date of Service"];
      const costString = shoeing["Cost of Service"];

      if (!dateOfService || !costString) {
        return sum;
      }

      const [month, day, year] = dateOfService.split("/");
      const shoeingDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      // Set time to midnight for comparison
      const shoeingDateMidnight = new Date(
        shoeingDate.getFullYear(),
        shoeingDate.getMonth(),
        shoeingDate.getDate()
      );

      if (
        shoeingDateMidnight >= firstDayOfMonth &&
        shoeingDateMidnight <= today
      ) {
        const cost = parseFloat(costString.replace("$", "").trim());
        if (!isNaN(cost)) {
          console.log(
            `Including shoeing ${index}:`,
            dateOfService,
            costString,
            cost
          );
          includedCount++;
          return sum + cost;
        }
      }
      return sum;
    }, 0);

    console.log("This month revenue:", thisMonthRevenue);
    console.log("Included shoeings count:", includedCount);

    setMonthlyRevenue(thisMonthRevenue);
    // ... rest of the function
  }

  // Only render the dashboard content if the user is an admin
  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        <div className="grid gap-4 md:gap-8 mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Week</CardDescription>
                <CardTitle className="text-4xl">
                  ${weeklyRevenue.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {weeklyRevenueChange >= 0 ? "+" : ""}
                  {weeklyRevenueChange.toFixed(2)}% from last week
                </div>
              </CardContent>
              <CardFooter>
                <Progress
                  value={Math.abs(weeklyRevenueChange)}
                  aria-label={`${Math.abs(weeklyRevenueChange)}% change`}
                />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month</CardDescription>
                <CardTitle className="text-4xl">
                  ${monthlyRevenue.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {monthlyRevenueChange >= 0 ? "+" : ""}
                  {monthlyRevenueChange.toFixed(2)}% from last month
                </div>
              </CardContent>
              <CardFooter>
                <Progress
                  value={Math.abs(monthlyRevenueChange)}
                  aria-label={`${Math.abs(monthlyRevenueChange)}% change`}
                />
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                      <TableHead className="text-md text-gray-400">
                        Sales
                      </TableHead>
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
      </div>

      {/* Charts at the bottom */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Sales Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          <div className="w-full">
            <TopSellingServicesChart allShoeings={allShoeings} />
          </div>
          <div className="w-full">
            <TopSellingAddonsChart allShoeings={allShoeings as any} />
          </div>
          <div className="w-full">
            <LocationRevenueChart allShoeings={allShoeings as any} />
          </div>
        </div>
      </div>
    </div>
  );
}
