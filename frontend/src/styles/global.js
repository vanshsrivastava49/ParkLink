export const T = {
  bg:        "#07090f",
  panel:     "#0c0f1a",
  card:      "#111520",
  cardHover: "#161c2e",
  border:    "#1c2240",
  borderLt:  "#242b4a",
  accent:    "#4f6ff5",
  accentLt:  "#7b95ff",
  accentDk:  "#3352cc",
  green:     "#10d98a",
  red:       "#ff4560",
  amber:     "#ffb020",
  cyan:      "#22d3ee",
  text:      "#dde2f5",
  sub:       "#8891b8",
  muted:     "#454d70",
  white:     "#ffffff",
};

const FONT = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap";

export function injectGlobalStyles() {
  if (document.getElementById("pl-global-styles")) return;

  const link = document.createElement("link");
  link.rel = "stylesheet"; link.href = FONT;
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.id = "pl-global-styles";
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: ${T.bg};
      color: ${T.text};
      font-family: 'Outfit', sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${T.panel}; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${T.muted}; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes slideRight {
      from { opacity: 0; transform: translateX(-20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: .6; transform: scale(.95); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes notifSlide {
      from { opacity: 0; transform: translateX(110%); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px ${T.accent}30; }
      50%       { box-shadow: 0 0 40px ${T.accent}60; }
    }
  `;
  document.head.appendChild(style);
}