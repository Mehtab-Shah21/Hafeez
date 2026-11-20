/**
 * UAE skyline art, west → east, with landmarks from all seven emirates (stylised silhouettes).
 * Drawn once as a <g id="hs-skyline-art"> in <defs> and placed with <use> so the DOM stays small.
 * Local geometry: 3200 × 900, ground line at y = 640.
 */
const G = 640;

function rnd(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

function Windows({ x, y, w, seed = 1, gap = 12 }: { x: number; y: number; w: number; seed?: number; gap?: number }) {
  const r = rnd(seed);
  const out: JSX.Element[] = [];
  for (let yy = y + 8; yy < G - 6; yy += gap)
    for (let xx = x + 4; xx < x + w - 4; xx += 8)
      if (r() > 0.8) out.push(<rect key={`${xx}-${yy}`} x={xx} y={yy} width="2.6" height="3.2" fill="#FFD89A" opacity={0.4 + r() * 0.5} />);
  return <g>{out}</g>;
}

type Top = 'flat' | 'slant' | 'spire';
function Tower({ x, w, h, seed, top = 'flat' }: { x: number; w: number; h: number; seed: number; top?: Top }) {
  return (
    <g>
      {top === 'slant' ? (
        <polygon points={`${x},${G} ${x},${G - h + 18} ${x + w},${G - h} ${x + w},${G}`} />
      ) : (
        <rect x={x} y={G - h} width={w} height={h} />
      )}
      {top === 'spire' && <rect x={x + w / 2 - 1} y={G - h - 30} width="2" height="30" />}
      <Windows x={x} y={G - h} w={w} seed={seed} />
    </g>
  );
}

function Label({ x, t, ar }: { x: number; t: string; ar: string }) {
  return (
    <g opacity="0.7" textAnchor="middle" fill="#FFF4E0" fontFamily="Inter, sans-serif">
      <text className="hs-text" x={x} y={G + 30} fontSize="17" letterSpacing="5" fontWeight="600">
        {t}
      </text>
      <text className="hs-text" x={x} y={G + 52} fontSize="16">
        {ar}
      </text>
    </g>
  );
}

function Minaret({ x, h, w = 8 }: { x: number; h: number; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={G - h} width={w} height={h} />
      <rect x={x - w / 2 - 3} y={G - h + 25} width={w + 6} height="5" />
      <polygon points={`${x - w / 2},${G - h} ${x},${G - h - 18} ${x + w / 2},${G - h}`} />
    </g>
  );
}

function Dome({ cx, r, base }: { cx: number; r: number; base: number }) {
  return (
    <g>
      <rect x={cx - r} y={base} width={r * 2} height={G - base} />
      <path d={`M${cx - r} ${base}A${r} ${r * 1.15} 0 0 1 ${cx + r} ${base}Z`} />
      <rect x={cx - 0.8} y={base - r * 1.15 - 12} width="1.6" height="13" />
    </g>
  );
}

function Fort({ x, w, h }: { x: number; w: number; h: number }) {
  const c: JSX.Element[] = [];
  for (let i = x; i < x + w; i += 10) c.push(<rect key={i} x={i} y={G - h - 7} width="6" height="7" />);
  return (
    <g>
      <rect x={x} y={G - h} width={w} height={h} />
      {c}
    </g>
  );
}

function RoundTower({ cx, w, h }: { cx: number; w: number; h: number }) {
  const c: JSX.Element[] = [];
  for (let i = cx - w / 2; i < cx + w / 2; i += 9) c.push(<rect key={i} x={i} y={G - h - 7} width="5" height="7" />);
  return (
    <g>
      <path d={`M${cx - w / 2 - 4} ${G}L${cx - w / 2} ${G - h}L${cx + w / 2} ${G - h}L${cx + w / 2 + 4} ${G}Z`} />
      {c}
    </g>
  );
}

export function SkylineArt() {
  return (
    <g id="hs-skyline-art">
      {/* Hajar mountains behind Ras Al Khaimah and Fujairah */}
      <path
        fill="url(#hs-mtn)"
        opacity="0.85"
        d="M2400 640L2470 560L2520 585L2600 470L2660 520L2720 430L2790 500L2860 455L2930 540L3000 490L3080 560L3140 520L3200 580V640Z"
      />
      <g fill="url(#hs-bld)">
        {/* ABU DHABI: Sheikh Zayed Grand Mosque, Etihad Towers, Aldar HQ, Capital Gate */}
        <rect x="40" y={G - 40} width="280" height="40" />
        <Dome cx={180} r={46} base={G - 60} />
        <Dome cx={110} r={24} base={G - 45} />
        <Dome cx={250} r={24} base={G - 45} />
        <Minaret x={35} h={150} />
        <Minaret x={325} h={150} />
        {(
          [
            [360, 300],
            [395, 270],
            [430, 240],
            [462, 210],
            [492, 180],
          ] as [number, number][]
        ).map(([x, h], i) => (
          <g key={x}>
            <path d={`M${x} ${G}V${G - h + 20}Q${x + 13} ${G - h - 6} ${x + 28} ${G - h + 10}V${G}Z`} />
            <Windows x={x} y={G - h + 20} w={28} seed={i + 3} />
          </g>
        ))}
        <rect x="566" y={G - 40} width="18" height="40" />
        <circle cx="575" cy={G - 95} r="60" />
        <polygon points={`640,${G} 650,${G - 230} 700,${G - 222} 680,${G}`} />
        <Label x={360} t="ABU DHABI" ar="أبوظبي" />

        {/* DUBAI: Museum of the Future, Dubai Frame, Emirates Towers, Burj Khalifa, Burj Al Arab */}
        <Tower x={740} w={30} h={150} seed={11} />
        <rect x="790" y={G - 30} width="110" height="30" />
        <ellipse cx="845" cy={G - 95} rx="58" ry="72" />
        <ellipse cx="850" cy={G - 95} rx="26" ry="38" fill="#C6869A" opacity="0.5" />
        <path fillRule="evenodd" d={`M920 ${G}V${G - 250}H1010V${G}ZM934 ${G}V${G - 232}H996V${G}Z`} />
        <Tower x={1030} w={26} h={200} seed={12} top="spire" />
        <polygon points={`1070,${G} 1070,${G - 330} 1100,${G - 360} 1100,${G}`} />
        <Windows x={1070} y={G - 330} w={30} seed={13} />
        <polygon points={`1112,${G} 1112,${G - 270} 1138,${G - 295} 1138,${G}`} />
        <Tower x={1150} w={34} h={240} seed={15} top="slant" />
        <polygon
          points={`1195,${G} 1199,${G - 110} 1207,${G - 110} 1210,${G - 220} 1218,${G - 220} 1221,${G - 310} 1229,${G - 310} 1232,${G - 385} 1238,${G - 385} 1240,${G - 450} 1244,${G - 450} 1246,${G - 560} 1248,${G - 560} 1251,${G - 450} 1255,${G - 450} 1257,${G - 385} 1263,${G - 385} 1266,${G - 310} 1274,${G - 310} 1277,${G - 220} 1285,${G - 220} 1288,${G - 110} 1296,${G - 110} 1300,${G}`}
        />
        <rect x="1246" y={G - 566} width="3" height="6" fill="#FF5A4A" />
        <Windows x={1205} y={G - 300} w={90} seed={16} gap={14} />
        <Tower x={1310} w={34} h={260} seed={17} top="spire" />
        <Tower x={1350} w={28} h={190} seed={18} />
        <path d={`M1430 ${G}L1432 ${G - 290}Q1520 ${G - 250} 1530 ${G}Z`} />
        <rect x="1429" y={G - 320} width="4" height="320" />
        <Label x={1130} t="DUBAI" ar="دبي" />

        {/* SHARJAH: Al Noor Mosque, Eye of the Emirates */}
        <Dome cx={1640} r={38} base={G - 50} />
        <Dome cx={1600} r={16} base={G - 35} />
        <Dome cx={1680} r={16} base={G - 35} />
        <Minaret x={1575} h={135} w={7} />
        <Minaret x={1705} h={135} w={7} />
        <circle cx="1800" cy={G - 100} r="82" fill="none" stroke="#3D2F5F" strokeWidth="5" />
        <g className="hs-ferris" stroke="#3D2F5F" strokeWidth="1.5">
          <circle cx="1800" cy={G - 100} r="88" fill="none" stroke="none" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            const px = 1800 + 82 * Math.cos(a);
            const py = G - 100 + 82 * Math.sin(a);
            return (
              <g key={i}>
                <line x1="1800" y1={G - 100} x2={px} y2={py} />
                <rect x={px - 5} y={py - 4} width="10" height="9" fill="#4A3A6E" />
              </g>
            );
          })}
        </g>
        <polygon points={`1795,${G - 100} 1770,${G} 1778,${G} 1800,${G - 90} 1822,${G} 1830,${G} 1805,${G - 100}`} />
        <Label x={1700} t="SHARJAH" ar="الشارقة" />

        {/* AJMAN: Ajman Fort + corniche towers */}
        <Fort x={1960} w={110} h={55} />
        <RoundTower cx={1975} w={30} h={95} />
        <Fort x={2040} w={30} h={110} />
        <Tower x={2090} w={30} h={230} seed={22} top="slant" />
        <Tower x={2126} w={26} h={180} seed={23} />
        <Label x={2060} t="AJMAN" ar="عجمان" />

        {/* UMM AL QUWAIN: UAQ Fort */}
        <Fort x={2210} w={130} h={50} />
        <RoundTower cx={2230} w={34} h={100} />
        <RoundTower cx={2325} w={28} h={80} />
        <Label x={2275} t="UMM AL QUWAIN" ar="أم القيوين" />

        {/* RAS AL KHAIMAH: Dhayah Fort on its hill below Jebel Jais */}
        <path d={`M2520 ${G}Q2600 ${G - 90} 2680 ${G}`} />
        <Fort x={2582} w={40} h={95} />
        <RoundTower cx={2575} w={18} h={105} />
        <Tower x={2700} w={30} h={170} seed={25} top="spire" />
        <Label x={2600} t="RAS AL KHAIMAH" ar="رأس الخيمة" />

        {/* FUJAIRAH: Al Bidyah Mosque + Fujairah Fort */}
        <rect x="2880" y={G - 40} width="70" height="40" />
        {[2892, 2915, 2938].map((c) => (
          <path key={c} d={`M${c - 11} ${G - 40}A11 14 0 0 1 ${c + 11} ${G - 40}Z`} />
        ))}
        <Fort x={3010} w={110} h={60} />
        <RoundTower cx={3030} w={34} h={115} />
        <RoundTower cx={3105} w={26} h={90} />
        <Label x={3010} t="FUJAIRAH" ar="الفجيرة" />
      </g>
    </g>
  );
}
