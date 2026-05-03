import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AXONPAY_PROGRAM_ID, USDC_MINT, ADMIN_FEE_PUBKEY } from "./contract";

export function getPaymentPDA(
  userPublicKey: PublicKey,
  paymentId: bigint
): [PublicKey, number] {
  const paymentIdBuffer = Buffer.alloc(8);
  paymentIdBuffer.writeBigUInt64LE(paymentId);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("payment"),
      userPublicKey.toBuffer(),
      paymentIdBuffer,
    ],
    new PublicKey(AXONPAY_PROGRAM_ID)
  );
}

export function createProcessPaymentInstruction(
  userPublicKey: PublicKey,
  merchantPublicKey: PublicKey,
  amount: bigint,
  paymentId: bigint
): TransactionInstruction {
  const programId = new PublicKey(AXONPAY_PROGRAM_ID);
  const usdcMint = new PublicKey(USDC_MINT);
  const adminFeeAccount = new PublicKey(ADMIN_FEE_PUBKEY);

  const [paymentPDA] = getPaymentPDA(userPublicKey, paymentId);

  const userTokenAccount = getAssociatedTokenAddress(userPublicKey, usdcMint);
  const adminFeeTokenAccount = getAssociatedTokenAddress(adminFeeAccount, usdcMint);
  const merchantTokenAccount = getAssociatedTokenAddress(merchantPublicKey, usdcMint);

  const keys = [
    { pubkey: paymentPDA, isSigner: false, isWritable: true },
    { pubkey: userPublicKey, isSigner: true, isWritable: true },
    { pubkey: userTokenAccount, isSigner: false, isWritable: true },
    { pubkey: adminFeeTokenAccount, isSigner: false, isWritable: true },
    { pubkey: merchantTokenAccount, isSigner: false, isWritable: true },
    { pubkey: adminFeeAccount, isSigner: false, isWritable: false },
    { pubkey: merchantPublicKey, isSigner: false, isWritable: false },
    { pubkey: usdcMint, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  const data = Buffer.alloc(16);
  data.writeBigUInt64LE(amount, 0);
  data.writeBigUInt64LE(paymentId, 8);

  return new TransactionInstruction({
    programId,
    keys,
    data,
  });
}

function getAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}
