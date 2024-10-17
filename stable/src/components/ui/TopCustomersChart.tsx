import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerWithPresets } from "@/components/ui/date-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface TopCustomer {
  name: string;
  revenue: number;
  percentage: number;
}

interface Shoeing {
  "QB Customers": string;
  "Cost of Service": string;
  "Cost of Front Add-Ons": string;
  "Cost of Hind Add-Ons": string;
  "Date of Service": string;
}

interface Props {
  allShoeings: Shoeing[];
}

export default function TopCustomersChart({ allShoeings }: Props) {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [dateRange, setDateRange] = useState<
    { from: string | null; to: string | null } | undefined
  >(undefined);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  useEffect(() => {
    if (allShoeings.length > 0) {
      calculateTopCustomers();
    }
  }, [dateRange, allShoeings]);

  function calculateTopCustomers() {
    let filteredShoeings = allShoeings;

    if (dateRange?.from && dateRange?.to) {
      const fromDate = startOfDay(new Date(dateRange.from));
      const toDate = endOfDay(new Date(dateRange.to));

      filteredShoeings = allShoeings.filter((shoeing) => {
        const [month, day, year] = shoeing["Date of Service"].split("/");
        const shoeingDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        return isWithinInterval(shoeingDate, { start: fromDate, end: toDate });
      });
    }

    const customerMap = new Map<string, number>();
    let totalRev = 0;

    filteredShoeings.forEach((shoeing) => {
      const customer = shoeing["QB Customers"];
      const baseCostString = shoeing["Cost of Service"];
      const frontAddOnCostString = shoeing["Cost of Front Add-Ons"];
      const hindAddOnCostString = shoeing["Cost of Hind Add-Ons"];

      if (customer) {
        let totalCost = 0;

        if (baseCostString) {
          const baseCost = parseFloat(baseCostString.replace("$", "").trim());
          if (!isNaN(baseCost)) totalCost += baseCost;
        }

        if (frontAddOnCostString) {
          const frontAddOnCost = parseFloat(
            frontAddOnCostString.replace("$", "").trim()
          );
          if (!isNaN(frontAddOnCost)) totalCost += frontAddOnCost;
        }

        if (hindAddOnCostString) {
          const hindAddOnCost = parseFloat(
            hindAddOnCostString.replace("$", "").trim()
          );
          if (!isNaN(hindAddOnCost)) totalCost += hindAddOnCost;
        }

        customerMap.set(customer, (customerMap.get(customer) || 0) + totalCost);
        totalRev += totalCost;
      }
    });

    setTotalRevenue(totalRev);

    const sortedCustomers = Array.from(customerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage: (revenue / totalRev) * 100,
      }));

    setTopCustomers(sortedCustomers);
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="w-full col-span-1">
      <CardHeader className="pb-2">
        <CardTitle>Top Customers</CardTitle>
        <CardDescription>Highest revenue generating customers</CardDescription>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <DatePickerWithPresets
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          <div className="text-sm font-semibold">
            Total Revenue: {formatCurrency(totalRevenue)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {topCustomers.length > 0 && (
          <>
            <div className="mb-4 mt-4">
              <CardTitle className="text-4xl">{topCustomers[0].name}</CardTitle>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(topCustomers[0].revenue)} (
                {topCustomers[0].percentage.toFixed(2)}% of total revenue)
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-md text-gray-400">
                    Customer
                  </TableHead>
                  <TableHead className="text-md text-gray-400">
                    Revenue
                  </TableHead>
                  <TableHead className="text-md text-gray-400">
                    Percentage
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className={index === 0 ? "font-medium" : ""}>
                        {customer.name}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(customer.revenue)}</TableCell>
                    <TableCell>{customer.percentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {topCustomers.length === 0 && (
          <div className="flex items-center justify-center h-[200px]">
            <p>No data available for the selected date range</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
