import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

interface LocationData {
  location: string;
  revenue: number;
}

interface Shoeing {
  "Location of Service": string;
  "Cost of Service": string;
  "Date of Service": string;
}

// Add this color array
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
];

export default function LocationRevenueChart() {
  const [data, setData] = useState<LocationData[]>([]);
  const [dateRange, setDateRange] = useState<
    { from: string | null; to: string | null } | undefined
  >(undefined);
  const [allShoeings, setAllShoeings] = useState<Shoeing[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

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
      .select('"Location of Service", "Cost of Service", "Date of Service"');

    if (error) {
      console.error("Error fetching shoeings:", error);
      return;
    }

    const validShoeings = data.filter(
      (shoeing) =>
        shoeing["Location of Service"] &&
        shoeing["Cost of Service"] &&
        shoeing["Date of Service"]
    );

    setAllShoeings(validShoeings);
  }

  function processData() {
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

    const locationData: { [key: string]: number } = {};
    let revenue = 0;

    filteredShoeings.forEach((shoeing) => {
      const location = shoeing["Location of Service"];
      const cost = parseFloat(
        shoeing["Cost of Service"].replace("$", "").trim()
      );

      if (!isNaN(cost)) {
        locationData[location] = (locationData[location] || 0) + cost;
        revenue += cost;
      }
    });

    setTotalRevenue(revenue);

    const chartData = Object.entries(locationData)
      .map(([location, revenue]) => ({
        location,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    setData(chartData);
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold">{`${label}`}</p>
          <p>{`Revenue: $${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full col-span-1">
      <CardHeader>
        <CardTitle>Revenue by Location</CardTitle>
        <CardDescription>
          Breakdown of revenue across different service locations
        </CardDescription>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <DatePickerWithPresets
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          <div className="text-sm font-semibold">
            Total Revenue: ${totalRevenue.toFixed(2)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 120, // Increased bottom margin for rotated labels
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="location"
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="end"
                        fill="#666"
                        transform="rotate(-45)"
                      >
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue">
                  {data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
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
