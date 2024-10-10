import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

async function refreshToken(supabase, userId, refreshToken) {
  console.log("Attempting to refresh token for user:", userId);
  const clientId = Deno.env.get("QUICKBOOKS_CLIENT_ID");
  const clientSecret = Deno.env.get("QUICKBOOKS_CLIENT_SECRET");
  const refreshUrl =
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

  try {
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Token refresh error response:", errorBody);
      throw new Error(
        `Failed to refresh token: ${response.status} ${response.statusText}\n${errorBody}`
      );
    }

    const data = await response.json();
    console.log("Token refreshed successfully");

    // Update the token in the database
    const { error: updateError } = await supabase
      .from("quickbooks_tokens")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating token in database:", updateError);
      throw new Error(
        `Failed to update token in database: ${updateError.message}`
      );
    }

    return data.access_token;
  } catch (error) {
    console.error("Error in refreshToken:", error);
    throw error;
  }
}

serve(async (req) => {
  // Always return CORS headers for OPTIONS requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    console.log("Processing request for user:", userId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get QuickBooks token
    let { data: tokenData, error: tokenError } = await supabase
      .from("quickbooks_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      console.error("Error fetching token:", tokenError);
      throw new Error(
        `Failed to fetch QuickBooks token: ${
          tokenError?.message || "Token not found"
        }`
      );
    }

    console.log("Token data retrieved:", {
      ...tokenData,
      access_token: "REDACTED",
    });

    let { access_token, refresh_token, realm_id, expires_at } = tokenData;

    // Check if token is expired and refresh if necessary
    if (new Date(expires_at) <= new Date()) {
      console.log("Token expired, refreshing...");
      access_token = await refreshToken(supabase, userId, refresh_token);
    }

    // QuickBooks API base URL
    const apiBase =
      Deno.env.get("QUICKBOOKS_API_URL") ||
      "https://sandbox-quickbooks.api.intuit.com/v3/company";
    console.log("Using API base URL:", apiBase);

    // Fetch items from QuickBooks API
    const response = await fetch(
      `${apiBase}/${realm_id}/query?query=select * from Item where Active = true`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("QuickBooks API error response:", errorBody);
      throw new Error(
        `QuickBooks API error: ${response.status} ${response.statusText}\n${errorBody}`
      );
    }

    const data = await response.json();
    console.log("QuickBooks API response received");

    const items = data.QueryResponse.Item;

    const itemIds = items.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      description: item.Description,
    }));

    console.log(`Retrieved ${itemIds.length} items`);

    const responseObj = {
      items: itemIds,
      message: "Items retrieved successfully",
    };

    console.log("Sending response:", JSON.stringify(responseObj));

    return new Response(JSON.stringify(responseObj), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in Edge Function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
