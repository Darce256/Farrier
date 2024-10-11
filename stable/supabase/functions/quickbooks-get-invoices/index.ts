import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const QUICKBOOKS_API_URL =
  Deno.env.get("QUICKBOOKS_API_URL") ||
  "https://sandbox-quickbooks.api.intuit.com/v3/company";

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, page = 1, itemsPerPage = 25 } = await req.json();

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
      throw new Error(
        `Failed to fetch QuickBooks token: ${
          tokenError?.message || "Token not found"
        }`
      );
    }

    let { access_token, refresh_token, realm_id, expires_at } = tokenData;

    // Check if token is expired and refresh if necessary
    if (new Date(expires_at) <= new Date()) {
      access_token = await refreshToken(supabase, userId, refresh_token);
    }

    // Calculate the start position for the query
    const startPosition = (page - 1) * itemsPerPage + 1;

    // Fetch total count
    const countQuery = `select count(*) from Invoice`;
    const countResponse = await fetch(
      `${QUICKBOOKS_API_URL}/${realm_id}/query?query=${encodeURIComponent(
        countQuery
      )}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!countResponse.ok) {
      const errorBody = await countResponse.text();
      throw new Error(
        `QuickBooks API error (count): ${countResponse.status} ${countResponse.statusText}\n${errorBody}`
      );
    }

    const countData = await countResponse.json();
    const totalCount = countData.QueryResponse.totalCount || 0;

    // Fetch invoices
    const query = `select * from Invoice ORDERBY TxnDate DESC startPosition ${startPosition} maxResults ${itemsPerPage}`;
    const response = await fetch(
      `${QUICKBOOKS_API_URL}/${realm_id}/query?query=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `QuickBooks API error: ${response.status} ${response.statusText}\n${errorBody}`
      );
    }

    const data = await response.json();
    const invoices = data.QueryResponse.Invoice || [];
    const totalCountFromResponse = data.QueryResponse.totalCount || 0;

    console.log(
      "Edge Function: Invoices fetched:",
      invoices.length,
      "Total count:",
      totalCount
    );

    return new Response(JSON.stringify({ invoices, totalCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
