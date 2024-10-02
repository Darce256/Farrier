import { Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";

export default function Component() {
  // Sample horse data
  const horses = [
    { id: 1, name: "Midnight Dancer", breed: "Arabian" },
    { id: 2, name: "Chestnut Stallion", breed: "Clydesdale" },
    { id: 3, name: "Palomino Pony", breed: "Miniature Horse" },
    { id: 4, name: "Appaloosa Gelding", breed: "Appaloosa" },
    { id: 5, name: "Buckskin Mare", breed: "Quarter Horse" },
    { id: 6, name: "Dapple Grey Gelding", breed: "Percheron" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8 h-full">
      <div className="bg-background rounded-lg shadow-lg p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Horses</h2>
        <ul className="space-y-4">
          {horses.map((horse) => (
            <li key={horse.id} className="border-b border-gray-200 pb-2">
              <Link
                to={`/horses/${horse.id}`}
                className="block hover:bg-muted p-2 rounded"
              >
                <h3 className="text-lg font-semibold">{horse.name}</h3>
                <p className="text-sm text-muted-foreground">{horse.breed}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-muted rounded-lg shadow-lg p-6 flex flex-col h-full">
        <Calendar mode="single" />
      </div>
    </div>
  );
}
