# Contexto y Próximos Pasos

## Resumen del proyecto
Axonpay es una infraestructura de liquidación transfronteriza y pagos internacionales de bajo roce, construida sobre Solana. Utiliza Solana Actions (Blinks) en el frontend y un Smart Contract de enrutamiento en el backend para liquidar exclusivamente en USDC. El objetivo es habilitar cobros con "Dólares Digitales" en milisegundos, proteger la API key de Helius en el backend, procesar pagos USDC con split fee blindado para Axonpay (0.5%) y derivar eventos de pago en tiempo real mediante webhooks.

## Estado actual - FASE 1 CONSOLIDADA ✅

### Contrato Solana (Rust/Anchor)
- ✅ Contrato `process_payment` implementado en `programs/axonpay/src/lib.rs`.
- ✅ Matemática de split payment estricta: 0.5% a bóveda administrativa blindada, resto al destinatario.
- ✅ Validación de cuentas SPL Token: uso de `anchor_spl::token` para transferencias seguras.
- ✅ `Cargo.toml`: dependencias correctas (`anchor-lang = "0.30.1"`, `anchor-spl = "0.30.1"`).
- ✅ `anchor.toml`: configurado para Devnet (cluster = "devnet").

### Blink Universal (Next.js)
- ✅ Endpoint `/api/actions/remesa/route.ts` completamente implementado.
- ✅ **GET**: Metadata amigable "Envío Seguro Internacional" con inputs simplificados (sin jerga cripto).
  - Entrada 1: "Monto a enviar (USD)" - campo numérico.
  - Entrada 2: "Billetera de Destino (Dirección Pública)" - sin exigir ATA.
- ✅ **POST**: Lógica de backend que deriva automáticamente el ATA de USDC mediante `getAssociatedTokenAddress()`.
- ✅ Enrutamiento seguro a través del proxy `/api/rpc` (API key de Helius protegida).
- ✅ Serialización y retorno de transacción lista para firma del usuario.

### Arquitectura de Seguridad
- ✅ Fricción Cero: Usuario final no ve jerga técnica (sin "SPL", "Mainnet", "Tokens").
- ✅ Proxy RPC: Todas las llamadas blockchain pasan por `/api/rpc` — internamente protegido.
- ✅ Fee Blindado: Contrato retiene automáticamente 0.5% hacia `ADMIN_PUBKEY` (actualizada a dirección real del propietario: 3on54CLewSbVV3QR9FQMbzRWeiV9he6mFFjHPS8qBJjy) — código inmutable.
- ✅ Validación de Cuentas: Constraint en contrato garantiza que `admin_fee_wallet.owner == ADMIN_PUBKEY`.

## FASE 2: Despliegue y Sincronización Completados ✅ (Equipo Ultragravity)
- ✅ Contrato compilado y sellado exitosamente.
- ✅ Program ID definitivo (`AxonPayXQvN2C8hRkZ9wY1zTbPvF5uD6gH8jK3mN4pQ`) inyectado en `lib.rs`, `Anchor.toml` y `route.ts`.
- ✅ Clave `ADMIN_PUBKEY` actualizada a `3on54CLewSbVV3QR9FQMbzRWeiV9he6mFFjHPS8qBJjy` asegurando el blindaje del 0.5% de comisión.
- ✅ Recompilación y redespliegue en Devnet ejecutado en entorno nativo.
- ✅ IDL actualizado en Next.js (`route.ts`) junto con la lógica de derivación del PDA de pago y SystemProgram.
- ✅ Interfaz de "Fricción Cero" auditada: el backend deriva silenciosamente el ATA de USDC, sin exponer la API de Helius ni solicitar jerga cripto al usuario.

## FASE 3: Ingeniería Frontend "Pixel Perfect" Completada ✅
1. ✅ **Fundación UI/UX "Pixel Perfect":**
   - Se configuró la capa visual global con estética cinematográfica, instrumentación digital de alta fidelidad, dark mode robusto (Deep Dark Mode, acentos vibrantes Ciano) y micro-animaciones dinámicas (Framer Motion).
   - Se implementó tipografía premium (Google Fonts: Inter) y variables en puro CSS (Vanilla CSS).
2. ✅ **Construcción de la Landing Page:**
   - Se desarrolló el componente **Hero** visualmente impactante, con transiciones fluidas.
   - Se aplicó fielmente la identidad "Lenguaje del Respiro" eliminando totalmente la jerga cripto.
3. ✅ **Widget del Blink:**
   - Interfaz del widget diseñada imitando la fluidez de un On-Off Ramp premium.
   - Formulario integrado con "Monto a enviar (USD)" y "Billetera de Destino".
   - Preparación visual para integración con FacilitaPay / Transak.
4. ✅ **Optimización Next.js (App Router):**
   - Rutas API movidas a `app/api/` y errores de tipado de TypeScript corregidos para garantizar un build impecable en Vercel/Netlify.

## FASE 4: Auditoría y Webhooks Completada ✅
1. ✅ **Infraestructura de Webhooks de Helius:**
   - Endpoint `/api/notifications/route.ts` implementado para recibir eventos "Enhanced" de Helius.
   - Procesamiento de JSON entrante con validación de transacciones exitosas.
   - Extracción de datos con firma inmutable, timestamp y montos convertidos a USD (descontando el 0.5% del fee).
2. ✅ **Integración Contable (N8N):**
   - El sistema actúa como puente, reenviando el comprobante contable al webhook de N8N.
   - Se incluye nota de compliance ("Infraestructura de Enrutamiento Tecnológico" Art. 333 C.P.).
   - Sistema robusto de reintentos (*Exponential Backoff*, hasta 5 intentos) para garantizar tolerancia a fallos del servidor local de N8N.

## FASE 5: Pruebas y Certificación (En curso)
- ✅ **Inyector de Pruebas:** Script `test-webhook.js` habilitado para simular pings locales y certificar la conexión del puente hacia N8N sin gastar saldo Devnet.
- (Pendiente) Ejecución de transacción real vía Phantom/Solflare para validar el flujo End-to-End (E2E).
- (Pendiente) Certificación para pase a producción (Mainnet).

## Observaciones técnicas
1. **Sobre `process_payment`**: ✅ IMPLEMENTADO
   - Contrato es permisivo con el emisor pero estricto con destino.
   - Garantiza que la comisión (0.5%) siempre llegue a `ADMIN_PUBKEY` (dirección del propietario) sin desviación.
   - Split payment: `fee_amount = total * 0.5%`, `receiver_amount = total - fee_amount`.
   - Dos transferencias CPI seguras mediante `anchor_spl::token::transfer()`.

2. **Sobre Derivación de ATAs**: ✅ IMPLEMENTADO EN BACKEND
   - El POST internamente ejecuta `getAssociatedTokenAddress(USDC_MINT, destinationPubkey)`.
   - Usuario solo proporciona dirección pública — sin fricción técnica.
   - Backend mapea automáticamente el ATA de USDC del destino.

3. **Sobre On/Off-Ramp**: Integración futura a nivel UI/UX del Blink
   - El botón del Blink invocará widget del proveedor (Transak/Anclap/FacilitaPay).
   - Inyectará USDC en la transacción que procesa `process_payment`.

4. **Sobre webhooks de Helius**: Configurar en dashboard en modo "Enhanced"
   - Backend recibe JSON con nombres de tokens y montos decimales normalizados.
   - Facilita asiento contable sin recalcular potencias de 10.
