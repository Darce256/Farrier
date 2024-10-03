export function getLocationColor(location: string): {
  backgroundColor: string;
} {
  return { backgroundColor: locationColors[location] || "#E5E7EB" }; // Default to a light gray if location not found
}

const locationColors: Record<string, string> = {
  "Austin Barns": "#FFA07A",
  "Gulf Port": "#FFD700",
  "Home Barns": "#87CEFA",
  Kentucky: "#00FFFF",
  Michigan: "#6495ED",
  Ocala: "#FF00FF",
  "Other Travel": "#FFB6C1",
  Pennsylvania: "#39CAFF",
  "Sherwood Sporthorses": "#3CB371",
  Wellington: "#D2B48C",
  "White Fox Manor": "#7B68EE",
  Katy: "#FFBA06",
};
