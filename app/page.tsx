"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate transaction delay
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", background: "rgba(2, 6, 23, 0.8)", backdropFilter: "blur(10px)", zIndex: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--cyan)", boxShadow: "0 0 10px var(--cyan)" }}></div>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "1px", color: "var(--text-primary)" }}>AXONPAY</span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem", letterSpacing: "1px" }}>DEVNET STATUS: <span className="text-cyan">ONLINE</span></span>
        </div>
      </motion.nav>

      {/* Hero Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 5%", position: "relative" }}>
        
        {/* Abstract Background Elements */}
        <div style={{ position: "absolute", top: "20%", left: "-10%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 70%)", filter: "blur(40px)", zIndex: 0 }} />
        
        <div style={{ display: "flex", flexWrap: "wrap", width: "100%", maxWidth: "1400px", margin: "0 auto", zIndex: 1, gap: "40px", alignItems: "center" }}>
          
          {/* Left Column: Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <h1 style={{ fontSize: "4rem", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1px" }}>
              Precisión <span className="text-cyan glow-text">Financiera</span><br/>
              Sin Fricción.
            </h1>
            <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: 1.6 }}>
              El motor de liquidación institucional diseñado para eliminar la ansiedad técnica. Envía dólares a nivel global con liquidación en milisegundos.
            </p>
            <div style={{ display: "flex", gap: "32px", marginTop: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "2rem", fontWeight: 600, color: "var(--text-primary)" }}>0.5%</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Fee Fijo</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "2rem", fontWeight: 600, color: "var(--text-primary)" }}>~400ms</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Liquidación</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            style={{ flex: "1 1 400px", display: "flex", justifyContent: "center" }}
          >
            <div className="glass-panel" style={{ width: "100%", maxWidth: "420px", padding: "32px", position: "relative", overflow: "hidden" }}>
              {/* Scanline effect */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, var(--cyan), transparent)", opacity: 0.5, animation: "scanline 4s linear infinite" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Envío Seguro Internacional</h2>
                <div style={{ padding: "4px 8px", background: "rgba(0, 240, 255, 0.1)", borderRadius: "4px", fontSize: "0.75rem", color: "var(--cyan)", fontWeight: 600, letterSpacing: "1px" }}>
                  USDC
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label className="label">Monto a enviar (USD)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>$</span>
                    <input 
                      type="number" 
                      min="1"
                      step="0.01"
                      className="input-field" 
                      style={{ paddingLeft: "32px" }}
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Billetera de Destino</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej. 3on54CLewSbVV..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>

                {/* On-Ramp Integration Placeholder */}
                <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px dashed var(--glass-border)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Procesador Fiat</span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#00F0FF" }}></div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>FacilitaPay / Transak</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isLoading}
                  style={{ marginTop: "8px", position: "relative", overflow: "hidden" }}
                >
                  {isLoading ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{ width: "20px", height: "20px", border: "2px solid #020617", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto" }}
                    />
                  ) : success ? (
                    "Pago Enviado ✓"
                  ) : (
                    "Autorizar Envío"
                  )}
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500px); }
        }
      `}} />
    </main>
  );
}
