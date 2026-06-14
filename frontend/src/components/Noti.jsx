import { useState, useEffect, useCallback } from "react";
import { T } from "../styles/global";

// ── In-app toast stack (bottom-right) ──────────────────────
let _setToasts = null;

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = { ok: T.green, err: T.red, info: T.accent, warn: T.amber };
  const icons  = { ok: "✓", err: "✕", info: "i", warn: "⚠" };
  const c = colors[toast.type] || T.accent;

  return (
    <div
      onClick={onDismiss}
      style={{
        background: T.card, border: `1px solid ${c}33`,
        borderRadius: 14, padding: "12px 18px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: `0 8px 40px #0009, 0 0 0 1px ${c}22`,
        animation: "notifSlide .3s cubic-bezier(.34,1.56,.64,1)",
        cursor: "pointer", maxWidth: 340, minWidth: 240,
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: c + "20", color: c, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0,
      }}>{icons[toast.type]}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{toast.msg}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{toast.ts}</div>
      </div>
    </div>
  );
}

export function showToast(msg, type = "info") {
  if (!_setToasts) return;
  const id = Date.now() + Math.random();
  const ts = new Date().toLocaleTimeString();
  _setToasts(p => [{ id, msg, type, ts }, ...p].slice(0, 5));
}

// ── Bell notification panel ────────────────────────────────
export function NotificationPanel({ notifications, onClose }) {
  if (!notifications.length) {
    return (
      <PanelWrap onClose={onClose}>
        <div style={{ textAlign: "center", color: T.muted, fontSize: 14, padding: "40px 0" }}>
          No notifications yet
        </div>
      </PanelWrap>
    );
  }
  return (
    <PanelWrap onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.map(n => {
          const colors = { ok: T.green, err: T.red, info: T.accent, warn: T.amber };
          const c = colors[n.type] || T.accent;
          return (
            <div key={n.id} style={{
              background: T.panel, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "12px 16px",
              borderLeft: `3px solid ${c}`,
              animation: "fadeUp .3s ease",
            }}>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{n.msg}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{n.ts}</div>
            </div>
          );
        })}
      </div>
    </PanelWrap>
  );
}

function PanelWrap({ children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
    }} onClick={onClose}>
      <div style={{
        position: "absolute", top: 70, right: 24, width: 340,
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 18, padding: 20, boxShadow: "0 20px 60px #0009",
        animation: "fadeUp .25s ease",
        maxHeight: "70vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: T.text }}>Notifications</div>
        {children}
      </div>
    </div>
  );
}