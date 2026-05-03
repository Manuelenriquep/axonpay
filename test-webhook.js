const fetch = require('node-fetch'); // Requiere Node 18+ o usar fetch nativo

const webhookUrl = 'http://localhost:3000/api/notifications';

const mockPayload = [
  {
    description: "Mock USDC Transfer",
    type: "TRANSFER",
    source: "SYSTEM_PROGRAM",
    signature: "5xyzMockSignature1234567890abcdef",
    timestamp: Math.floor(Date.now() / 1000),
    transactionError: null,
    tokenTransfers: [
      {
        fromUserAccount: "SenderWalletXYZ123",
        toUserAccount: "MerchantWalletABC456",
        tokenAmount: 99.50,
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC
      },
      {
        fromUserAccount: "SenderWalletXYZ123",
        toUserAccount: "3on54CLewSbVV3QR9FQMbzRWeiV9he6mFFjHPS8qBJjy", // Admin Fee Wallet
        tokenAmount: 0.50,
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC
      }
    ],
    accountData: []
  }
];

async function ping() {
  console.log(`Enviando Ping de prueba a ${webhookUrl}...`);
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });

    const data = await response.json();
    console.log("Respuesta del servidor:", response.status, data);
    
    if (response.ok) {
      console.log("✅ Ping procesado correctamente. Revisa los logs de tu servidor Next.js y el dashboard de N8N.");
    } else {
      console.log("❌ Hubo un error procesando el Ping.");
    }
  } catch (error) {
    console.error("Error conectando con el servidor local:", error.message);
    console.log("Asegúrate de que tu servidor Next.js esté corriendo (npm run dev)");
  }
}

ping();
