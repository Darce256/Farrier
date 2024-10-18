import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

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
    const { userId, shoeings, customerId } = await req.json();
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
      "https://quickbooks.api.intuit.com/v3/company";
    console.log("Using API base URL:", apiBase);

    let invoiceResponse = null;
    if (shoeings && customerId) {
      console.log("Creating invoice for shoeings:", shoeings);
      invoiceResponse = await createInvoice(
        apiBase,
        realm_id,
        access_token,
        shoeings,
        customerId
      );
    }

    const itemIds = await fetchItems(apiBase, realm_id, access_token);
    const customerList = await fetchCustomers(apiBase, realm_id, access_token);

    const responseObj = {
      items: itemIds,
      customers: customerList,
      message: "Items and customers retrieved successfully",
      invoice: invoiceResponse,
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

// Add this new function to create an invoice
async function createInvoice(
  apiBase,
  realm_id,
  access_token,
  shoeings,
  customerId
) {
  console.log("Creating invoice...");
  console.log("Shoeings data:", JSON.stringify(shoeings, null, 2));

  const invoiceLines = shoeings.map((shoeing) => {
    let amount = 0;
    if (typeof shoeing["Total Cost"] === "string") {
      amount = parseFloat(shoeing["Total Cost"].replace(/[^0-9.-]+/g, ""));
    } else if (typeof shoeing["Total Cost"] === "number") {
      amount = shoeing["Total Cost"];
    }

    if (isNaN(amount)) {
      console.warn(
        `Invalid Total Cost for shoeing: ${JSON.stringify(shoeing)}`
      );
      amount = 0;
    }

    const serviceDate = shoeing["Date of Service"]
      ? new Date(shoeing["Date of Service"]).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    return {
      DetailType: "SalesItemLineDetail",
      Amount: amount,
      Description: shoeing.invoiceDescription || "Shoeing Service", // Use the cleaned description from the frontend
      SalesItemLineDetail: {
        ItemRef: {
          value: "1310",
          name: "Shoeing Service",
        },
        ServiceDate: serviceDate,
        Qty: 1,
        UnitPrice: amount,
      },
    };
  });

  const invoiceData = {
    Line: invoiceLines,
    CustomerRef: {
      value: customerId,
    },
  };

  console.log("Invoice data to be sent:", JSON.stringify(invoiceData, null, 2));

  try {
    const response = await fetch(`${apiBase}/${realm_id}/invoice`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    const responseText = await response.text();
    console.log("Raw response from QuickBooks API:", responseText);

    if (!response.ok) {
      console.error(
        "QuickBooks API error response for invoice creation:",
        responseText
      );
      throw new Error(
        `QuickBooks API error for invoice creation: ${response.status} ${response.statusText}\n${responseText}`
      );
    }

    let data;
    if (responseText.trim().startsWith("<")) {
      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, "text/xml");
      const invoice = xmlDoc.querySelector("Invoice");
      if (invoice) {
        data = {
          Id: invoice.querySelector("Id")?.textContent,
          DocNumber: invoice.querySelector("DocNumber")?.textContent,
          TotalAmt: invoice.querySelector("TotalAmt")?.textContent,
        };
      } else {
        throw new Error("Failed to parse XML response from QuickBooks API");
      }
    } else {
      // Parse JSON response
      data = JSON.parse(responseText);
    }

    console.log("Invoice created successfully:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error in createInvoice:", error);
    throw error;
  }
}

// Helper functions to fetch items and customers
async function fetchItems(apiBase, realm_id, access_token) {
  console.log("Fetching items...");
  let allItems = [];
  let startPosition = 1;
  const maxResults = 1000; // QuickBooks allows up to 1000 results per query
  let moreItems = true;

  while (moreItems) {
    const query = `select * from Item where Active = true STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
    const response = await fetch(
      `${apiBase}/${realm_id}/query?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("QuickBooks API error response for items:", errorBody);
      throw new Error(
        `QuickBooks API error for items: ${response.status} ${response.statusText}\n${errorBody}`
      );
    }

    const data = await response.json();
    console.log(`Fetched ${data.QueryResponse.Item.length} items`);

    allItems = allItems.concat(data.QueryResponse.Item);

    if (data.QueryResponse.Item.length < maxResults) {
      moreItems = false;
    } else {
      startPosition += maxResults;
    }
  }

  console.log(`Total items fetched: ${allItems.length}`);
  return allItems.map((item: any) => ({
    id: item.Id,
    name: item.Name,
    description: item.Description,
  }));
}

async function fetchCustomers(apiBase, realm_id, access_token) {
  console.log("Fetching customers...");
  let allCustomers = [];
  let startPosition = 1;
  const maxResults = 1000; // QuickBooks allows up to 1000 results per query
  let moreCustomers = true;

  while (moreCustomers) {
    const query = `select * from Customer where Active = true STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
    const response = await fetch(
      `${apiBase}/${realm_id}/query?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("QuickBooks API error response for customers:", errorBody);
      throw new Error(
        `QuickBooks API error for customers: ${response.status} ${response.statusText}\n${errorBody}`
      );
    }

    const data = await response.json();
    console.log(`Fetched ${data.QueryResponse.Customer.length} customers`);

    allCustomers = allCustomers.concat(data.QueryResponse.Customer);

    if (data.QueryResponse.Customer.length < maxResults) {
      moreCustomers = false;
    } else {
      startPosition += maxResults;
    }
  }

  console.log(`Total customers fetched: ${allCustomers.length}`);
  return allCustomers.map((customer: any) => ({
    id: customer.Id,
    displayName: customer.DisplayName,
    companyName: customer.CompanyName,
    email: customer.PrimaryEmailAddr?.Address,
  }));
}
