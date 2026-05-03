import { Connection, BlockhashWithExpiryBlockHeight } from "@solana/web3.js";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export function getHeliusConnection(): Connection {
  if (!HELIUS_API_KEY) {
    console.warn("HELIUS_API_KEY no configurada. Usando Helius sin clave en la URL.");
  }
  return new Connection(HELIUS_RPC_URL, "confirmed");
}

export async function getLatestBlockhash(): Promise<BlockhashWithExpiryBlockHeight> {
  const connection = getHeliusConnection();
  return await connection.getLatestBlockhash("confirmed");
}
