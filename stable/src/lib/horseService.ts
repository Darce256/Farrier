import { supabase } from "./supabaseClient";

export interface Horse {
  id: string;
  Name: string;
  Customers: string;
  "Barn / Trainer": string;
  "need double check": string | null;
  "Owner Email": string | null;
  History: string | null;
  "Horse Notes History": string | null;
  "X-Ray Images (from History)": string | null;
  "Note w/ Time Stamps (from History)": string | null;
  "Shoeing History": string | null;
}

export async function getHorses(): Promise<Horse[]> {
  let allHorses: Horse[] = [];
  let page = 0;
  const pageSize = 1000; // Supabase's maximum limit

  while (true) {
    const { data, error, count } = await supabase
      .from("horses")
      .select("*", { count: "exact" })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching horses:", error);
      throw error;
    }

    if (data) {
      allHorses = allHorses.concat(data);
    }

    if (!count || allHorses.length >= count) {
      break;
    }

    page++;
  }

  console.log(`Fetched ${allHorses.length} horses`);
  return allHorses;
}
