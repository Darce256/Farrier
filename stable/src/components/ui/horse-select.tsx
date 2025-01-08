import { useState, useEffect } from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Horse {
  id: string;
  Name: string;
  "Barn / Trainer": string;
}

interface HorseSelectProps {
  horses: Horse[];
  selectedHorses: string[];
  onHorseChange: (value: string[]) => void;
  placeholder?: string;
}

export function HorseSelect({
  horses,
  selectedHorses,
  onHorseChange,
  placeholder = "Select horses...",
}: HorseSelectProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const formatHorseString = (name: string, barnTrainer: string) => {
    return `${name} - [${barnTrainer || "No Barn"}]`;
  };

  const getHorseIdentifier = (name: string, _barnTrainer: string) => {
    return name;
  };

  const getHorseDisplayName = (horseIdentifier: string) => {
    const horse = horses.find((h) => h.Name === horseIdentifier);
    if (!horse) return horseIdentifier;
    return formatHorseString(horse.Name, horse["Barn / Trainer"]);
  };

  const toggleHorse = (horse: Horse) => {
    const horseId = getHorseIdentifier(horse.Name, horse["Barn / Trainer"]);
    const newSelected = selectedHorses.includes(horseId)
      ? selectedHorses.filter((h) => h !== horseId)
      : [...selectedHorses, horseId];
    onHorseChange(newSelected);
  };

  const removeHorse = (horseToRemove: string) => {
    onHorseChange(selectedHorses.filter((horse) => horse !== horseToRemove));
  };

  const filteredHorses = horses.filter((horse) => {
    const searchString = searchValue.toLowerCase();
    return (
      horse.Name?.toLowerCase().includes(searchString) ||
      horse["Barn / Trainer"]?.toLowerCase().includes(searchString)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".horse-select-container")) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2 horse-select-container">
      <div
        className="border rounded-md p-2 min-h-[42px] cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedHorses.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {selectedHorses.map((horseId) => (
            <Badge key={horseId} variant="secondary" className="mr-1 mb-1">
              {getHorseDisplayName(horseId)}
              <button
                className="ml-1 hover:bg-destructive/50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  removeHorse(horseId);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {isExpanded && (
        <div className="border rounded-md p-2 bg-background shadow-md">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search horses..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[200px]">
            {filteredHorses.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2 text-center">
                No horses found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredHorses.map((horse) => {
                  const horseId = getHorseIdentifier(
                    horse.Name,
                    horse["Barn / Trainer"]
                  );
                  const isSelected = selectedHorses.includes(horseId);
                  const displayName = formatHorseString(
                    horse.Name || "",
                    horse["Barn / Trainer"] || ""
                  );

                  return (
                    <Button
                      key={horse.id}
                      type="button"
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2",
                        isSelected && "bg-accent"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleHorse(horse);
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {displayName}
                    </Button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
