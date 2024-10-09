import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import axios from "axios";

const QUICKBOOKS_CLIENT_ID = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
const QUICKBOOKS_CLIENT_SECRET = import.meta.env.VITE_QUICKBOOKS_CLIENT_SECRET;
const QUICKBOOKS_REDIRECT_URI = import.meta.env.VITE_QUICKBOOKS_REDIRECT_URI;

export default function QuickBooksCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const exchangeCodeForTokens = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const realmId = urlParams.get("realmId"); // This is the QuickBooks company ID

      if (code) {
        try {
          const response = await axios.post(
            "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
            `grant_type=authorization_code&code=${code}&redirect_uri=${QUICKBOOKS_REDIRECT_URI}`,
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization:
                  "Basic " +
                  btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`),
              },
            }
          );

          const { access_token, refresh_token, expires_in } = response.data;

          // Store tokens in Supabase
          const { error } = await supabase.from("quickbooks_tokens").upsert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            access_token,
            refresh_token,
            expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
            realm_id: realmId,
          });

          if (error) {
            console.error("Error storing QuickBooks tokens:", error);
          } else {
            console.log("QuickBooks tokens stored successfully");
          }
        } catch (error) {
          console.error("Error exchanging code for tokens:", error);
        }
      }

      // Redirect back to the main page
      navigate("/");
    };

    exchangeCodeForTokens();
  }, [navigate]);

  return <div>Processing QuickBooks connection...</div>;
}
