import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Same tokens as ../../css/app.css so the video matches the app.
const C = {
  accent: "#c8402b", accentSoft: "#fdece7", ink: "#241f1a", muted: "#6b6258", line: "#efe9df",
  paper: "#fbf8f3", surface: "#fffdf9", map: "#ebe5da", water: "#c9d9d8", star: "#f5a623",
  stay: "#6b5bd2", food: "#a86400", see: "#1f8558"
};
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const SANS = '"Segoe UI Variable Text", "Segoe UI", Inter, system-ui, sans-serif';

export const DURATION = 480;

const useIn = (delay = 0, damping = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping } });
};
const fade = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Logo = ({ size, spin = 0 }: { size: number; spin?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ transform: `rotate(${spin}deg)` }}>
    <circle cx="16" cy="16" r="5" fill={C.accent} />
    <g fill={C.accent} opacity=".8">
      {[[16, 4.5], [26, 10.3], [26, 21.7], [16, 27.5], [6, 21.7], [6, 10.3]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" />
      ))}
    </g>
  </svg>
);

/* ---------- 1: title ---------- */
const Title = () => {
  const f = useCurrentFrame();
  const s = useIn(0, 12);
  const t = useIn(18);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 20% 0%, ${C.accentSoft}, ${C.map} 70%)`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${0.6 + 0.4 * s})`, opacity: s }}>
        <Logo size={150} spin={(1 - s) * -120} />
        <span style={{ fontFamily: SERIF, fontSize: 150, fontWeight: 700, letterSpacing: -4, color: C.ink }}>MyCircle</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 48, color: C.muted, marginTop: 36, opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>
        Places your close friends have actually been.
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, background: C.accent, width: `${fade(f, 0, 90) * 100}%` }} />
    </AbsoluteFill>
  );
};

/* ---------- 2: search + map pins ---------- */
const PINS = [
  { x: 1180, y: 330, n: 1, c: C.food },
  { x: 1010, y: 470, n: 2, c: C.stay },
  { x: 1330, y: 560, n: 3, c: C.see },
  { x: 1150, y: 700, n: 4, c: C.food },
  { x: 1470, y: 380, n: 5, c: C.see }
];

const Pin = ({ x, y, n, c, delay }: { x: number; y: number; n: number; c: string; delay: number }) => {
  const s = useIn(delay, 9);
  return (
    <div style={{ position: "absolute", left: x - 36, top: y - 90 - (1 - s) * 200, opacity: Math.min(1, s * 2), transform: `scale(${0.4 + 0.6 * s})`, transformOrigin: "50% 100%" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: c, border: "5px solid #fff", boxShadow: "0 6px 16px rgba(40,20,0,.4)", display: "grid", placeItems: "center" }}>
        <span style={{ transform: "rotate(45deg)", color: "#fff", font: `700 32px ${SANS}` }}>{n}</span>
      </div>
    </div>
  );
};

const FriendRow = ({ name, color, ini, sub, delay }: { name: string; color: string; ini: string; sub: string; delay: number }) => {
  const r = useIn(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "18px 44px", borderTop: `2px solid ${C.line}`, opacity: r, transform: `translateX(${(1 - r) * 40}px)` }}>
      <div style={{ width: 84, height: 84, borderRadius: 42, background: color, color: "#fff", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 600 }}>{ini}</div>
      <div>
        <div style={{ fontSize: 36, fontWeight: 600, color: C.ink }}>{name}</div>
        <div style={{ fontSize: 26, color: C.muted }}>{sub} · <span style={{ color: C.star }}>★★★★★</span></div>
      </div>
    </div>
  );
};

const Panel = () => {
  const s = useIn(50, 16);
  return (
    <div style={{ position: "absolute", left: 60, top: 176, width: 760, borderRadius: 36, background: C.surface, border: `2px solid ${C.line}`, boxShadow: "0 16px 50px rgba(60,40,20,.22)", padding: "36px 0", transform: `translateX(${(1 - s) * -820}px)`, fontFamily: SANS }}>
      <div style={{ padding: "0 44px" }}>
        <div style={{ fontSize: 26, color: C.muted }}>United States</div>
        <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 600, color: C.ink, letterSpacing: -1 }}>New York</div>
        <div style={{ fontSize: 28, color: C.muted, marginBottom: 24 }}>12 places · 3 friends went</div>
      </div>
      <FriendRow name="Anika Rao" color={C.see} ini="AR" sub="5 places" delay={75} />
      <FriendRow name="Ravi Kumar" color={C.stay} ini="RK" sub="4 places" delay={85} />
      <FriendRow name="You" color={C.accent} ini="MM" sub="3 places" delay={95} />
    </div>
  );
};

const MapScene = () => {
  const f = useCurrentFrame();
  const p = useIn(0, 16);
  const q = "New York";
  const typed = q.slice(0, Math.floor(interpolate(f, [10, 45], [0, q.length + 0.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const zoom = interpolate(f, [0, 170], [1, 1.06]);
  return (
    <AbsoluteFill style={{ background: C.map }}>
      <svg width="1920" height="1080" style={{ position: "absolute", transform: `scale(${zoom})` }}>
        <path d="M1300 0 C1250 200 1380 380 1300 600 S1420 900 1380 1080 L1920 1080 L1920 0Z" fill={C.water} />
        {Array.from({ length: 14 }, (_, i) => (
          <path key={"v" + i} d={`M${600 + i * 90} 0 L${420 + i * 130} 1080`} stroke="#fff" strokeOpacity=".55" strokeWidth={i % 4 === 0 ? 10 : 4} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={"h" + i} d={`M600 ${i * 130} L1920 ${i * 130 + 70}`} stroke="#fff" strokeOpacity=".55" strokeWidth={i % 3 === 0 ? 10 : 4} />
        ))}
      </svg>
      {PINS.map((pin, i) => <Pin key={i} {...pin} delay={55 + i * 8} />)}
      <div style={{ position: "absolute", left: 60, top: 50, width: 760, height: 100, borderRadius: 50, background: C.surface, boxShadow: "0 8px 30px rgba(60,40,20,.2)", display: "flex", alignItems: "center", padding: "0 16px 0 28px", gap: 22, opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
        <Logo size={52} />
        <span style={{ fontFamily: SANS, fontSize: 38, color: C.ink, flex: 1 }}>{typed}{f % 20 < 10 && f < 60 ? "|" : ""}</span>
        <div style={{ width: 68, height: 68, borderRadius: 34, background: C.accent }} />
      </div>
      <Panel />
    </AbsoluteFill>
  );
};

/* ---------- 3: reviews ---------- */
const ITEMS = [
  { n: 1, c: C.food, name: "Joe’s Pizza", cat: "Eat & drink", who: "Anika", body: "Best slice in the Village. Cash only, always a line, worth it.", tip: "Go before noon." },
  { n: 2, c: C.stay, name: "The Standard High Line", cat: "Stay", who: "Ravi", body: "Great views, small rooms.", tip: "Ask for a high floor." },
  { n: 3, c: C.see, name: "The High Line", cat: "See & do", who: "You", body: "Walk it north to south at sunset.", tip: "" }
];

const ReviewCard = ({ it, delay }: { it: (typeof ITEMS)[number]; delay: number }) => {
  const s = useIn(delay);
  return (
    <div style={{ display: "flex", gap: 36, background: C.surface, border: `2px solid ${C.line}`, borderRadius: 32, padding: "30px 40px", marginBottom: 28, boxShadow: "0 10px 30px rgba(60,40,20,.1)", opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, background: it.c, color: "#fff", display: "grid", placeItems: "center", fontSize: 30, fontWeight: 700, flex: "none" }}>{it.n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
          <span style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 600, color: C.ink }}>{it.name}</span>
          <span style={{ fontSize: 26, color: C.muted }}>{it.cat} · {it.who}</span>
          <span style={{ color: C.star, fontSize: 30, marginLeft: "auto" }}>★★★★★</span>
        </div>
        <div style={{ fontSize: 32, color: "#453e37", marginTop: 8 }}>{it.body}</div>
        {it.tip && (
          <div style={{ display: "inline-block", marginTop: 14, background: C.accentSoft, borderRadius: 16, padding: "8px 20px", fontSize: 28, color: "#453e37" }}>
            <b style={{ color: "#a5301f", marginRight: 10 }}>Tip</b>{it.tip}
          </div>
        )}
      </div>
    </div>
  );
};

const Reviews = () => {
  const head = useIn(0);
  return (
    <AbsoluteFill style={{ background: C.paper, padding: "90px 200px", fontFamily: SANS }}>
      <div style={{ fontFamily: SERIF, fontSize: 84, fontWeight: 600, color: C.ink, letterSpacing: -2, opacity: head, transform: `translateY(${(1 - head) * 30}px)`, marginBottom: 50 }}>
        What your friends <span style={{ color: C.accent }}>actually</span> thought.
      </div>
      {ITEMS.map((it, i) => <ReviewCard key={i} it={it} delay={20 + i * 22} />)}
    </AbsoluteFill>
  );
};

/* ---------- 4: outro ---------- */
const Outro = () => {
  const a = useIn(0);
  const b = useIn(14);
  const c = useIn(30);
  return (
    <AbsoluteFill style={{ background: C.accent, alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SANS }}>
      <div style={{ fontFamily: SERIF, fontSize: 130, fontWeight: 700, letterSpacing: -3, opacity: a, transform: `scale(${0.9 + 0.1 * a})` }}>One map. Your people.</div>
      <div style={{ fontSize: 48, marginTop: 28, opacity: b }}>Search a city. See who’s been. Trust their taste.</div>
      <div style={{ marginTop: 60, display: "flex", alignItems: "center", gap: 20, background: "#fff", borderRadius: 60, padding: "20px 48px", opacity: c, transform: `translateY(${(1 - c) * 30}px)` }}>
        <Logo size={56} />
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: C.ink }}>MyCircle</span>
      </div>
    </AbsoluteFill>
  );
};

export const Promo = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={90}><Title /></Sequence>
    <Sequence from={90} durationInFrames={170}><MapScene /></Sequence>
    <Sequence from={260} durationInFrames={130}><Reviews /></Sequence>
    <Sequence from={390} durationInFrames={90}><Outro /></Sequence>
  </AbsoluteFill>
);
