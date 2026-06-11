import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ApplicationServer, importVapidKeys } from "../_shared/webPushLib.ts";

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const subject = Deno.env.get("VAPID_SUBJECT");

    if (!publicKey || !privateKey || !subject) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicKeyBytes = base64UrlToUint8Array(publicKey);
    const privateKeyBytes = base64UrlToUint8Array(privateKey);

    const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
    const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
    const d = uint8ArrayToBase64Url(privateKeyBytes);

    const jwk = {
      publicKey: { kty: "EC", crv: "P-256", x, y },
      privateKey: { kty: "EC", crv: "P-256", x, y, d },
    };

    const vapidKeys = await importVapidKeys(jwk, { extractable: true });
    const server = await ApplicationServer.new({
      contactInformation: subject,
      vapidKeys,
    });

    // Buscar subscription do banco
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .limit(1);

    if (error || !subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No subscriptions found", details: error }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscription = subscriptions[0];
    const subscriber = server.subscribe({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key,
      },
    });

    try {
      await subscriber.pushTextMessage(
        JSON.stringify({
          title: "Teste de Notificação",
          body: "Se você recebeu esta mensagem, as notificações estão funcionando!",
          data: { url: "/" },
        }),
        {}
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Notificação enviada com sucesso!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (pushError: any) {
      let errorDetails: any = {
        message: pushError.message,
        name: pushError.name,
        stack: pushError.stack,
      };

      return new Response(
        JSON.stringify({ error: errorDetails }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
