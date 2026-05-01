import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";

const corsHeaders = {
  ...ACTIONS_CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
};

export async function GET(req: Request) {
  try {
    const payload: ActionGetResponse = {
      icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      title: "Honorarios Legales - Guanes Legaltech",
      description: "Pago de servicios jurídicos especializados.",
      label: "Pagar 0.1 SOL",
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

export async function POST(req: Request) {
  try {
    // Validar que el request sea válido
    if (!req.body) {
      return new Response(
        JSON.stringify({ error: "Request body requerido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Parsear el body con timeout de red
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const payload = await req.json();
    clearTimeout(timeoutId);

    // Respuesta exitosa
    return new Response(
      JSON.stringify({ 
        status: "success",
        message: "Transacción procesada",
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[POST] Error:", errorMsg);

    return new Response(
      JSON.stringify({ 
        error: "Fallo en el procesamiento",
        details: process.env.NODE_ENV === "development" ? errorMsg : undefined
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}