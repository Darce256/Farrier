import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerWithPresets } from "@/components/ui/date-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ServiceData {
  name: string;
  value: number;
  percentage: number;
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
        <p>{`${payload[0].payload.percentage.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  payload,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={COLORS[index % COLORS.length]}
        fill="none"
      />
      <circle
        cx={ex}
        cy={ey}
        r={2}
        fill={COLORS[index % COLORS.length]}
        stroke="none"
      />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
        fontSize="12"
      >
        {payload.name}
      </text>
    </g>
  );
};

interface Props {
  allShoeings: Shoeing[];
}

export default function TopSellingServicesChart({ allShoeings }: Props) {
  const [data, setData] = useState<ServiceData[]>([]);
  const [dateRange, setDateRange] = useState<
    { from: string | null; to: string | null } | undefined
  >(undefined);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    if (allShoeings.length > 0) {
      processData();
    }
  }, [dateRange, allShoeings]);

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

    const serviceData: { [key: string]: number } = {};
    let revenue = 0;

    filteredShoeings.forEach((shoeing, index) => {
      const service = shoeing["Base Service"];
      const costString = shoeing["Cost of Service"];

      if (!service || !costString) {
        return; // Skip this iteration
      }

      const cost = parseFloat(costString.replace("$", "").trim());

      if (isNaN(cost)) {
        console.warn(`Invalid cost value at index ${index}:`, costString);
        return; // Skip this iteration
      }

      serviceData[service] = (serviceData[service] || 0) + cost;
      revenue += cost;
    });

    setTotalRevenue(revenue);

    const chartData = Object.entries(serviceData)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / revenue) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5 services

    console.log("Chart data:", chartData);

    setData(chartData);
  }

  return (
    <Card className="w-full col-span-1">
      <CardHeader>
        <CardTitle>Top Selling Services</CardTitle>
        <CardDescription>
          Distribution of sales across our most popular services
        </CardDescription>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <DatePickerWithPresets
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          <div className="text-sm font-semibold">
            Total Services Revenue: ${totalRevenue.toFixed(2)}
          </div>
        </div>
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
                  outerRadius={isMobile ? "60%" : "70%"}
                  fill="#8884d8"
                  dataKey="value"
                  label={isMobile ? undefined : <CustomLabel />}
                >
                  {data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {isMobile && (
                  <Legend
                    layout="vertical"
                    align="center"
                    verticalAlign="bottom"
                  />
                )}
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
