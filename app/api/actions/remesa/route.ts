import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createPostResponse,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  MintLayout,
} from "@solana/spl-token";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";

// CORS headers para Solana Actions
const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// IDL del contrato (generado después del anchor build)
const IDL: any = {
  version: "0.1.0",
  name: "axonpay",
  instructions: [
    {
      name: "processPayment",
      accounts: [
        { name: "payment", isMut: true, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "payerTokenAccount", isMut: true, isSigner: false },
        { name: "merchant", isMut: false, isSigner: false },
        { name: "merchantTokenAccount", isMut: true, isSigner: false },
        { name: "adminFeeWallet", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "paymentId", type: "u64" }
      ],
    },
  ],
};

// Program ID (reemplazar con el generado después del build)
const PROGRAM_ID = new PublicKey("AxonPayXQvN2C8hRkZ9wY1zTbPvF5uD6gH8jK3mN4pQ");

// USDC Mint en Solana Devnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Admin Pubkey (del contrato - blindada)
const ADMIN_PUBKEY = new PublicKey("3on54CLewSbVV3QR9FQMbzRWeiV9he6mFFjHPS8qBJjy");

// Conexión a través del proxy /api/rpc (seguridad garantizada)
const connection = new Connection(process.env.HELIUS_RPC_URL || "https://api.devnet.solana.com", "confirmed");

export async function GET(request: Request) {
  const payload: any = {
    title: "Envío Seguro Internacional",
    description:
      "Envía dólares digitales de forma segura y rápida a cualquier destino. Ingresa el monto en USD y la billetera de destino (dirección pública).",
    inputs: [
      {
        name: "amount",
        label: "Monto a enviar (USD)",
        type: "number",
        required: true,
        min: 1,
      },
      {
        name: "destination",
        label: "Billetera de Destino (Dirección Pública)",
        type: "text",
        required: true,
      },
    ],
  };
  return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    const user = new PublicKey(body.account);

    // Parsear inputs
    const amountUSD = parseFloat(body.data.amount);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      return Response.json(
        { error: "Monto inválido" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }
    // Convertir USD a USDC (1 USD = 1 USDC con 6 decimales)
    const totalAmount = Math.floor(amountUSD * 1_000_000);

    // Recibir solo la billetera de destino (dirección pública)
    const destinationWallet = body.data.destination;
    let destinationPubkey: PublicKey;
    try {
      destinationPubkey = new PublicKey(destinationWallet);
    } catch {
      return Response.json(
        { error: "Billetera de destino inválida" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // Backend: Derivar el ATA de USDC para el destino (sin fricción al usuario)
    const receiverTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      destinationPubkey
    );

    // Obtener ATA del remitente
    const senderTokenAccount = await getAssociatedTokenAddress(USDC_MINT, user);

    // Obtener ATA del admin
    const adminTokenAccount = await getAssociatedTokenAddress(USDC_MINT, ADMIN_PUBKEY);

    // Crear provider (sin wallet en el servidor)
    const provider = new AnchorProvider(connection, {} as any, {});

    IDL.address = PROGRAM_ID.toBase58();
    const program = new Program(IDL as any, provider as any) as any;

    const paymentId = new BN(Date.now());
    const [paymentAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment"), user.toBuffer(), paymentId.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    );

    // Crear instrucción invocando process_payment
    const instruction = await program.methods
      .processPayment(new BN(totalAmount), paymentId)
      .accounts({
        payment: paymentAccountPda,
        payer: user,
        payerTokenAccount: senderTokenAccount,
        merchant: destinationPubkey,
        merchantTokenAccount: receiverTokenAccount,
        adminFeeWallet: adminTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    // Crear transacción
    const transaction = new Transaction().add(instruction);

    // Obtener blockhash reciente desde el proxy
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = user;

    // Serializar
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: `Confirmar envío de ${amountUSD} USD a ${destinationWallet}`,
      },
    });

    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Error interno al procesar la transacción" },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}