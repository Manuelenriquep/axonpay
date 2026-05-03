import { ACTIONS_CORS_HEADERS } from "@solana/actions";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const corsHeaders = {
  ...ACTIONS_CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
};

const ALLOWED_METHODS = new Set([
  "getLatestBlockhash",
  "getRecentBlockhash",
  "getAccountInfo",
  "getParsedAccountInfo",
  "getTokenAccountsByOwner",
  "getProgramAccounts",
  "getTransaction",
  "getConfirmedTransaction",
  "getVersion",
  "getSlot",
  "getEpochInfo",
]);

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: `Método ${req.method} no permitido` }),
      { status: 405, headers: corsHeaders }
    );
  }

  if (!HELIUS_API_KEY) {
    return new Response(
      JSON.stringify({ error: "HELIUS_API_KEY no configurada" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const rawBody = await req.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "JSON inválido" }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return new Response(
      JSON.stringify({ error: "Payload debe ser un objeto JSON" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const method = (payload as Record<string, unknown>).method;
  if (typeof method !== "string" || !ALLOWED_METHODS.has(method)) {
    return new Response(
      JSON.stringify({ error: "Método RPC no permitido" }),
      { status: 403, headers: corsHeaders }
    );
  }

  const response = await fetch(HELIUS_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody,
  });

  const responseBody = await response.text();
  return new Response(responseBody, {
    status: response.status,
    headers: corsHeaders,
  });
}
