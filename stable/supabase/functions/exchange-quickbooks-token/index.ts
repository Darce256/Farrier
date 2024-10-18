import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const QUICKBOOKS_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID")!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET")!;
const QUICKBOOKS_REDIRECT_URI = Deno.env.get("QUICKBOOKS_REDIRECT_URI")!;
console.log("QUICKBOOKS_REDIRECT_URI:", QUICKBOOKS_REDIRECT_URI);

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, realmId } = await req.json();

    console.log("Received code:", code);
    console.log("Received realmId:", realmId);

    if (!code) {
      throw new Error("Missing authorization code");
    }

    const tokenUrl =
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: QUICKBOOKS_REDIRECT_URI,
    });

    console.log("Sending request to QuickBooks API");
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`
        )}`,
      },
      body: body.toString(),
    });

    console.log("Received response from QuickBooks API");
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("QuickBooks API error:", tokenData);
      throw new Error(
        `QuickBooks API error: ${
          tokenData.error_description || tokenData.error
        }`
      );
    }

    console.log("Token data received successfully");

    return new Response(JSON.stringify({ success: true, data: tokenData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in exchange-quickbooks-token:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
