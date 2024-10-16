import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { DatePickerWithPresets } from "@/components/ui/date-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface ServiceData {
  name: string;
  value: number;
}

interface Shoeing {
  "Base Service": string;
  "Cost of Service": string;
  "Date of Service": string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="font-bold">{`${
          payload[0].name
        }: $${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <ul className="list-none p-0">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="inline-flex items-center mr-4">
          <span
            className="w-3 h-3 inline-block mr-1 rounded-sm"
            style={{ backgroundColor: entry.color }}
          ></span>
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default function TopSellingServicesChart() {
  const [data, setData] = useState<ServiceData[]>([]);
  const [dateRange, setDateRange] = useState<
    { from: string | null; to: string | null } | undefined
  >(undefined);
  const [allShoeings, setAllShoeings] = useState<Shoeing[]>([]);

  useEffect(() => {
    fetchAllShoeings();
  }, []);

  useEffect(() => {
    if (allShoeings.length > 0) {
      processData();
    }
  }, [dateRange, allShoeings]);

  async function fetchAllShoeings() {
    const { data, error } = await supabase
      .from("shoeings")
      .select('"Base Service", "Cost of Service", "Date of Service"');

    if (error) {
      console.error("Error fetching shoeings:", error);
      return;
    }

    // Filter out any invalid entries
    const validShoeings = data.filter(
      (shoeing) =>
        shoeing["Base Service"] &&
        shoeing["Cost of Service"] &&
        shoeing["Date of Service"]
    );

    if (validShoeings.length < data.length) {
      console.warn(
        `Filtered out ${data.length - validShoeings.length} invalid shoeings`
      );
    }

    console.log("Sample shoeing data:", validShoeings.slice(0, 5));

    setAllShoeings(validShoeings);
  }

  function processData() {
    console.log("Processing data with date range:", dateRange);

    let filteredShoeings = allShoeings;

    if (dateRange?.from && dateRange?.to) {
      const fromDate = startOfDay(new Date(dateRange.from));
      const toDate = endOfDay(new Date(dateRange.to));

      filteredShoeings = allShoeings.filter((shoeing) => {
        // Parse the date string in the format 'MM/DD/YYYY'
        const [month, day, year] = shoeing["Date of Service"].split("/");
        const shoeingDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        return isWithinInterval(shoeingDate, { start: fromDate, end: toDate });
      });

      console.log("Date range:", { fromDate, toDate });
      console.log(
        "Sample shoeing date:",
        filteredShoeings[0]?.["Date of Service"]
      );
    } else {
      console.log("Showing all time data");
    }

    console.log(`Filtered shoeings: ${filteredShoeings.length}`);

    // Log a few sample dates to check the format
    console.log(
      "Sample dates:",
      filteredShoeings.slice(0, 5).map((s) => s["Date of Service"])
    );

    const serviceData: { [key: string]: number } = {};

    filteredShoeings.forEach((shoeing, index) => {
      const service = shoeing["Base Service"];
      const costString = shoeing["Cost of Service"];

      if (!service || !costString) {
        console.warn(`Invalid shoeing data at index ${index}:`, shoeing);
        return; // Skip this iteration
      }

      const cost = parseFloat(costString.replace("$", "").trim());

      if (isNaN(cost)) {
        console.warn(`Invalid cost value at index ${index}:`, costString);
        return; // Skip this iteration
      }

      serviceData[service] = (serviceData[service] || 0) + cost;
    });

    const chartData = Object.entries(serviceData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5 services

    console.log("Chart data:", chartData);

    setData(chartData);
  }

  return (
    <Card className="w-full col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Top Selling Services</CardTitle>
        <CardDescription>
          Distribution of sales across our most popular services
        </CardDescription>
        <DatePickerWithPresets
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend content={<CustomLegend />} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>No data available for the selected date range</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
