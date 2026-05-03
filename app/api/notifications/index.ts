import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import * as crypto from "crypto";
import { USDC_MINT } from "../../../lib/solana/contract";

const corsHeaders = {
  ...ACTIONS_CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
};

const HELIUS_WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET || "";

function verifyHeliusWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!HELIUS_WEBHOOK_SECRET) {
    console.warn("HELIUS_WEBHOOK_SECRET no configurada. Saltando verificación.");
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", HELIUS_WEBHOOK_SECRET)
    .update(payload)
    .digest("base64");

  return signature === expectedSignature;
}

interface HeliusWebhookEvent {
  type: string;
  signature: string;
  slot: number;
  timestamp: number;
  description?: string;
  source?: string;
  success?: boolean;
  err?: unknown;
  tokenTransfers?: Array<{
    mint?: string;
    amount?: string;
    source?: string;
    destination?: string;
  }>;
}

interface HeliusWebhookPayload {
  events?: HeliusWebhookEvent[];
  notifications?: HeliusWebhookEvent[];
}

const paymentCache: Map<string, { status: string; timestamp: number }> = new Map();

export async function GET() {
  return new Response(
    JSON.stringify({ status: "ok", service: "Axonpay Helius webhook receiver" }),
    { status: 200, headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "X-Signature header requerido" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const rawBody = await req.text();

    const isValid = verifyHeliusWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[Helius Webhook] Firma inválida");
      return new Response(
        JSON.stringify({ error: "Firma inválida" }),
        { status: 401, headers: corsHeaders }
      );
    }

    let payload: HeliusWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "JSON inválido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const events = payload.events ?? payload.notifications;
    if (!events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({ error: "Formato de evento inválido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let processedCount = 0;
    for (const event of events) {
      const tokenTransfers = Array.isArray(event.tokenTransfers)
        ? event.tokenTransfers
        : [];

      const usdcTransfers = tokenTransfers.filter(
        (transfer) => transfer.mint === USDC_MINT
      );
      if (usdcTransfers.length === 0) {
        continue;
      }

      const txSignature = event.signature;
      const success =
        event.success === true ||
        event.err == null ||
        event.description?.toLowerCase().includes("success");

      console.log(
        `[Helius Webhook] TX ${txSignature}: ${success ? "CONFIRMED" : "FAILED"} / USDC transfers=${usdcTransfers.length}`
      );

      paymentCache.set(txSignature, {
        status: success ? "confirmed" : "failed",
        timestamp: event.timestamp,
      });
      processedCount += 1;
    }

    return new Response(
      JSON.stringify({ status: "received", processedEvents: processedCount }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Helius Webhook] Error:", errorMsg);

    return new Response(
      JSON.stringify({ error: "No se pudo procesar el webhook", details: errorMsg }),
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function getPaymentStatus(txSignature: string): Promise<string> {
  const cached = paymentCache.get(txSignature);
  return cached?.status || "pending";
}
