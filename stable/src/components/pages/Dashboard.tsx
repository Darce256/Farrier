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
import TopProductsChart from "@/components/ui/TopProductsChart";

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

interface TopProduct {
  name: string;
  revenue: number;
  percentage: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingShoeingsCount, setPendingShoeingsCount] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [, setWeeklyRevenueChange] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyRevenueChange, setMonthlyRevenueChange] = useState(0);
  const [allShoeings, setAllShoeings] = useState<Shoeing[]>([]);
  const [past7DaysRevenue, setPast7DaysRevenue] = useState(0);
  const [past7DaysRevenueChange, setPast7DaysRevenueChange] = useState(0);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState(0);
  const [quarterlyRevenueChange, setQuarterlyRevenueChange] = useState(0);
  const [, setTopProducts] = useState<TopProduct[]>([]);

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
      calculatePast7DaysRevenue();
      calculateQuarterlyRevenue();
      setTopProducts(calculateTopProducts());
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
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );

    console.log(
      "Calculating revenue from",
      startOfWeek.toDateString(),
      "to",
      today.toDateString()
    );
    console.log("Total shoeings:", allShoeings.length);

    let includedCount = 0;
    const thisWeekRevenue = allShoeings.reduce((sum, shoeing, _index) => {
      const dateOfService = shoeing["Date of Service"];
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (!dateOfService || !baseCostString) {
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
      const startOfWeekMidnight = new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate()
      );
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (
        shoeingDateMidnight >= startOfWeekMidnight &&
        shoeingDateMidnight <= todayMidnight
      ) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        const frontAddOnCost = frontAddOnCostString
          ? parseFloat(frontAddOnCostString.replace("$", "").trim())
          : 0;
        const hindAddOnCost = hindAddOnCostString
          ? parseFloat(hindAddOnCostString.replace("$", "").trim())
          : 0;

        const totalCost = baseCost + frontAddOnCost + hindAddOnCost;

        if (!isNaN(totalCost)) {
          includedCount++;
          return sum + totalCost;
        } else {
        }
      } else {
      }
      return sum;
    }, 0);

    console.log("This week revenue:", thisWeekRevenue);
    console.log("Included shoeings count:", includedCount);

    setWeeklyRevenue(thisWeekRevenue);
    setWeeklyRevenueChange(
      ((thisWeekRevenue - weeklyRevenue) / weeklyRevenue) * 100
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
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (!dateOfService || !baseCostString) {
        console.warn("Invalid shoeing entry:", shoeing);
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
      const firstDayOfMonthMidnight = new Date(
        firstDayOfMonth.getFullYear(),
        firstDayOfMonth.getMonth(),
        firstDayOfMonth.getDate()
      );
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (
        shoeingDateMidnight >= firstDayOfMonthMidnight &&
        shoeingDateMidnight <= todayMidnight
      ) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        const frontAddOnCost = frontAddOnCostString
          ? parseFloat(frontAddOnCostString.replace("$", "").trim())
          : 0;
        const hindAddOnCost = hindAddOnCostString
          ? parseFloat(hindAddOnCostString.replace("$", "").trim())
          : 0;

        const totalCost = baseCost + frontAddOnCost + hindAddOnCost;

        if (!isNaN(totalCost)) {
          console.log(
            `Including shoeing ${index}:`,
            dateOfService,
            "Base:",
            baseCost,
            "Front:",
            frontAddOnCost,
            "Hind:",
            hindAddOnCost,
            "Total:",
            totalCost
          );
          includedCount++;
          return sum + totalCost;
        } else {
          console.warn(
            `Invalid cost for shoeing ${index}:`,
            baseCostString,
            frontAddOnCostString,
            hindAddOnCostString
          );
        }
      } else {
        console.log(
          `Excluding shoeing ${index}:`,
          dateOfService,
          "outside date range"
        );
      }
      return sum;
    }, 0);

    console.log("This month revenue:", thisMonthRevenue);
    console.log("Included shoeings count:", includedCount);

    setMonthlyRevenue(thisMonthRevenue);

    // Calculate last month's revenue for comparison
    const firstDayOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const lastDayOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );
    const lastMonthRevenue = allShoeings.reduce((sum, shoeing) => {
      const dateOfService = shoeing["Date of Service"];
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (!dateOfService || !baseCostString) return sum;

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
      const firstDayOfLastMonthMidnight = new Date(
        firstDayOfLastMonth.getFullYear(),
        firstDayOfLastMonth.getMonth(),
        firstDayOfLastMonth.getDate()
      );
      const lastDayOfLastMonthMidnight = new Date(
        lastDayOfLastMonth.getFullYear(),
        lastDayOfLastMonth.getMonth(),
        lastDayOfLastMonth.getDate()
      );

      if (
        shoeingDateMidnight >= firstDayOfLastMonthMidnight &&
        shoeingDateMidnight <= lastDayOfLastMonthMidnight
      ) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        const frontAddOnCost = frontAddOnCostString
          ? parseFloat(frontAddOnCostString.replace("$", "").trim())
          : 0;
        const hindAddOnCost = hindAddOnCostString
          ? parseFloat(hindAddOnCostString.replace("$", "").trim())
          : 0;

        const totalCost = baseCost + frontAddOnCost + hindAddOnCost;
        return isNaN(totalCost) ? sum : sum + totalCost;
      }
      return sum;
    }, 0);

    console.log("Last month revenue:", lastMonthRevenue);

    setMonthlyRevenueChange(
      lastMonthRevenue !== 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0
    );
  }

  function calculatePast7DaysRevenue() {
    const today = new Date();
    const sevenDaysAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 6
    ); // -6 because we want to include today

    console.log(
      "Calculating revenue from",
      sevenDaysAgo.toDateString(),
      "to",
      today.toDateString()
    );
    console.log("Total shoeings:", allShoeings.length);

    let includedCount = 0;
    const past7DaysRevenue = allShoeings.reduce((sum, shoeing, index) => {
      const dateOfService = shoeing["Date of Service"];
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (!dateOfService || !baseCostString) {
        console.warn("Invalid shoeing entry:", shoeing);
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
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        const frontAddOnCost = frontAddOnCostString
          ? parseFloat(frontAddOnCostString.replace("$", "").trim())
          : 0;
        const hindAddOnCost = hindAddOnCostString
          ? parseFloat(hindAddOnCostString.replace("$", "").trim())
          : 0;

        const totalCost = baseCost + frontAddOnCost + hindAddOnCost;

        if (!isNaN(totalCost)) {
          console.log(
            `Including shoeing ${index}:`,
            dateOfService,
            "Base:",
            baseCost,
            "Front:",
            frontAddOnCost,
            "Hind:",
            hindAddOnCost,
            "Total:",
            totalCost
          );
          includedCount++;
          return sum + totalCost;
        } else {
          console.warn(
            `Invalid cost for shoeing ${index}:`,
            baseCostString,
            frontAddOnCostString,
            hindAddOnCostString
          );
        }
      } else {
        console.log(
          `Excluding shoeing ${index}:`,
          dateOfService,
          "outside date range"
        );
      }
      return sum;
    }, 0);

    console.log("Past 7 days revenue:", past7DaysRevenue);
    console.log("Included shoeings count:", includedCount);

    setPast7DaysRevenue(past7DaysRevenue);

    // Calculate previous 7 days revenue for comparison
    const fourteenDaysAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 13
    );
    const previous7DaysRevenue = allShoeings.reduce((sum, shoeing) => {
      const dateOfService = shoeing["Date of Service"];
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (!dateOfService || !baseCostString) return sum;

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
      const fourteenDaysAgoMidnight = new Date(
        fourteenDaysAgo.getFullYear(),
        fourteenDaysAgo.getMonth(),
        fourteenDaysAgo.getDate()
      );
      const sevenDaysAgoMidnight = new Date(
        sevenDaysAgo.getFullYear(),
        sevenDaysAgo.getMonth(),
        sevenDaysAgo.getDate()
      );

      if (
        shoeingDateMidnight >= fourteenDaysAgoMidnight &&
        shoeingDateMidnight < sevenDaysAgoMidnight
      ) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        const frontAddOnCost = frontAddOnCostString
          ? parseFloat(frontAddOnCostString.replace("$", "").trim())
          : 0;
        const hindAddOnCost = hindAddOnCostString
          ? parseFloat(hindAddOnCostString.replace("$", "").trim())
          : 0;

        const totalCost = baseCost + frontAddOnCost + hindAddOnCost;

        if (!isNaN(totalCost)) {
          return sum + totalCost;
        } else {
        }
      }
      return sum;
    }, 0);

    console.log("Previous 7 days revenue:", previous7DaysRevenue);
    console.log("Included shoeings count:", includedCount);

    setPast7DaysRevenueChange(
      previous7DaysRevenue !== 0
        ? ((past7DaysRevenue - previous7DaysRevenue) / previous7DaysRevenue) *
            100
        : 0
    );
  }

  function calculateQuarterlyRevenue() {
    const today = new Date();
    const currentQuarter = Math.floor(today.getMonth() / 3);
    const firstDayOfQuarter = new Date(
      today.getFullYear(),
      currentQuarter * 3,
      1
    );

    console.log(
      "Calculating quarterly revenue from",
      firstDayOfQuarter.toDateString(),
      "to",
      today.toDateString()
    );
    console.log("Total shoeings:", allShoeings.length);

    let includedCount = 0;
    const thisQuarterRevenue = allShoeings.reduce((sum, shoeing, index) => {
      const dateOfService = shoeing["Date of Service"];
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (!dateOfService || !baseCostString) {
        console.warn("Invalid shoeing entry:", shoeing);
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
      const firstDayOfQuarterMidnight = new Date(
        firstDayOfQuarter.getFullYear(),
        firstDayOfQuarter.getMonth(),
        firstDayOfQuarter.getDate()
      );
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (
        shoeingDateMidnight >= firstDayOfQuarterMidnight &&
        shoeingDateMidnight <= todayMidnight
      ) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        const frontAddOnCost = frontAddOnCostString
          ? parseFloat(frontAddOnCostString.replace("$", "").trim())
          : 0;
        const hindAddOnCost = hindAddOnCostString
          ? parseFloat(hindAddOnCostString.replace("$", "").trim())
          : 0;

        const totalCost = baseCost + frontAddOnCost + hindAddOnCost;

        if (!isNaN(totalCost)) {
          console.log(
            `Including shoeing ${index}:`,
            dateOfService,
            "Base:",
            baseCost,
            "Front:",
            frontAddOnCost,
            "Hind:",
            hindAddOnCost,
            "Total:",
            totalCost
          );
          includedCount++;
          return sum + totalCost;
        } else {
          console.warn(
            `Invalid cost for shoeing ${index}:`,
            baseCostString,
            frontAddOnCostString,
            hindAddOnCostString
          );
        }
      } else {
        console.log(
          `Excluding shoeing ${index}:`,
          dateOfService,
          "outside date range"
        );
      }
      return sum;
    }, 0);

    console.log("This quarter revenue:", thisQuarterRevenue);
    console.log("Included shoeings count:", includedCount);

    setQuarterlyRevenue(thisQuarterRevenue);

    // Calculate last quarter's revenue for comparison
    const lastQuarterFirstDay = new Date(
      today.getFullYear(),
      (currentQuarter - 1) * 3,
      1
    );
    const lastQuarterLastDay = new Date(firstDayOfQuarter.getTime() - 1);
    const lastQuarterRevenue = allShoeings.reduce((sum, shoeing) => {
      const dateOfService = shoeing["Date of Service"];
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (!dateOfService || !baseCostString) return sum;

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
      const lastQuarterFirstDayMidnight = new Date(
        lastQuarterFirstDay.getFullYear(),
        lastQuarterFirstDay.getMonth(),
        lastQuarterFirstDay.getDate()
      );
      const lastQuarterLastDayMidnight = new Date(
        lastQuarterLastDay.getFullYear(),
        lastQuarterLastDay.getMonth(),
        lastQuarterLastDay.getDate()
      );

      if (
        shoeingDateMidnight >= lastQuarterFirstDayMidnight &&
        shoeingDateMidnight <= lastQuarterLastDayMidnight
      ) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        const frontAddOnCost = frontAddOnCostString
          ? parseFloat(frontAddOnCostString.replace("$", "").trim())
          : 0;
        const hindAddOnCost = hindAddOnCostString
          ? parseFloat(hindAddOnCostString.replace("$", "").trim())
          : 0;

        const totalCost = baseCost + frontAddOnCost + hindAddOnCost;
        return isNaN(totalCost) ? sum : sum + totalCost;
      }
      return sum;
    }, 0);

    console.log("Last quarter revenue:", lastQuarterRevenue);

    setQuarterlyRevenueChange(
      lastQuarterRevenue !== 0
        ? ((thisQuarterRevenue - lastQuarterRevenue) / lastQuarterRevenue) * 100
        : 0
    );
  }

  function calculateTopProducts(): TopProduct[] {
    const productMap = new Map<string, number>();
    let totalRevenue = 0;

    allShoeings.forEach((shoeing) => {
      const baseService = shoeing["Base Service"];
      const baseCostString = shoeing["Cost of Service"];

      if (baseService && baseCostString) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        if (!isNaN(baseCost)) {
          productMap.set(
            baseService,
            (productMap.get(baseService) || 0) + baseCost
          );
          totalRevenue += baseCost;
        }
      }

      const frontAddOns = shoeing["Front Add-On's"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];

      if (frontAddOns && frontAddOnCostString) {
        const frontAddOnCost = parseFloat(
          frontAddOnCostString.replace("$", "").trim()
        );
        if (!isNaN(frontAddOnCost)) {
          productMap.set(
            frontAddOns,
            (productMap.get(frontAddOns) || 0) + frontAddOnCost
          );
          totalRevenue += frontAddOnCost;
        }
      }

      const hindAddOns = shoeing["Hind Add-On's"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (hindAddOns && hindAddOnCostString) {
        const hindAddOnCost = parseFloat(
          hindAddOnCostString.replace("$", "").trim()
        );
        if (!isNaN(hindAddOnCost)) {
          productMap.set(
            hindAddOns,
            (productMap.get(hindAddOns) || 0) + hindAddOnCost
          );
          totalRevenue += hindAddOnCost;
        }
      }
    });

    const sortedProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage: (revenue / totalRevenue) * 100,
      }));

    return sortedProducts;
  }

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
                <CardDescription>Past 7 Days</CardDescription>
                <CardTitle className="text-4xl">
                  {formatCurrency(past7DaysRevenue)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {past7DaysRevenueChange >= 0 ? "+" : ""}
                  {past7DaysRevenueChange.toFixed(2)}% from previous 7 days
                </div>
              </CardContent>
              <CardFooter>
                <Progress
                  value={Math.abs(past7DaysRevenueChange)}
                  aria-label={`${Math.abs(past7DaysRevenueChange)}% change`}
                />
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month</CardDescription>
                <CardTitle className="text-4xl">
                  {formatCurrency(monthlyRevenue)}
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
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Quarter</CardDescription>
                <CardTitle className="text-4xl">
                  {formatCurrency(quarterlyRevenue)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {quarterlyRevenueChange >= 0 ? "+" : ""}
                  {quarterlyRevenueChange.toFixed(2)}% from last quarter
                </div>
              </CardContent>
              <CardFooter>
                <Progress
                  value={Math.abs(quarterlyRevenueChange)}
                  aria-label={`${Math.abs(quarterlyRevenueChange)}% change`}
                />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TopProductsChart allShoeings={allShoeings} />

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
          <LocationRevenueChart allShoeings={allShoeings} />
          <div className="w-full">
            <TopSellingServicesChart allShoeings={allShoeings} />
          </div>
          <div className="w-full">
            <TopSellingAddonsChart allShoeings={allShoeings as any} />
          </div>
        </div>
      </div>
    </div>
  );
}
