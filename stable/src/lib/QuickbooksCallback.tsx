import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function QuickBooksCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const exchangeCodeForTokens = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const realmId = urlParams.get("realmId");

      if (code && realmId) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "exchange-quickbooks-token",
            {
              body: JSON.stringify({ code, realmId }),
            }
          );

          if (error) throw error;

          console.log("Received data from Edge Function:", data);

          if (data.error) {
            throw new Error(
              `QuickBooks API Error: ${data.error} - ${data.error_description}`
            );
          }

          const { access_token, refresh_token, expires_in } = data.data;

          if (!access_token || !refresh_token || !expires_in) {
            throw new Error("Missing required token data");
          }

          // Calculate expires_at
          const expiresInMs = parseInt(expires_in, 10) * 1000;
          if (isNaN(expiresInMs)) {
            throw new Error("Invalid expires_in value");
          }
          const expiresAt = new Date(Date.now() + expiresInMs);

          console.log("Calculated expiresAt:", expiresAt);

          // Get current user
          const { data: userData, error: userError } =
            await supabase.auth.getUser();
          if (userError) throw userError;

          // Store tokens in Supabase
          const { error: storeError } = await supabase
            .from("quickbooks_tokens")
            .upsert(
              {
                user_id: userData.user?.id,
                access_token,
                refresh_token,
                expires_at: expiresAt.toISOString(),
                realm_id: realmId,
              },
              {
                onConflict: "user_id,realm_id",
                ignoreDuplicates: false,
              }
            );

          if (storeError) {
            throw storeError;
          }

          console.log("QuickBooks tokens stored successfully");
          toast.success("QuickBooks connected successfully");
          navigate("/shoeings-approval-panel", { replace: true });
        } catch (error: any) {
          console.error("Error processing QuickBooks connection:", error);
          toast.error(error.message || "Failed to connect QuickBooks");
          navigate("/", { replace: true });
        }
      } else {
        console.error("Missing code or realmId in URL parameters");
        toast.error("Invalid QuickBooks response");
        navigate("/", { replace: true });
      }
    };

    exchangeCodeForTokens();
  }, [navigate]);

  return <div>Processing QuickBooks connection...</div>;
}
