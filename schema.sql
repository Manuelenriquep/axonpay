-- Schema SQL para Axonpay
-- Ejecutar en Vercel Postgres o tu base de datos

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  merchant VARCHAR(88) NOT NULL,
  payer VARCHAR(88) NOT NULL,
  amount BIGINT NOT NULL,
  fee BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  tx_hash VARCHAR(88),
  payment_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_merchant ON payments(merchant);
CREATE INDEX idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX idx_payments_payment_id ON payments(payment_id);
