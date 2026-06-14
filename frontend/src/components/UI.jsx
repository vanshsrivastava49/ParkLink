import { T } from "../styles/global";

// ── Avatar ─────────────────────────────────────────────────
export function Avatar({ initials, color, size = 40, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color || T.accent}, ${color ? color + "99" : T.accentDk})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', sans-serif", fontWeight: 800,
      fontSize: size * 0.38, color: "#fff", flexShrink: 0,
      boxShadow: `0 0 20px ${color || T.accent}40`,
      ...style,
    }}>{initials}</div>
  );
}

// ── Button ─────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", size = "md", disabled, style = {}, fullWidth }) {
  const base = {
    fontFamily: "'Outfit', sans-serif", fontWeight: 700,
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 12, transition: "all .2s", display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    opacity: disabled ? .4 : 1, width: fullWidth ? "100%" : "auto",
  };
  const sizes = {
    sm: { padding: "8px 16px", fontSize: 13 },
    md: { padding: "11px 22px", fontSize: 14 },
    lg: { padding: "14px 28px", fontSize: 16 },
  };
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
      color: "#fff",
      boxShadow: `0 4px 20px ${T.accent}40`,
    },
    ghost: {
      background: "transparent", color: T.sub,
      border: `1px solid ${T.border}`,
    },
    danger: {
      background: `linear-gradient(135deg, ${T.red}, #c0002b)`,
      color: "#fff",
    },
    success: {
      background: `linear-gradient(135deg, ${T.green}, #0aaa6a)`,
      color: "#fff",
    },
    amber: {
      background: `linear-gradient(135deg, ${T.amber}, #cc8500)`,
      color: "#fff",
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = ".82"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
}

// ── Input ──────────────────────────────────────────────────
export function Input({ label, value, onChange, type = "text", placeholder, error, icon, readOnly, options }) {
  const inputStyle = {
    width: "100%", background: T.card, border: `1px solid ${error ? T.red : T.border}`,
    borderRadius: 10, padding: icon ? "11px 14px 11px 40px" : "11px 14px",
    color: T.text, fontFamily: "'Outfit', sans-serif", fontSize: 14,
    outline: "none", transition: "border-color .2s",
    opacity: readOnly ? .6 : 1,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", color: T.sub, fontSize: 12, fontWeight: 600, letterSpacing: ".5px", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>{icon}</span>}
        {options ? (
          <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            type={type} value={value} placeholder={placeholder}
            readOnly={readOnly}
            onChange={readOnly ? undefined : e => onChange(e.target.value)}
            style={inputStyle}
            onFocus={e => { if (!readOnly) e.target.style.borderColor = T.accent; }}
            onBlur={e => { e.target.style.borderColor = error ? T.red : T.border; }}
          />
        )}
      </div>
      {error && <div style={{ color: T.red, fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────
export function Card({ children, style = {}, glow, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 18, padding: 24,
        animation: glow ? "glow 3s ease-in-out infinite" : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color .2s, transform .2s",
        ...style,
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = T.borderLt; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; } }}
    >{children}</div>
  );
}

// ── Pill badge ─────────────────────────────────────────────
export function Pill({ label, color, dot = true }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}33`,
      borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".3px",
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />}
      {label}
    </span>
  );
}

// ── Section label ──────────────────────────────────────────
export function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "3px",
      textTransform: "uppercase", color: T.muted, marginBottom: 16,
      fontFamily: "'JetBrains Mono', monospace", ...style,
    }}>{children}</div>
  );
}

// ── Divider ────────────────────────────────────────────────
export function Divider({ style = {} }) {
  return <div style={{ height: 1, background: T.border, marginBlock: 24, ...style }} />;
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ size = 20, color }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${T.border}`,
      borderTopColor: color || T.accent,
      animation: "spin .7s linear infinite",
    }} />
  );
}