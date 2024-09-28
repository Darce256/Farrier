import { supabase } from "./supabaseClient";

export interface Horse {
  id: string;
  Name: string | null;
  Customers: string | null;
  "Barn / Trainer": string | null;
  "need double check": string | null;
  "Owner Email": string | null;
  History: string | null;
  "Horse Notes History": string | null;
  "X-Ray Images (from History)": string | null;
  "Note w/ Time Stamps (from History)": string | null;
}

export async function getHorses(): Promise<Horse[]> {
  const { data, error } = await supabase
    .from("horses")
    .select("*", { count: "exact" });

  if (error) {
    console.error("Error fetching horses:", error);
    throw error;
  }
  return data || [];
}
