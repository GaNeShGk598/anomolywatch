import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEMES ─────────────────────────────────────────────────────────────────
const THEMES = {
  midnight: {
    name: "Midnight",
    bg: "linear-gradient(135deg,#0a0c14 0%,#0d1022 100%)",
    bgSolid: "#0a0c14",
    glass: "rgba(16,20,38,0.72)",
    glassBorder: "rgba(255,255,255,0.07)",
    glassHover: "rgba(255,255,255,0.04)",
    accent: "#6ee7f7",
    accentGlow: "rgba(110,231,247,0.15)",
    accent2: "#818cf8",
    danger: "#f87171",
    dangerGlow: "rgba(248,113,113,0.18)",
    warn: "#fb923c",
    warnGlow: "rgba(251,146,60,0.15)",
    success: "#4ade80",
    text: "#e2e8f0",
    textDim: "#64748b",
    textMuted: "#334155",
    textStrong: "#f8fafc",
    border: "rgba(255,255,255,0.06)",
    borderAccent: "rgba(110,231,247,0.3)",
    shadow: "0 8px 32px rgba(0,0,0,0.5)",
    shadowSm: "0 2px 12px rgba(0,0,0,0.4)",
    blur: "blur(20px)",
  },
  slate: {
    name: "Slate",
    bg: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)",
    bgSolid: "#0f172a",
    glass: "rgba(15,23,42,0.75)",
    glassBorder: "rgba(148,163,184,0.08)",
    glassHover: "rgba(148,163,184,0.04)",
    accent: "#a78bfa",
    accentGlow: "rgba(167,139,250,0.15)",
    accent2: "#38bdf8",
    danger: "#fb7185",
    dangerGlow: "rgba(251,113,133,0.18)",
    warn: "#fbbf24",
    warnGlow: "rgba(251,191,36,0.15)",
    success: "#34d399",
    text: "#cbd5e1",
    textDim: "#64748b",
    textMuted: "#1e293b",
    textStrong: "#f1f5f9",
    border: "rgba(148,163,184,0.07)",
    borderAccent: "rgba(167,139,250,0.3)",
    shadow: "0 8px 32px rgba(0,0,0,0.6)",
    shadowSm: "0 2px 12px rgba(0,0,0,0.5)",
    blur: "blur(20px)",
  },
  aurora: {
    name: "Aurora",
    bg: "linear-gradient(135deg,#042f2e 0%,#0c1a2e 50%,#1a0533 100%)",
    bgSolid: "#042f2e",
    glass: "rgba(4,47,46,0.7)",
    glassBorder: "rgba(255,255,255,0.08)",
    glassHover: "rgba(255,255,255,0.04)",
    accent: "#2dd4bf",
    accentGlow: "rgba(45,212,191,0.2)",
    accent2: "#c084fc",
    danger: "#f87171",
    dangerGlow: "rgba(248,113,113,0.18)",
    warn: "#fcd34d",
    warnGlow: "rgba(252,211,77,0.15)",
    success: "#86efac",
    text: "#ccfbf1",
    textDim: "#5eead4",
    textMuted: "#134e4a",
    textStrong: "#f0fdfa",
    border: "rgba(45,212,191,0.1)",
    borderAccent: "rgba(45,212,191,0.35)",
    shadow: "0 8px 32px rgba(0,0,0,0.5)",
    shadowSm: "0 2px 12px rgba(0,0,0,0.4)",
    blur: "blur(20px)",
  },
  frost: {
    name: "Frost",
    bg: "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%)",
    bgSolid: "#f0f9ff",
    glass: "rgba(255,255,255,0.6)",
    glassBorder: "rgba(14,165,233,0.12)",
    glassHover: "rgba(14,165,233,0.06)",
    accent: "#0284c7",
    accentGlow: "rgba(2,132,199,0.15)",
    accent2: "#7c3aed",
    danger: "#dc2626",
    dangerGlow: "rgba(220,38,38,0.12)",
    warn: "#d97706",
    warnGlow: "rgba(217,119,6,0.12)",
    success: "#16a34a",
    text: "#1e3a5f",
    textDim: "#64748b",
    textMuted: "#e0f2fe",
    textStrong: "#0c1a2e",
    border: "rgba(14,165,233,0.1)",
    borderAccent: "rgba(2,132,199,0.3)",
    shadow: "0 8px 32px rgba(14,165,233,0.12)",
    shadowSm: "0 2px 12px rgba(14,165,233,0.08)",
    blur: "blur(20px)",
  },
  carbon: {
    name: "Carbon",
    bg: "linear-gradient(135deg,#111 0%,#1a1a1a 100%)",
    bgSolid: "#111",
    glass: "rgba(26,26,26,0.8)",
    glassBorder: "rgba(255,255,255,0.05)",
    glassHover: "rgba(255,255,255,0.03)",
    accent: "#f4f4f5",
    accentGlow: "rgba(244,244,245,0.1)",
    accent2: "#a3a3a3",
    danger: "#ef4444",
    dangerGlow: "rgba(239,68,68,0.18)",
    warn: "#f59e0b",
    warnGlow: "rgba(245,158,11,0.15)",
    success: "#22c55e",
    text: "#a1a1aa",
    textDim: "#52525b",
    textMuted: "#27272a",
    textStrong: "#fafafa",
    border: "rgba(255,255,255,0.05)",
    borderAccent: "rgba(244,244,245,0.2)",
    shadow: "0 8px 32px rgba(0,0,0,0.7)",
    shadowSm: "0 2px 12px rgba(0,0,0,0.6)",
    blur: "blur(20px)",
  },
};

// ─── ATTACK TYPES ────────────────────────────────────────────────────────────
const ATTACK_TYPES = [
  {
    id: "ddos", name: "DDoS Flood", color: "#3b82f6",
    description: "Distributed Denial-of-Service flooding endpoints with 847k req/s from 12,400 botnet nodes across 38 countries.",
    phases: [
      "Botnet activation — 12,400 compromised nodes coming online",
      "SYN flood — TCP handshake table exhaustion in progress",
      "UDP amplification via DNS reflection — 3.2 Tbps peak",
      "Load balancer overwhelmed — dropping legitimate traffic",
      "API gateway saturated — 503 errors cascading system-wide",
    ],
    metrics: { rps: 980, latency: 590, errors: 28, cpu: 97 },
  },
  {
    id: "ransomware", name: "Ransomware", color: "#ef4444",
    description: "LockBit 3.0 encrypting filesystem via AES-256 + RSA-2048. Lateral movement via SMB across 6 nodes.",
    phases: [
      "Initial access via phishing email — malicious macro executed",
      "Privilege escalation — CVE-2024-1234 local exploit deployed",
      "Lateral movement — SMB relay across subnet 10.0.1.0/24",
      "Shadow copies deleted — vssadmin.exe terminated",
      "Encryption active — 94,218 files locked, ransom note dropped",
    ],
    metrics: { disk: 390, cpu: 94, mem: 91, errors: 22 },
  },
  {
    id: "mitm", name: "Man-in-the-Middle", color: "#f97316",
    description: "ARP poisoning active. TLS traffic intercepted between API server and DB. Cert spoofing on internal LAN.",
    phases: [
      "ARP cache poisoning — gateway MAC overwritten on 4 hosts",
      "SSL stripping — HTTPS downgraded to HTTP",
      "Fake certificate injected — CN=internal-db.corp spoofed",
      "Credential harvesting — 3 DB passwords captured in plaintext",
      "Session tokens extracted — 14 active sessions hijacked",
    ],
    metrics: { latency: 340, errors: 15, mem: 78 },
  },
  {
    id: "cryptojack", name: "Cryptojacking", color: "#a855f7",
    description: "Monero miner (XMRig) deployed on 5 servers. CPU at 99%. C2 beacon to mining pool every 60s.",
    phases: [
      "Dropper via vulnerable npm package (event-stream fork)",
      "XMRig unpacked to /tmp/.systemd-cache/ — hidden process",
      "CPU governor set to performance — thermal limits disabled",
      "Persistence via crontab + systemd service",
      "Mining active — 4.7 H/s per node, C2 beacon active",
    ],
    metrics: { cpu: 99, mem: 88, disk: 280, rps: 45 },
  },
  {
    id: "sqli", name: "SQL Injection", color: "#10b981",
    description: "Blind SQLi campaign on /api/users via sqlmap. Extracting schema and dumping 128k-row credentials table.",
    phases: [
      "Reconnaissance — 4,200 malformed queries probing validation",
      "Boolean-based blind SQLi confirmed — timing attack active",
      "Database schema extracted — 23 tables enumerated",
      "Credential dump — users table (128,430 rows) exfiltrating",
      "xp_cmdshell escalation — OS command execution active",
    ],
    metrics: { errors: 19, latency: 280, rps: 620 },
  },
];

// ─── NETWORK TOPOLOGIES ──────────────────────────────────────────────────────
const TOPOLOGY_SMALL = {
  id: "small",
  name: "Network 1",
  subtitle: "Client — Server",
  nodes: [
    { id: "client", label: "Client Machine", type: "client",   x: 200, y: 180, ip: "192.168.1.10" },
    { id: "server", label: "Server",         type: "server",   x: 600, y: 180, ip: "192.168.1.1"  },
  ],
  edges: [["client","server"]],
};

const TOPOLOGY_COLLEGE = {
  id: "college",
  name: "Network 2",
  subtitle: "College Campus Network",
  nodes: [
    { id: "isp",       label: "ISP / WAN",          type: "external",  x: 460, y: 40  },
    { id: "core-sw",   label: "Core Switch",         type: "switch",    x: 460, y: 140 },
    { id: "fw",        label: "Firewall",            type: "security",  x: 460, y: 240 },
    { id: "router",    label: "Campus Router",       type: "router",    x: 460, y: 340 },
    { id: "dist-sw1",  label: "Dist. Switch A",      type: "switch",    x: 200, y: 450 },
    { id: "dist-sw2",  label: "Dist. Switch B",      type: "switch",    x: 720, y: 450 },
    { id: "ap-lib",    label: "Library AP",          type: "wireless",  x: 80,  y: 570 },
    { id: "lab-sw",    label: "Lab Switch",          type: "switch",    x: 240, y: 570 },
    { id: "admin-sw",  label: "Admin Switch",        type: "switch",    x: 600, y: 570 },
    { id: "ap-hostel", label: "Hostel AP",           type: "wireless",  x: 840, y: 570 },
    { id: "srv-dc",    label: "Domain Controller",   type: "server",    x: 460, y: 460 },
    { id: "lab-pc1",   label: "Lab PC Cluster",      type: "client",    x: 180, y: 680 },
    { id: "lab-pc2",   label: "Lab PC Cluster B",    type: "client",    x: 320, y: 680 },
    { id: "admin-pc",  label: "Admin Workstation",   type: "client",    x: 560, y: 680 },
    { id: "nas",       label: "NAS Storage",         type: "database",  x: 700, y: 680 },
  ],
  edges: [
    ["isp","core-sw"],["core-sw","fw"],["fw","router"],
    ["router","dist-sw1"],["router","dist-sw2"],["router","srv-dc"],
    ["dist-sw1","ap-lib"],["dist-sw1","lab-sw"],
    ["dist-sw2","admin-sw"],["dist-sw2","ap-hostel"],
    ["lab-sw","lab-pc1"],["lab-sw","lab-pc2"],
    ["admin-sw","admin-pc"],["admin-sw","nas"],
  ],
};

TOPOLOGY_COLLEGE.nodes.forEach((n, i) => {
  if (!n.ip) n.ip = "10.10." + (Math.floor(i / 5) + 1) + "." + (10 + i);
});

const NODE_TYPE_COLORS = {
  external: "#94a3b8", security: "#f97316", switch: "#3b82f6",
  router: "#8b5cf6", server: "#10b981", client: "#06b6d4",
  wireless: "#f59e0b", database: "#a855f7", gateway: "#6366f1", ml: "#ec4899",
};

const NODE_TYPE_ICON = {
  external: "WAN", security: "FW", switch: "SW", router: "RT",
  server: "SRV", client: "PC", wireless: "AP", database: "DB",
  gateway: "GW", ml: "ML",
};

// ─── METRICS CONFIG ───────────────────────────────────────────────────────────
const METRICS_CONFIG = [
  { id: "cpu",     label: "CPU",         unit: "%",    base: 45,  min: 0, max: 100,  color: "#6ee7f7" },
  { id: "mem",     label: "Memory",      unit: "%",    base: 62,  min: 0, max: 100,  color: "#a78bfa" },
  { id: "latency", label: "Latency",     unit: "ms",   base: 120, min: 0, max: 600,  color: "#fb923c" },
  { id: "rps",     label: "Req / sec",   unit: "",     base: 340, min: 0, max: 1000, color: "#38bdf8" },
  { id: "errors",  label: "Error Rate",  unit: "%",    base: 1.2, min: 0, max: 30,   color: "#f87171" },
  { id: "disk",    label: "Disk I/O",    unit: "MB/s", base: 85,  min: 0, max: 400,  color: "#c084fc" },
];

// ─── ML helpers ──────────────────────────────────────────────────────────────
function anomalyScore(v, hist) {
  if (hist.length < 10) return 0;
  const vals = hist.slice(-50);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const std  = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
  return Math.min(1, Math.abs(v - mean) / std / 4);
}
function genMetric(prev, burst, target) {
  if (target !== undefined) return prev + (target - prev) * 0.18 + (Math.random() - 0.5) * 3;
  const spike = burst && Math.random() > 0.6;
  const drift = prev + (Math.random() - 0.49) * 4;
  return spike ? drift + (Math.random() > 0.5 ? 40 : -40) : drift;
}
function initMetrics() {
  return Object.fromEntries(
    METRICS_CONFIG.map(m => [m.id, { current: m.base, history: Array(60).fill(m.base), score: 0, anomalous: false }])
  );
}

// ─── Glass box helper ─────────────────────────────────────────────────────────
const glass = (T, extra = {}) => ({
  background: T.glass,
  backdropFilter: T.blur,
  WebkitBackdropFilter: T.blur,
  border: `1px solid ${T.glassBorder}`,
  boxShadow: T.shadow,
  borderRadius: 16,
  ...extra,
});

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, anomalous, T }) {
  const w = 150, h = 36;
  const lo = Math.min(...data), hi = Math.max(...data) || lo + 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h-((v-lo)/(hi-lo))*h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={`sg${color.replace("#","")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={anomalous ? T.danger : color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={anomalous ? T.danger : color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={anomalous ? T.danger : color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Pill({ label, color, T, pulse }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: color + "18", color, border: `1px solid ${color}35`,
      borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600,
      letterSpacing: 0.5, fontFamily: "var(--mono)",
      animation: pulse ? "pulse 1.4s ease-in-out infinite" : "none",
    }}>
      {pulse && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block", animation: "pulse 1s ease-in-out infinite" }}/>}
      {label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, T }) {
  return (
    <div style={{ position: "fixed", top: 68, right: 20, zIndex: 9999, width: 320, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          ...glass(T, { borderRadius: 12, marginBottom: 10 }),
          border: `1px solid ${t.color}40`,
          padding: "12px 16px", animation: "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, flexShrink: 0 }}/>
            <span style={{ color: t.color, fontWeight: 700, fontSize: 11, letterSpacing: 0.5, fontFamily: "var(--mono)" }}>{t.title}</span>
          </div>
          <div style={{ color: T.text, fontSize: 11, lineHeight: 1.5, paddingLeft: 14 }}>{t.message}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Alert row ────────────────────────────────────────────────────────────────
function AlertRow({ alert, onDismiss, T }) {
  const isA = alert.type === "attack";
  const sev = isA ? alert.severity : alert.score > 0.8 ? "CRITICAL" : alert.score > 0.5 ? "HIGH" : "MEDIUM";
  const col = sev === "CRITICAL" ? T.danger : sev === "HIGH" ? T.warn : T.accent;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      background: col + "0e", border: `1px solid ${col}30`, borderLeft: `2px solid ${col}`,
      borderRadius: 8, padding: "9px 12px", marginBottom: 6, animation: "fadeUp 0.25s ease",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ color: col, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "var(--mono)" }}>{sev}</span>
          <span style={{ color: T.textDim, fontSize: 10, fontFamily: "var(--mono)" }}>{alert.time}</span>
        </div>
        <div style={{ color: T.text, fontSize: 12, lineHeight: 1.4 }}>
          {isA
            ? <><span style={{ color: T.textStrong, fontWeight: 600 }}>[{alert.attackName}]</span> {alert.message}</>
            : <><span style={{ color: T.textStrong, fontWeight: 600 }}>{alert.metric}</span> anomaly detected — score <span style={{ color: col }}>{(alert.score*100).toFixed(0)}%</span>, value <span style={{ color: T.textStrong }}>{alert.value}</span></>
          }
        </div>
      </div>
      {onDismiss && (
        <button onClick={() => onDismiss(alert.id)} style={{
          background: "none", border: "none", color: T.textDim, cursor: "pointer",
          fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0, opacity: 0.6,
        }}>×</button>
      )}
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({ cfg, m, T }) {
  const pct = Math.min(100, ((m.current - cfg.min) / (cfg.max - cfg.min)) * 100);
  return (
    <div style={{
      ...glass(T, { borderRadius: 14, padding: "18px 18px 14px", position: "relative", overflow: "hidden" }),
      border: m.anomalous ? `1px solid ${T.danger}50` : `1px solid ${T.glassBorder}`,
      boxShadow: m.anomalous ? `0 0 24px ${T.dangerGlow}, ${T.shadow}` : T.shadow,
      transition: "box-shadow 0.4s, border-color 0.4s",
    }}>
      {/* Glow stripe top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: m.anomalous ? T.danger : cfg.color, opacity: 0.7, borderRadius: "14px 14px 0 0" }}/>

      {m.anomalous && (
        <div style={{ position: "absolute", top: 8, right: 10 }}>
          <Pill label="ANOMALY" color={T.danger} T={T} pulse />
        </div>
      )}

      <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: 10 }}>{cfg.label}</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: m.anomalous ? T.danger : cfg.color, fontFamily: "var(--display)", letterSpacing: -1, transition: "color 0.3s" }}>
          {m.current.toFixed(1)}
        </span>
        <span style={{ fontSize: 11, color: T.textDim, fontFamily: "var(--mono)" }}>{cfg.unit}</span>
      </div>

      {/* Progress track */}
      <div style={{ background: T.border, borderRadius: 4, height: 3, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: m.anomalous ? T.danger : cfg.color, borderRadius: 4, transition: "width 0.5s, background 0.3s" }}/>
      </div>

      <Sparkline data={m.history} color={cfg.color} anomalous={m.anomalous} T={T} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: T.textDim, fontFamily: "var(--mono)" }}>
          score <span style={{ color: m.score > 0.5 ? T.danger : T.textDim }}>{(m.score*100).toFixed(0)}%</span>
        </span>
        <span style={{ fontSize: 10, color: T.textDim, fontFamily: "var(--mono)" }}>
          σ {(m.current - m.history.reduce((a,b)=>a+b,0)/m.history.length).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ─── Network Graph (shared renderer) ─────────────────────────────────────────
function NetworkGraph({ topology, deviceStatuses, T }) {
  const [selected, setSelected]   = useState(null);
  const [hovered, setHovered]     = useState(null);
  const [animated, setAnimated]   = useState(true);
  const [frame, setFrame]         = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    setSelected(null);
  }, [topology.id]);

  useEffect(() => {
    if (!animated) { cancelAnimationFrame(rafRef.current); return; }
    const loop = () => { setFrame(f => (f + 1) % 300); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animated]);

  const nodes = topology.nodes;
  const edges = topology.edges;

  // Compute viewBox bounds
  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
  const pad = 60;
  const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad, maxY = Math.max(...ys) + pad;
  const vw = maxX - minX, vh = maxY - minY;
  const viewBox = `${minX} ${minY} ${vw} ${vh}`;

  const selectedNode = nodes.find(n => n.id === selected);
  const hijackedIds  = Object.entries(deviceStatuses).filter(([,s])=>s==="hijacked").map(([id])=>id);
  const breachIds    = Object.entries(deviceStatuses).filter(([,s])=>s==="compromising").map(([id])=>id);

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: `1px solid ${T.glassBorder}` }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 13, color: T.textStrong }}>{topology.subtitle}</span>
          <span style={{ color: T.textDim, fontSize: 11, fontFamily: "var(--mono)" }}>{nodes.length} nodes · {edges.length} links</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {[["Secure", T.accent], ["Breaching", T.warn], ["Compromised", T.danger]].map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }}/>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: "var(--mono)" }}>{l}</span>
            </div>
          ))}
          <button onClick={() => setAnimated(a => !a)} style={{
            background: animated ? T.accentGlow : "transparent",
            border: `1px solid ${animated ? T.accent : T.glassBorder}`,
            color: animated ? T.accent : T.textDim,
            borderRadius: 8, padding: "4px 12px", cursor: "pointer",
            fontSize: 10, fontFamily: "var(--mono)", fontWeight: 700,
          }}>{animated ? "PAUSE" : "ANIMATE"}</button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ padding: "8px 0" }}>
        <svg viewBox={viewBox} style={{ width: "100%", height: "auto", maxHeight: 640, display: "block" }}>
          <defs>
            <filter id="glow-safe"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-hot"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={T.glassBorder}/>
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(([a, b], ei) => {
            const nA = nodes.find(n => n.id === a), nB = nodes.find(n => n.id === b);
            if (!nA || !nB) return null;
            const attacked = hijackedIds.includes(a) || hijackedIds.includes(b);
            const breaching = breachIds.includes(a) || breachIds.includes(b);
            const col = attacked ? T.danger : breaching ? T.warn : T.glassBorder;
            const t = animated ? ((frame * 0.01 + ei * 0.13) % 1) : 0;
            const px = nA.x + (nB.x - nA.x) * t;
            const py = nA.y + (nB.y - nA.y) * t;
            return (
              <g key={ei}>
                <line x1={nA.x} y1={nA.y} x2={nB.x} y2={nB.y}
                  stroke={col} strokeWidth={attacked ? 2 : 1} opacity={attacked ? 0.9 : 0.45}
                  strokeDasharray={attacked ? "5 3" : "none"}/>
                {animated && (
                  <circle cx={px} cy={py} r={attacked ? 3.5 : 2}
                    fill={attacked ? T.danger : T.accent} opacity={0.9}
                    filter={attacked ? "url(#glow-hot)" : "url(#glow-safe)"}/>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const status = deviceStatuses[n.id] || "secure";
            const col = status === "hijacked" ? T.danger : status === "compromising" ? T.warn : (NODE_TYPE_COLORS[n.type] || T.accent);
            const isHov = hovered === n.id;
            const isSel = selected === n.id;
            const r = topology.id === "small" ? 36 : 26;
            const pulse = animated && status !== "secure";
            return (
              <g key={n.id} style={{ cursor: "pointer" }}
                onClick={() => setSelected(selected === n.id ? null : n.id)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}>
                {pulse && (
                  <circle cx={n.x} cy={n.y} r={r + 8 + (frame % 40) * 0.4} fill="none"
                    stroke={col} strokeWidth="1" opacity={Math.max(0, 0.5 - (frame % 40) / 80)}/>
                )}
                {(isHov || isSel) && (
                  <circle cx={n.x} cy={n.y} r={r + 10} fill={col} opacity="0.07"/>
                )}
                <circle cx={n.x} cy={n.y} r={r}
                  fill={T.glass} stroke={col} strokeWidth={isSel ? 2.5 : 1.5}
                  filter={status !== "secure" ? "url(#glow-hot)" : isHov ? "url(#glow-safe)" : "none"}/>
                <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={topology.id === "small" ? 12 : 10} fontWeight="700"
                  fill={col} fontFamily="var(--mono)">{NODE_TYPE_ICON[n.type] || "N"}</text>
                <text x={n.x} y={n.y + r + 14} textAnchor="middle" fontSize={topology.id === "small" ? 11 : 10}
                  fill={T.text} fontFamily="var(--body)" fontWeight="600">{n.label}</text>
                {n.ip && topology.id === "small" && (
                  <text x={n.x} y={n.y + r + 26} textAnchor="middle" fontSize="9"
                    fill={T.textDim} fontFamily="var(--mono)">{n.ip}</text>
                )}
                {status !== "secure" && (
                  <circle cx={n.x + r - 4} cy={n.y - r + 4} r={7} fill={col}/>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node detail card */}
      {selectedNode && (
        <div style={{ position: "absolute", top: 60, right: 16, width: 220, ...glass(T, { borderRadius: 12, padding: "14px 16px" }), border: `1px solid ${T.borderAccent}`, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 13, color: T.textStrong }}>{selectedNode.label}</div>
              <div style={{ fontSize: 10, color: NODE_TYPE_COLORS[selectedNode.type] || T.accent, fontFamily: "var(--mono)", marginTop: 2 }}>{selectedNode.type.toUpperCase()}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>
          {[
            { l: "Status", v: deviceStatuses[selectedNode.id] === "hijacked" ? "Compromised" : deviceStatuses[selectedNode.id] === "compromising" ? "Breaching" : "Secure", c: deviceStatuses[selectedNode.id] === "hijacked" ? T.danger : deviceStatuses[selectedNode.id] === "compromising" ? T.warn : T.accent },
            { l: "IP Address", v: selectedNode.ip || "—" },
            { l: "Links", v: edges.filter(e => e.includes(selectedNode.id)).length },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: T.textDim }}>{l}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: c || T.textStrong, fontFamily: "var(--mono)" }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div style={{ display: "flex", gap: 24, padding: "10px 18px", borderTop: `1px solid ${T.glassBorder}` }}>
        {[
          { l: "Nodes", v: nodes.length, c: T.accent },
          { l: "Links", v: edges.length, c: T.accent },
          { l: "Compromised", v: Object.values(deviceStatuses).filter(s=>s==="hijacked").length, c: T.danger },
          { l: "Secure", v: nodes.length - Object.values(deviceStatuses).filter(s=>s!=="secure").length, c: T.accent },
        ].map(({ l, v, c }) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.5, fontFamily: "var(--mono)" }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: c, fontFamily: "var(--display)" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Attack Modal ─────────────────────────────────────────────────────────────
function AttackModal({ onClose, onLaunch, T }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...glass(T, { borderRadius: 18, width: "100%", maxWidth: 680, maxHeight: "88vh", overflowY: "auto" }), border: `1px solid ${T.danger}35` }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.glassBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 18, color: T.danger }}>Attack Simulator</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>Inject synthetic attack telemetry — no real systems affected</div>
          </div>
          <button onClick={onClose} style={{
            background: T.glass, border: `1px solid ${T.glassBorder}`, color: T.textDim,
            borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ background: T.warnGlow, border: `1px solid ${T.warn}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 11, color: T.warn, lineHeight: 1.5 }}>
            Simulation mode — synthetic telemetry only. All events are logged to the alert stream.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {ATTACK_TYPES.map(a => (
              <div key={a.id} onClick={() => setSel(a.id === sel ? null : a.id)} style={{
                background: sel === a.id ? a.color + "12" : T.glassHover,
                border: `1px solid ${sel === a.id ? a.color + "60" : T.glassBorder}`,
                borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                boxShadow: sel === a.id ? `0 0 20px ${a.color}18` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }}/>
                  <span style={{ color: sel === a.id ? a.color : T.textStrong, fontWeight: 700, fontSize: 13, fontFamily: "var(--display)" }}>{a.name}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>{a.description}</div>
                {sel === a.id && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${a.color}20` }}>
                    <div style={{ fontSize: 10, color: a.color, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, fontFamily: "var(--mono)" }}>ATTACK PHASES</div>
                    {a.phases.map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: T.text, marginBottom: 4, display: "flex", gap: 6 }}>
                        <span style={{ color: a.color, minWidth: 14, fontWeight: 700, fontFamily: "var(--mono)" }}>{i+1}.</span>{p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button disabled={!sel} onClick={() => sel && onLaunch(ATTACK_TYPES.find(a => a.id === sel))} style={{
            width: "100%", padding: "13px", borderRadius: 12, cursor: sel ? "pointer" : "not-allowed",
            background: sel ? T.danger : T.glassBorder,
            color: sel ? "#fff" : T.textDim,
            border: "none", fontFamily: "var(--display)", fontWeight: 700, fontSize: 14,
            transition: "all 0.2s", boxShadow: sel ? `0 4px 20px ${T.dangerGlow}` : "none",
          }}>
            {sel ? `Launch ${ATTACK_TYPES.find(a=>a.id===sel)?.name}` : "Select an attack type"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Theme picker ─────────────────────────────────────────────────────────────
function ThemePicker({ current, onChange, T }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        ...glass(T, { borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", border: `1px solid ${T.glassBorder}` }),
        fontFamily: "var(--display)", fontWeight: 600, fontSize: 11, color: T.text,
        background: "none",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: THEMES[current].accent }}/>
        {THEMES[current].name}
        <span style={{ color: T.textDim, fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, ...glass(T, { borderRadius: 12, padding: 8, minWidth: 140 }), zIndex: 200 }}>
          {Object.entries(THEMES).map(([key, theme]) => (
            <div key={key} onClick={() => { onChange(key); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
              background: current === key ? T.accentGlow : "transparent",
              color: current === key ? T.accent : T.text,
              fontFamily: "var(--display)", fontWeight: current === key ? 700 : 500, fontSize: 12,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.accent, flexShrink: 0 }}/>
              {theme.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [themeKey, setThemeKey]   = useState("midnight");
  const T = THEMES[themeKey];

  const [metrics, setMetrics]       = useState(initMetrics);
  const [alerts, setAlerts]         = useState([]);
  const [dismissed, setDismissed]   = useState(new Set());
  const [running, setRunning]       = useState(true);
  const [burst, setBurst]           = useState(false);
  const [modelInfo, setModelInfo]   = useState({ processed: 0, total: 0, accuracy: null });
  const [apiStatus, setApiStatus] = useState({ connected: false, trained: false, message: "Checking ML backend…", details: null });
  const [tab, setTab]               = useState("dashboard");
  const [showModal, setShowModal]   = useState(false);
  const [activeAttack, setActiveAttack]     = useState(null);
  const [attackPhase, setAttackPhase]       = useState(-1);
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [toasts, setToasts]         = useState([]);
  const [topoKey, setTopoKey]       = useState("small");
  const topology = topoKey === "small" ? TOPOLOGY_SMALL : TOPOLOGY_COLLEGE;
  const targets  = topology.nodes.filter(n => n.type !== "external");

  const intervalRef = useRef(null);
  const timerRefs   = useRef([]);
  const alertId     = useRef(0);
  const toastId     = useRef(0);

  const pushToast = useCallback((title, message, color) => {
    const id = ++toastId.current;
    setToasts(t => [{ id, title, message, color }, ...t].slice(0, 4));
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  }, []);

  const pushAlert = useCallback(obj => setAlerts(a => [obj, ...a].slice(0, 80)), []);

  useEffect(() => {
    let alive = true;
    const checkBackend = async () => {
      try {
        const [healthRes, infoRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/health"),
          fetch("http://127.0.0.1:8000/api/model-info"),
        ]);
        if (!healthRes.ok || !infoRes.ok) throw new Error("Backend returned an error");
        const health = await healthRes.json();
        const details = await infoRes.json();
        if (alive) setApiStatus({ connected: true, trained: !!health.model_loaded, message: health.message, details });
      } catch {
        if (alive) setApiStatus({ connected: false, trained: false, message: "Backend offline — browser demo mode", details: null });
      }
    };
    checkBackend();
    const id = setInterval(checkBackend, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const tick = useCallback(() => {
    setMetrics(prev => {
      const next = {};
      const na = [];
      const ov = activeAttack?.metrics || {};
      for (const cfg of METRICS_CONFIG) {
        const p = prev[cfg.id];
        const raw = genMetric(p.current, burst, ov[cfg.id]);
        const cl  = Math.max(cfg.min, Math.min(cfg.max, raw));
        const hist = [...p.history.slice(-59), cl];
        const score = anomalyScore(cl, hist);
        const anomalous = score > 0.45;
        next[cfg.id] = { current: cl, history: hist, score, anomalous };
        if (anomalous && score > 0.5 && Math.random() > 0.7)
          na.push({ id: ++alertId.current, type: "metric", metric: cfg.label, score, value: `${cl.toFixed(1)}${cfg.unit}`, time: new Date().toLocaleTimeString() });
      }
      if (na.length) {
        setAlerts(a => [...na, ...a].slice(0, 80));
        setModelInfo(m => ({ ...m, processed: m.processed + METRICS_CONFIG.length, total: m.total + na.length, accuracy: null }));
      } else {
        setModelInfo(m => ({ ...m, processed: m.processed + METRICS_CONFIG.length }));
      }
      return next;
    });
  }, [burst, activeAttack]);

  useEffect(() => {
    if (running) intervalRef.current = setInterval(tick, 800);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  const launchAttack = useCallback(attack => {
    setShowModal(false);
    setActiveAttack(attack);
    setAttackPhase(0);
    setDeviceStatuses({});
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    pushToast(`${attack.name} Detected`, `Intrusion confirmed — ${targets.length} nodes targeted`, attack.color);

    attack.phases.forEach((_, i) => {
      const t = setTimeout(() => {
        setAttackPhase(i);
        pushAlert({ id: ++alertId.current, type: "attack", attackName: attack.name, severity: i >= 3 ? "CRITICAL" : "HIGH", message: attack.phases[i], time: new Date().toLocaleTimeString() });
        pushToast(`Phase ${i+1} — ${attack.name}`, attack.phases[i], i >= 3 ? T.danger : attack.color);
      }, i * 3800);
      timerRefs.current.push(t);
    });

    const step = Math.min(2200, Math.floor(18000 / targets.length));
    [...targets].sort(() => Math.random() - 0.5).forEach((dev, i) => {
      const t1 = setTimeout(() => {
        setDeviceStatuses(s => ({ ...s, [dev.id]: "compromising" }));
        pushToast("Lateral Movement", `Breaching ${dev.label} — ${dev.ip}`, T.warn);
      }, 1500 + i * step);
      const t2 = setTimeout(() => {
        setDeviceStatuses(s => ({ ...s, [dev.id]: "hijacked" }));
        pushAlert({ id: ++alertId.current, type: "attack", attackName: attack.name, severity: "CRITICAL", message: `${dev.label} (${dev.ip}) fully compromised — root access obtained`, time: new Date().toLocaleTimeString() });
        pushToast("Host Compromised", `${dev.label} at ${dev.ip} is under attacker control`, T.danger);
      }, 1500 + i * step + Math.min(1500, step));
      timerRefs.current.push(t1, t2);
    });
  }, [pushToast, pushAlert, T, targets]);

  const resolveAttack = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setActiveAttack(null);
    setAttackPhase(-1);
    setDeviceStatuses({});
    pushToast("Threat Contained", "All nodes restored. Firewall rules updated. Incident logged.", T.accent);
    pushAlert({ id: ++alertId.current, type: "attack", attackName: "RESPONSE", severity: "MEDIUM", message: "Incident contained — sessions revoked, firewall updated, forensic snapshot captured.", time: new Date().toLocaleTimeString() });
  }, [pushToast, pushAlert, T]);

  const switchTopology = id => {
    if (id === topoKey) return;
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setActiveAttack(null);
    setAttackPhase(-1);
    setDeviceStatuses({});
    setTopoKey(id);
  };

  const anomalousCount = Object.values(metrics).filter(m => m.anomalous).length;
  const hijackedCount  = Object.values(deviceStatuses).filter(s => s === "hijacked").length;
  const visible        = alerts.filter(a => !dismissed.has(a.id));

  return (
    <div style={{
      fontFamily: "var(--body)",
      background: T.bg, minHeight: "100vh", color: T.text,
      transition: "background 0.5s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        :root {
          --body: 'DM Sans', system-ui, sans-serif;
          --display: 'Sora', sans-serif;
          --mono: 'JetBrains Mono', monospace;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bgSolid}; }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes toastIn  { from{opacity:0;transform:translateX(16px) scale(0.97)} to{opacity:1;transform:none} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes glitch   { 0%,100%{transform:none} 30%{transform:translate(-1px,0.5px)} 70%{transform:translate(1px,-0.5px)} }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: ${T.glassBorder}; border-radius: 4px }
      `}</style>

      <Toast toasts={toasts} T={T} />
      {showModal && <AttackModal onClose={() => setShowModal(false)} onLaunch={launchAttack} T={T} />}

      {/* ── HEADER ── */}
      <header style={{
        ...glass(T, { borderRadius: 0, padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }),
        border: "none", borderBottom: `1px solid ${activeAttack ? T.danger + "40" : T.glassBorder}`,
        position: "sticky", top: 0, zIndex: 100, transition: "border-color 0.4s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: T.accentGlow,
            border: `1px solid ${T.borderAccent}`, display: "flex", alignItems: "center", justifyContent: "center",
            animation: activeAttack ? "glitch 0.6s infinite" : "none",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill={T.accent}/>
              <circle cx="8" cy="8" r="6.5" stroke={T.accent} strokeWidth="1" strokeDasharray="2 2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 14, color: T.textStrong, letterSpacing: -0.3 }}>AnomalyWatch</div>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 2, fontFamily: "var(--mono)" }}>MERN · ML · REAL-TIME</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {activeAttack && <Pill label={`${hijackedCount}/${targets.length} COMPROMISED`} color={T.danger} T={T} pulse />}
          <Pill label={anomalousCount > 0 ? `${anomalousCount} ANOMALIES` : "NOMINAL"} color={anomalousCount > 0 ? T.warn : T.accent} T={T} pulse={anomalousCount > 0}/>

          <ThemePicker current={themeKey} onChange={setThemeKey} T={T} />

          <button onClick={() => setRunning(r => !r)} style={{
            background: "none", border: `1px solid ${T.glassBorder}`, color: running ? T.accent : T.textDim,
            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            fontSize: 11, fontFamily: "var(--display)", fontWeight: 600,
          }}>{running ? "Pause" : "Resume"}</button>

          <button onClick={() => { setBurst(true); setTimeout(() => setBurst(false), 5000); }} style={{
            background: "none", border: `1px solid ${T.danger}40`, color: T.danger,
            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            fontSize: 11, fontFamily: "var(--display)", fontWeight: 600,
          }}>Inject</button>

          <button onClick={() => setShowModal(true)} style={{
            background: activeAttack ? T.dangerGlow : T.accentGlow,
            border: `1px solid ${activeAttack ? T.danger + "50" : T.borderAccent}`,
            color: activeAttack ? T.danger : T.accent,
            borderRadius: 8, padding: "5px 14px", cursor: "pointer",
            fontSize: 11, fontFamily: "var(--display)", fontWeight: 700,
            animation: activeAttack ? "pulse 1.2s infinite" : "none",
          }}>{activeAttack ? "Attack Active" : "Simulate Attack"}</button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div style={{
        ...glass(T, { borderRadius: 0, padding: "0 28px" }),
        border: "none", borderBottom: `1px solid ${T.glassBorder}`,
        display: "flex", gap: 2,
      }}>
        {["dashboard", "network", "alerts"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none",
            borderBottom: `2px solid ${tab === t ? T.accent : "transparent"}`,
            color: tab === t ? T.accent : T.textDim,
            padding: "12px 18px", cursor: "pointer",
            fontSize: 12, fontFamily: "var(--display)", fontWeight: tab === t ? 700 : 500,
            textTransform: "capitalize", letterSpacing: 0.2, marginBottom: -1, transition: "color 0.2s",
          }}>
            {t}{t === "alerts" && alerts.length > 0 ? ` · ${alerts.length}` : ""}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
            <div>
              {/* Active attack banner */}
              {activeAttack && (
                <div style={{ ...glass(T, { borderRadius: 14, padding: "16px 20px", marginBottom: 20 }), border: `1px solid ${activeAttack.color}40` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 14, color: activeAttack.color }}>
                          {activeAttack.name}
                        </span>
                        <Pill label="LIVE" color={T.danger} T={T} pulse />
                      </div>
                      <div style={{ color: T.text, fontSize: 12, lineHeight: 1.5, maxWidth: 500 }}>{activeAttack.description}</div>
                    </div>
                    <button onClick={resolveAttack} style={{
                      background: T.accentGlow, color: T.accent, border: `1px solid ${T.borderAccent}`,
                      borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                      fontFamily: "var(--display)", fontWeight: 700, fontSize: 11, flexShrink: 0,
                    }}>Contain &amp; Resolve</button>
                  </div>
                  {attackPhase >= 0 && (
                    <div style={{ background: T.glassHover, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                      <div style={{ fontSize: 9, color: activeAttack.color, letterSpacing: 1, fontFamily: "var(--mono)", marginBottom: 5 }}>
                        PHASE {attackPhase+1}/{activeAttack.phases.length}
                      </div>
                      <div style={{ fontSize: 12, color: T.text, marginBottom: 8 }}>{activeAttack.phases[attackPhase]}</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {activeAttack.phases.map((_, i) => (
                          <div key={i} style={{ flex: 1, height: 2, borderRadius: 2, background: i <= attackPhase ? activeAttack.color : T.border, transition: "background 0.4s" }}/>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {targets.map(d => {
                      const s = deviceStatuses[d.id] || "secure";
                      const c = s === "hijacked" ? T.danger : s === "compromising" ? T.warn : T.accent;
                      return (
                        <div key={d.id} style={{ background: T.glassHover, border: `1px solid ${c}30`, borderRadius: 8, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 11, color: T.textStrong, fontWeight: 600 }}>{d.label}</div>
                            <div style={{ fontSize: 9, color: T.textDim, fontFamily: "var(--mono)" }}>{d.ip}</div>
                          </div>
                          <span style={{ fontSize: 9, color: c, fontFamily: "var(--mono)", fontWeight: 700, animation: s === "compromising" ? "pulse 1s infinite" : "none" }}>
                            {s === "hijacked" ? "HIJACKED" : s === "compromising" ? "BREACH" : "OK"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                {METRICS_CONFIG.map(cfg => <MetricCard key={cfg.id} cfg={cfg} m={metrics[cfg.id]} T={T} />)}
              </div>

              {/* Event stream */}
              <div style={{ ...glass(T, { borderRadius: 14, padding: 18 }) }}>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: 12 }}>Live Event Stream</div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {visible.length === 0
                    ? <div style={{ color: T.textDim, fontSize: 12, textAlign: "center", padding: 24 }}>No anomalies detected</div>
                    : visible.slice(0, 12).map(a => <AlertRow key={a.id} alert={a} onDismiss={id => setDismissed(d => new Set([...d, id]))} T={T} />)
                  }
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* ML Model */}
              <div style={{ ...glass(T, { borderRadius: 14, padding: 18 }) }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 12, color: T.textStrong }}>ML Engine</span>
                  <Pill label={apiStatus.trained ? "MODEL READY" : apiStatus.connected ? "API CONNECTED" : "DEMO MODE"} color={apiStatus.trained ? T.accent : T.warn} T={T} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { l: "Models", v: apiStatus.trained ? "RF + Isolation Forest" : "Z-score demo" },
                    { l: "Dataset", v: apiStatus.trained ? "CIC-IDS2017" : "Synthetic" },
                    { l: "API", v: apiStatus.connected ? "Connected" : "Offline" },
                    { l: "Demo Samples", v: modelInfo.processed.toLocaleString() },
                    { l: "Demo Alerts", v: modelInfo.total },
                    { l: "Macro F1", v: apiStatus.trained ? `${((apiStatus.details?.classification_metrics?.macro_f1 ?? 0) * 100).toFixed(1)}%` : "—" },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div style={{ color: T.textDim, fontSize: 9, marginBottom: 2, letterSpacing: 0.5 }}>{l}</div>
                      <div style={{ color: T.accent, fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.glassBorder}`, color: T.textDim, fontSize: 10, lineHeight: 1.5 }}>
                  {apiStatus.trained ? "Trained CIC-IDS2017 models are ready for API inference. Dashboard telemetry remains simulated." : apiStatus.message}
                </div>
              </div>

              {/* Devices */}
              <div style={{ ...glass(T, { borderRadius: 14, padding: 18 }), border: `1px solid ${activeAttack ? T.danger+"30" : T.glassBorder}`, transition: "border-color 0.4s" }}>
                <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 12, color: T.textStrong, display: "block", marginBottom: 12 }}>Device Nodes</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                  {targets.map(d => {
                    const s = deviceStatuses[d.id] || "secure";
                    const c = s === "hijacked" ? T.danger : s === "compromising" ? T.warn : T.accent;
                    return (
                      <div key={d.id} style={{ background: T.glassHover, border: `1px solid ${c}25`, borderRadius: 8, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, color: T.textStrong, fontWeight: 600 }}>{d.label}</div>
                          <div style={{ fontSize: 9, color: T.textDim, fontFamily: "var(--mono)" }}>{d.ip}</div>
                        </div>
                        <span style={{ fontSize: 9, color: c, fontFamily: "var(--mono)", fontWeight: 700 }}>
                          {s === "hijacked" ? "HIJACKED" : s === "compromising" ? "BREACH" : "SECURE"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score bars */}
              <div style={{ ...glass(T, { borderRadius: 14, padding: 18 }) }}>
                <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 12, color: T.textStrong, display: "block", marginBottom: 14 }}>Anomaly Scores</span>
                {METRICS_CONFIG.map(cfg => {
                  const sc = metrics[cfg.id].score;
                  return (
                    <div key={cfg.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T.textDim }}>{cfg.label}</span>
                        <span style={{ fontSize: 10, color: sc > 0.5 ? T.danger : T.accent, fontFamily: "var(--mono)", fontWeight: 700 }}>{(sc*100).toFixed(0)}%</span>
                      </div>
                      <div style={{ background: T.border, borderRadius: 3, height: 4, overflow: "hidden" }}>
                        <div style={{ width: `${sc*100}%`, height: "100%", borderRadius: 3, background: sc > 0.7 ? T.danger : sc > 0.4 ? T.warn : cfg.color, transition: "width 0.4s, background 0.4s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* NETWORK */}
        {tab === "network" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 22, color: T.textStrong, letterSpacing: -0.5, marginBottom: 4 }}>Network Topology</h2>
                <p style={{ color: T.textDim, fontSize: 13 }}>Live device graph with real-time attack propagation. Click any node for details.</p>
              </div>
              {/* Topology switcher */}
              <div style={{ display: "flex", gap: 6 }}>
                {[TOPOLOGY_SMALL, TOPOLOGY_COLLEGE].map(tp => (
                  <button key={tp.id} onClick={() => switchTopology(tp.id)} style={{
                    background: topoKey === tp.id ? T.accentGlow : "none",
                    border: `1px solid ${topoKey === tp.id ? T.borderAccent : T.glassBorder}`,
                    color: topoKey === tp.id ? T.accent : T.textDim,
                    borderRadius: 8, padding: "7px 16px", cursor: "pointer",
                    fontFamily: "var(--display)", fontWeight: 700, fontSize: 11, transition: "all 0.2s",
                  }}>
                    <div style={{ color: topoKey === tp.id ? T.accent : T.textDim, fontWeight: 700 }}>{tp.name}</div>
                    <div style={{ fontSize: 9, color: T.textDim, marginTop: 1 }}>{tp.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ ...glass(T, { borderRadius: 16 }) }}>
              <NetworkGraph key={topoKey} topology={topology} deviceStatuses={deviceStatuses} T={T} />
            </div>
          </div>
        )}

        {/* ALERTS */}
        {tab === "alerts" && (
          <div style={{ maxWidth: 820 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 22, color: T.textStrong, letterSpacing: -0.5 }}>
                Alert Log <span style={{ color: T.textDim, fontSize: 15, fontWeight: 500 }}>· {alerts.length}</span>
              </h2>
              <button onClick={() => { setAlerts([]); setDismissed(new Set()); }} style={{
                background: "none", border: `1px solid ${T.glassBorder}`, color: T.textDim,
                padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 11, fontFamily: "var(--display)", fontWeight: 600,
              }}>Clear All</button>
            </div>
            {alerts.length === 0
              ? <div style={{ color: T.textDim, textAlign: "center", padding: 60, fontSize: 14 }}>No alerts recorded</div>
              : alerts.map(a => <AlertRow key={a.id} alert={a} onDismiss={id => setDismissed(d => new Set([...d, id]))} T={T} />)
            }
          </div>
        )}
      </main>
    </div>
  );
}
