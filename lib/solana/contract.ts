export const AXONPAY_PROGRAM_ID = "AxonPayXQvN2C8hRkZ9wY1zTbPvF5uD6gH8jK3mN4pQ";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const ADMIN_FEE_PUBKEY = "GuanesFee11111111111111111111111111111111111";

export const IDL = {
  version: "0.1.0",
  name: "axonpay",
  instructions: [
    {
      name: "processPayment",
      accounts: [
        { name: "payment", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "userTokenAccount", isMut: true, isSigner: false },
        { name: "adminFeeTokenAccount", isMut: true, isSigner: false },
        { name: "merchantTokenAccount", isMut: true, isSigner: false },
        { name: "adminFeeAccount", isMut: false, isSigner: false },
        { name: "merchant", isMut: false, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "paymentId", type: "u64" },
      ],
    },
  ],
};
