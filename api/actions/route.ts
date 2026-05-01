import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";

export async function GET(req: Request) {
  const payload: ActionGetResponse = {
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    title: "Honorarios Legales - Guanes Legaltech",
    description: "Pago de servicios jurídicos especializados.",
    label: "Pagar 0.1 SOL",
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: ACTIONS_CORS_HEADERS,
  });
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: ACTIONS_CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  return new Response(JSON.stringify({ message: "POST activo" }), {
    status: 200,
    headers: ACTIONS_CORS_HEADERS,
  });
}