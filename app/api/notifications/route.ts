import { NextResponse } from 'next/server';

// Constantes de Axonpay
const PROGRAM_ID = "AxonPayXQvN2C8hRkZ9wY1zTbPvF5uD6gH8jK3mN4pQ";
const ADMIN_PUBKEY = "3on54CLewSbVV3QR9FQMbzRWeiV9he6mFFjHPS8qBJjy";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Interfaz esperada del payload de Helius (Simplified Enhanced Webhook)
interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
}

interface HeliusTransaction {
  description: string;
  type: string;
  source: string;
  signature: string;
  timestamp: number;
  transactionError: any | null;
  tokenTransfers: HeliusTokenTransfer[];
  accountData: any[];
}

async function sendToN8NWithBackoff(url: string, payload: any, maxRetries = 5) {
  let attempt = 0;
  let delay = 1000; // Inicia con 1 segundo

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP de N8N! status: ${response.status}`);
      }
      
      console.log(`[Webhook] Evento reenviado exitosamente a N8N (${url}) en el intento ${attempt + 1}`);
      return; // Éxito, salir
    } catch (error: any) {
      attempt++;
      console.warn(`[Webhook Warning] Intento ${attempt} fallido hacia N8N: ${error.message}`);
      
      if (attempt >= maxRetries) {
        console.error(`[CRITICAL ERROR] El Webhook no pudo ser enviado a N8N tras ${maxRetries} intentos. Transacción: ${payload.id_transaccion}. Acción requerida: Procesar manualmente.`);
        return;
      }
      
      console.log(`[Webhook] Reintentando en ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff (1s, 2s, 4s, 8s...)
    }
  }
}

export async function POST(request: Request) {
  try {
    // El payload de Helius es un array de transacciones
    const payload: HeliusTransaction[] = await request.json();

    if (!payload || !Array.isArray(payload)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // Iterar sobre las transacciones recibidas
    for (const tx of payload) {
      // 1. Filtrar solo transacciones exitosas
      if (tx.transactionError !== null) {
        console.log(`[Webhook] Transacción fallida ignorada: ${tx.signature}`);
        continue;
      }

      // 2. Extraer transferencias de USDC
      const usdcTransfers = tx.tokenTransfers?.filter(t => t.mint === USDC_MINT) || [];
      
      if (usdcTransfers.length === 0) {
        continue;
      }

      // En el contrato process_payment, esperamos 2 transferencias:
      // a) Hacia el destinatario (Merchant)
      // b) Hacia el admin (Fee de Axonpay: 0.5%)
      
      const adminTransfer = usdcTransfers.find(t => t.toUserAccount === ADMIN_PUBKEY);
      const merchantTransfer = usdcTransfers.find(t => t.toUserAccount !== ADMIN_PUBKEY);

      if (!merchantTransfer || !adminTransfer) {
        console.log(`[Webhook] Transacción no corresponde al formato process_payment de Axonpay: ${tx.signature}`);
        continue;
      }

      // 3. Preparar Datos para Asiento Contable
      const sender = merchantTransfer.fromUserAccount;
      const receiver = merchantTransfer.toUserAccount;
      const amountToReceiver = merchantTransfer.tokenAmount;
      const amountToAdmin = adminTransfer.tokenAmount;
      const totalAmount = amountToReceiver + amountToAdmin;
      
      // Fecha formateada
      const date = new Date(tx.timestamp * 1000).toISOString();

      // 4. Construir Comprobante (Listo para React-PDF o Base de Datos)
      const comprobanteContable = {
        id_transaccion: tx.signature,
        fecha: date,
        remitente: sender,
        destinatario: receiver,
        monto_total_usd: totalAmount.toFixed(2),
        monto_destinatario_usd: amountToReceiver.toFixed(2),
        fee_axonpay_usd: amountToAdmin.toFixed(2),
        moneda: "USDC (Dólar Digital)",
        red: "Solana",
        nota_cumplimiento: "Axonpay actuó como 'Infraestructura de Enrutamiento Tecnológico' bajo el Art. 333 de la C.P. colombiana."
      };

      // 5. Entregable: Log de consola (Simulando guardado en Base de Datos)
      console.log("\n=======================================================");
      console.log("💳 NUEVO PAGO PROCESADO - EVENTO HELIUS CAPTURADO");
      console.log("=======================================================");
      console.log(JSON.stringify(comprobanteContable, null, 2));
      console.log("=======================================================\n");

      // Opcional: Aquí se podría integrar el guardado en la tabla 'payments'
      // import { sql } from '@vercel/postgres';
      // await sql`INSERT INTO payments (id, merchant, payer, amount, fee, status, tx_hash, payment_id) ...`

      // Enviar webhook a N8N con sistema de reintentos (Exponential Backoff)
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "https://TU-URL-DE-N8N/webhook/axonpay-event";
      await sendToN8NWithBackoff(n8nWebhookUrl, comprobanteContable, 5);
    }

    return NextResponse.json({ success: true, message: "Webhook procesado exitosamente" }, { status: 200 });

  } catch (error: any) {
    console.error("[Webhook Error] Falla al procesar evento de Helius:", error.message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
