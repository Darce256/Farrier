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

interface TopProduct {
  name: string;
  revenue: number;
  percentage: number;
}

interface Shoeing {
  "Base Service": string;
  "Cost of Service": string;
  "Front Add-On's": string;
  "Cost of Front Add-Ons": string;
  "Hind Add-On's": string;
  "Cost of Hind Add-Ons": string;
  "Date of Service": string;
}

interface Props {
  allShoeings: Shoeing[];
}

export default function TopProductsChart({ allShoeings }: Props) {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dateRange, setDateRange] = useState<
    { from: string | null; to: string | null } | undefined
  >(undefined);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  useEffect(() => {
    if (allShoeings.length > 0) {
      calculateTopProducts();
    }
  }, [dateRange, allShoeings]);

  function calculateTopProducts() {
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

    const productMap = new Map<string, number>();
    let totalRev = 0;

    filteredShoeings.forEach((shoeing) => {
      const baseService = shoeing["Base Service"];
      const baseCostString = shoeing["Cost of Service"];

      if (baseService && baseCostString) {
        const baseCost = parseFloat(baseCostString.replace("$", "").trim());
        if (!isNaN(baseCost)) {
          productMap.set(
            baseService,
            (productMap.get(baseService) || 0) + baseCost
          );
          totalRev += baseCost;
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
          totalRev += frontAddOnCost;
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
          totalRev += hindAddOnCost;
        }
      }
    });

    setTotalRevenue(totalRev);

    const sortedProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage: (revenue / totalRev) * 100,
      }));

    setTopProducts(sortedProducts);
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
        <CardTitle>Top Products</CardTitle>
        <CardDescription>Highest revenue generating products</CardDescription>
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
        {topProducts.length > 0 && (
          <>
            <div className="mb-4 mt-4">
              <CardTitle className="text-4xl">{topProducts[0].name}</CardTitle>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(topProducts[0].revenue)} (
                {topProducts[0].percentage.toFixed(2)}% of total revenue)
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-md text-gray-400">
                    Product
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
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className={index === 0 ? "font-medium" : ""}>
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.revenue)}</TableCell>
                    <TableCell>{product.percentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {topProducts.length === 0 && (
          <div className="flex items-center justify-center h-[200px]">
            <p>No data available for the selected date range</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
