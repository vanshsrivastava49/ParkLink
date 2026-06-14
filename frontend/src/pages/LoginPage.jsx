import { useState } from "react";
import { USERS_DB } from "../data/users";
import { T } from "../styles/global";
import { Btn, Input, Spinner } from "../components/UI";

// ── Animated background nodes ──────────────────────────────
function GridDots() {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: .07, pointerEvents: "none", zIndex: 0 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={T.accent} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!password)     { setError("Password is required"); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 700)); // UX delay

    const user = USERS_DB.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(user);
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <GridDots />

      {/* Glow blobs */}
      <div style={{ position: "fixed", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${T.accent}18 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${T.cyan}10 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeUp .6s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, marginBottom: 16, boxShadow: `0 0 40px ${T.accent}50` }}>
            <span style={{ fontSize: 28 }}>🅿</span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-1px" }}>
            <span style={{ color: T.accent }}>Park</span>Link
          </div>
          <div style={{ color: T.muted, fontSize: 13, letterSpacing: "3px", textTransform: "uppercase", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            Smart Parking System
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 24, padding: 36,
          boxShadow: "0 24px 80px #0009",
          animation: "fadeUp .7s ease .1s both",
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Welcome back</div>
            <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Sign in to manage your parking slot</div>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="EMAIL ADDRESS"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@example.com"
              icon="✉"
            />

            <div style={{ position: "relative" }}>
              <Input
                label="PASSWORD"
                value={password}
                onChange={setPassword}
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                icon="🔒"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: "absolute", right: 14, top: 34,
                  background: "none", border: "none", cursor: "pointer",
                  color: T.muted, fontSize: 13, fontFamily: "'Outfit', sans-serif",
                }}
              >{showPass ? "Hide" : "Show"}</button>
            </div>

            {error && (
              <div style={{
                background: T.red + "15", border: `1px solid ${T.red}33`,
                color: T.red, borderRadius: 10, padding: "10px 14px",
                fontSize: 13, marginBottom: 16, animation: "fadeIn .2s ease",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            <Btn
              onClick={handleSubmit}
              fullWidth
              size="lg"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? <><Spinner size={16} color="#fff" /> Signing in...</> : "Sign In →"}
            </Btn>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, color: T.muted, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", animation: "fadeUp .8s ease .2s both" }}>
          ParkLink v2.0 · IoT Smart Parking
        </div>
      </div>
    </div>
  );
}