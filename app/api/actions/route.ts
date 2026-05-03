import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";
import { createProcessPaymentInstruction } from "../../../lib/solana/transaction";
import { getLatestBlockhash } from "../../../lib/solana/rpc";

const corsHeaders = {
  ...ACTIONS_CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
};

async function handleGet() {
  try {
    const payload: ActionGetResponse = {
      icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      title: "Honorarios Legales - Guanes Legaltech",
      description: "Pago de servicios jurídicos especializados con USDC en Solana.",
      label: "Pagar 0.1 USDC",
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("[GET] Error:", error);
    return new Response(
      JSON.stringify({ error: "Fallo al procesar solicitud" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: ACTIONS_CORS_HEADERS,
  });
}

function isJsonContentType(value: string | null): boolean {
  return typeof value === "string" && value.toLowerCase().includes("application/json");
}

function parseUSDCAmount(value: unknown): bigint {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("amount inválido");
    }
    value = value.toString();
  }

  if (typeof value !== "string") {
    throw new Error("amount debe ser string o number");
  }

  const normalized = value.trim();
  const match = normalized.match(/^(\d+)(?:\.(\d{1,6})?)?$/);
  if (!match) {
    throw new Error("amount inválido, use hasta 6 decimales");
  }

  const whole = BigInt(match[1]);
  const fraction = (match[2] ?? "").padEnd(6, "0");
  return whole * BigInt(1000000) + BigInt(fraction);
}

async function handlePost(req: Request) {
  try {
    const contentType = req.headers.get("content-type");
    if (!isJsonContentType(contentType)) {
      return new Response(
        JSON.stringify({ error: "Content-Type debe ser application/json" }),
        { status: 415, headers: corsHeaders }
      );
    }

    const rawBody = await req.text();
    if (!rawBody || !rawBody.trim()) {
      return new Response(
        JSON.stringify({ error: "Request body requerido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "JSON inválido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof payload !== "object" || payload === null) {
      return new Response(
        JSON.stringify({ error: "Payload debe ser un objeto JSON" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { merchant, amount, payer } = payload as Record<string, unknown>;

    if (!merchant || typeof merchant !== "string") {
      return new Response(
        JSON.stringify({ error: "merchant requerido (string)" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (amount === undefined) {
      return new Response(
        JSON.stringify({ error: "amount requerido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!payer || typeof payer !== "string") {
      return new Response(
        JSON.stringify({ error: "payer requerido (string)" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let merchantPubkey: PublicKey;
    let payerPubkey: PublicKey;

    try {
      merchantPubkey = new PublicKey(merchant);
      payerPubkey = new PublicKey(payer);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "merchant o payer inválido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let amountValue: bigint;
    try {
      amountValue = parseUSDCAmount(amount);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "amount inválido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const paymentId = BigInt(Date.now());
    const instruction = createProcessPaymentInstruction(
      payerPubkey,
      merchantPubkey,
      amountValue,
      paymentId
    );

    const blockhashInfo = await getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: payerPubkey,
      blockhash: blockhashInfo.blockhash,
      lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
    });
    transaction.add(instruction);

    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return new Response(
      JSON.stringify({
        status: "success",
        transaction: serialized.toString("base64"),
        message: "Transacción lista para firmar",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[POST] Error:", errorMsg);

    return new Response(
      JSON.stringify({
        error: "Fallo en el procesamiento",
        details: process.env.NODE_ENV === "development" ? errorMsg : undefined,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  if (req.method === "GET") {
    return handleGet();
  }

  if (req.method === "POST") {
    return handlePost(req);
  }

  return new Response(
    JSON.stringify({ error: `Método ${req.method} no permitido` }),
    { status: 405, headers: corsHeaders }
  );
}
