/**
 * European cab-over tractor + 3-axle box trailer, side view facing right.
 * Local geometry 1200 × 360, road contact at y = 350. Rendered inside <g id="hs-truck">;
 * wheel hubs carry `.hs-wheel-spin` and are rotated by the scroll timeline.
 */

function Wheel({ cx, r = 42, dual = false }: { cx: number; r?: number; dual?: boolean }) {
  const cy = 308;
  const lugs = Array.from({ length: 10 }, (_, i) => (i * Math.PI) / 5);
  const treads = Array.from({ length: 18 }, (_, i) => (i * Math.PI) / 9);
  return (
    <g>
      <ellipse cx={cx} cy={cy + r + 1} rx={r * 0.9} ry="4" fill="#000" opacity="0.7" />
      {dual && <circle cx={cx - 3} cy={cy - 1} r={r} fill="#0C0C0E" />}
      <circle cx={cx} cy={cy} r={r} fill="url(#hs-t-tire)" />
      <circle cx={cx} cy={cy} r={r * 0.66} fill="#1A1B1F" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="url(#hs-t-rim)" />
      <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="#7D838C" strokeWidth="1.2" />
      <g className="hs-wheel-spin">
        <circle cx={cx} cy={cy} r={r} fill="none" />
        {treads.map((a, i) => (
          <line
            key={`t${i}`}
            x1={cx + Math.cos(a) * (r - 1)}
            y1={cy + Math.sin(a) * (r - 1)}
            x2={cx + Math.cos(a) * (r - 6)}
            y2={cy + Math.sin(a) * (r - 6)}
            stroke="#3A3A40"
            strokeWidth="2.4"
          />
        ))}
        {lugs.map((a, i) => {
          const x = cx + Math.cos(a) * r * 0.41;
          const y = cy + Math.sin(a) * r * 0.41;
          return <ellipse key={i} cx={x} cy={y} rx="4.4" ry="2.5" transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} fill="#2F3238" />;
        })}
        {lugs.map((a, i) => (
          <circle key={`n${i}`} cx={cx + Math.cos(a + 0.31) * r * 0.25} cy={cy + Math.sin(a + 0.31) * r * 0.25} r="1.8" fill="#F4F6F9" />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.17} fill="url(#hs-t-hub)" stroke="#555A62" strokeWidth="0.8" />
      <path
        d={`M${cx - r * 0.48} ${cy - r * 0.28}A${r * 0.56} ${r * 0.56} 0 0 1 ${cx + r * 0.12} ${cy - r * 0.55}`}
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

export function TruckDefs() {
  return (
    <>
      <linearGradient id="hs-t-box" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FDFDFE" />
        <stop offset=".5" stopColor="#E7E9ED" />
        <stop offset=".85" stopColor="#C9CDD4" />
        <stop offset="1" stopColor="#A9AEB7" />
      </linearGradient>
      <linearGradient id="hs-t-sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFC993" stopOpacity=".38" />
        <stop offset=".3" stopColor="#fff" stopOpacity="0" />
        <stop offset=".62" stopColor="#fff" stopOpacity=".28" />
        <stop offset=".75" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".1" />
      </linearGradient>
      <linearGradient id="hs-t-cab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D3DAE3" />
        <stop offset=".3" stopColor="#B2BCC8" />
        <stop offset=".7" stopColor="#8F9AA9" />
        <stop offset="1" stopColor="#626D7C" />
      </linearGradient>
      <linearGradient id="hs-t-cabsheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFC993" stopOpacity=".4" />
        <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        <stop offset=".85" stopColor="#fff" stopOpacity=".18" />
        <stop offset="1" stopColor="#000" stopOpacity=".25" />
      </linearGradient>
      <linearGradient id="hs-t-ext" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5D6876" />
        <stop offset="1" stopColor="#97A2B1" />
      </linearGradient>
      <linearGradient id="hs-t-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4A5566" />
        <stop offset=".4" stopColor="#18202B" />
        <stop offset="1" stopColor="#090C11" />
      </linearGradient>
      <linearGradient id="hs-t-alu" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F6F8FA" />
        <stop offset=".35" stopColor="#B3B9C2" />
        <stop offset=".55" stopColor="#E6E9EE" />
        <stop offset="1" stopColor="#737A85" />
      </linearGradient>
      <linearGradient id="hs-t-ao" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity=".55" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="hs-t-tire" cx=".42" cy=".38" r=".62">
        <stop offset=".62" stopColor="#2E2E33" />
        <stop offset=".9" stopColor="#18181B" />
        <stop offset="1" stopColor="#0A0A0C" />
      </radialGradient>
      <radialGradient id="hs-t-rim" cx=".38" cy=".32" r=".75">
        <stop offset="0" stopColor="#FBFCFD" />
        <stop offset=".45" stopColor="#C3C8CF" />
        <stop offset=".8" stopColor="#7E848D" />
        <stop offset="1" stopColor="#4D525A" />
      </radialGradient>
      <radialGradient id="hs-t-hub" cx=".4" cy=".35" r=".7">
        <stop offset="0" stopColor="#fff" />
        <stop offset="1" stopColor="#6C727B" />
      </radialGradient>
      <radialGradient id="hs-t-lamp" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#fff" />
        <stop offset=".35" stopColor="#FFF3CF" stopOpacity=".85" />
        <stop offset="1" stopColor="#FFD98A" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="hs-t-beam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFF2C8" stopOpacity=".5" />
        <stop offset="1" stopColor="#FFF2C8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="hs-t-fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0.05" />
        <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
      </linearGradient>
      <mask id="hs-t-dashmask">
        <rect x="430" y="48" width="365" height="196" fill="url(#hs-t-fade)" />
      </mask>
      <pattern id="hs-t-dash" width="14" height="10" patternUnits="userSpaceOnUse" patternTransform="skewX(-17)">
        <rect x="2" y="1" width="8" height="7" fill="#2B2F37" />
      </pattern>
      <pattern id="hs-t-tape" width="24" height="5" patternUnits="userSpaceOnUse">
        <rect width="12" height="5" fill="#D8202E" />
        <rect x="12" width="12" height="5" fill="#F4F4F4" />
      </pattern>
      <pattern id="hs-t-mesh" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#2A2D33" />
        <circle cx="2" cy="2" r=".9" fill="#0F1114" />
      </pattern>
      <filter id="hs-t-soft" x="-20%" y="-200%" width="140%" height="500%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </>
  );
}

export function TruckArt({ variant = 'box' }: { variant?: 'box' | 'chassis' }) {
  return (
    <g>
      {/* ground shadow */}
      <ellipse cx="600" cy="352" rx="600" ry="12" fill="#000" opacity=".55" filter="url(#hs-t-soft)" />
      {/* headlight beam on the road */}
      <polygon id="hs-beam" points="1100,228 1320,256 1320,350 1100,262" fill="url(#hs-t-beam)" opacity="0.5" />

      {/* TRAILER underframe */}
      <rect x="95" y="258" width="705" height="16" fill="#1B1D22" />
      <rect x="95" y="258" width="705" height="34" fill="url(#hs-t-ao)" />
      <rect x="372" y="283" width="215" height="5" rx="1" fill="#3A3D44" />
      <rect x="372" y="297" width="215" height="5" rx="1" fill="#3A3D44" />
      {[372, 444, 516, 582].map((x) => (
        <rect key={x} x={x} y="272" width="5" height="32" fill="#2C2F35" />
      ))}
      <rect x="612" y="270" width="10" height="54" fill="#2C2F35" />
      <rect x="609" y="290" width="16" height="6" fill="#FFB21E" />
      <rect x="600" y="322" width="32" height="6" rx="2" fill="#26282D" />
      <rect x="16" y="276" width="52" height="10" fill="#26282D" />
      <rect x="16" y="268" width="14" height="8" rx="1" fill="#C3121F" />
      <path d="M360 270h16l2 64h-18z" fill="#141518" />

      {variant === 'chassis' && (
        <g>
          <rect x="20" y="250" width="780" height="10" fill="#2A2D34" />
          {[40, 420, 780].map((x) => (
            <rect key={x} x={x - 8} y="244" width="16" height="8" fill="#FFB21E" />
          ))}
        </g>
      )}
      {variant === 'box' && (
        <>
      {/* TRAILER box */}
      <rect x="16" y="28" width="784" height="232" rx="5" fill="url(#hs-t-box)" />
      <rect x="16" y="28" width="784" height="232" rx="5" fill="url(#hs-t-sheen)" />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={113 + i * 98} y1="38" x2={113 + i * 98} y2="248" stroke="#000" strokeOpacity=".05" />
      ))}
      <rect x="430" y="48" width="365" height="196" fill="url(#hs-t-dash)" mask="url(#hs-t-dashmask)" />
      <rect x="16" y="28" width="784" height="10" rx="3" fill="url(#hs-t-alu)" />
      <rect x="16" y="246" width="784" height="14" fill="url(#hs-t-alu)" />
      <rect x="22" y="241" width="772" height="5" fill="url(#hs-t-tape)" />
      <rect x="16" y="28" width="10" height="232" rx="3" fill="#CFD2D8" />
      <rect x="790" y="28" width="10" height="232" rx="3" fill="#CFD2D8" />
      <line x1="22" y1="29" x2="796" y2="29" stroke="#FFCF9A" strokeOpacity=".85" strokeWidth="1.5" />
      {/* reefer unit */}
      <rect x="796" y="46" width="22" height="104" rx="4" fill="#2B2E35" />
      <rect x="799" y="52" width="16" height="70" rx="2" fill="url(#hs-t-mesh)" />
      {/* livery: brand mark area + UAE flag stripe */}
      <g>
        <circle cx="88" cy="118" r="30" fill="none" stroke="#353A44" strokeWidth="3" />
        <path d="M76 127L88 103L100 127Z" fill="#353A44" />
        <rect x="134" y="104" width="230" height="16" rx="3" fill="#272B33" />
        <rect x="134" y="128" width="170" height="7" rx="3" fill="#4B515A" />
        <rect x="127" y="149" width="7" height="5" fill="#C8102E" />
        <rect x="134" y="149" width="34" height="5" fill="#00843D" />
        <rect x="168" y="149" width="34" height="5" fill="#fff" stroke="#CCD" strokeWidth=".5" />
        <rect x="202" y="149" width="34" height="5" fill="#111" />
      </g>
      {[150, 300, 450, 600, 750].map((x) => (
        <rect key={x} x={x} y="262" width="8" height="4" rx="1" fill="#FF9D2E" />
      ))}
        </>
      )}
      <Wheel cx={130} dual />
      <Wheel cx={222} dual />
      <Wheel cx={314} dual />
      <path d="M84 300Q84 256 130 256H314Q360 256 360 300" fill="none" stroke="#141518" strokeWidth="5" />

      {/* TRACTOR chassis + fifth wheel */}
      <rect x="735" y="272" width="365" height="20" fill="#15161A" />
      <rect x="742" y="263" width="86" height="9" rx="2" fill="#2A2C32" />
      <path d="M740 300Q740 250 795 250Q850 250 850 300H842Q842 260 795 260Q748 260 748 300Z" fill="#1D1F24" />
      <path d="M848 268h14l2 66h-16z" fill="#141518" />
      {/* cab side extender bridging the gap to the trailer */}
      <path d="M812 72L842 70V262L816 258Z" fill="url(#hs-t-ext)" />
      {/* front wheel arch */}
      <path d="M972 302Q972 246 1032 246Q1092 246 1092 302Z" fill="#0B0C0F" />
      {/* fuel tank */}
      <rect x="868" y="272" width="100" height="42" rx="10" fill="url(#hs-t-alu)" />
      <rect x="872" y="276" width="92" height="3" rx="1.5" fill="#fff" opacity=".7" />
      {[886, 946].map((x) => (
        <rect key={x} x={x} y="271" width="6" height="44" rx="1" fill="#33363D" />
      ))}
      <rect x="854" y="278" width="14" height="32" rx="2" fill="#3F434B" />
      {/* roof deflector */}
      <path d="M838 122Q842 46 902 36L1030 30Q1054 30 1058 52V70L842 78Z" fill="url(#hs-t-cab)" />
      <path d="M902 37L1030 31" stroke="#FFE0B8" strokeWidth="2" strokeOpacity=".9" />
      {/* cab body */}
      <path d="M840 288V92Q842 70 872 66L1060 56Q1097 58 1101 96L1106 248Q1108 280 1090 288Z" fill="url(#hs-t-cab)" />
      <path d="M840 288V92Q842 70 872 66L1060 56Q1097 58 1101 96L1106 248Q1108 280 1090 288Z" fill="url(#hs-t-cabsheen)" />
      <path d="M880 70L930 68L870 288H840V220Z" fill="#fff" opacity=".07" />
      <path d="M872 66L1060 56" stroke="#FFE0B8" strokeWidth="1.5" strokeOpacity=".8" />
      <path d="M842 196Q960 190 1102 186" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
      <path d="M1046 60L1099 70Q1102 80 1101 94L1046 88Z" fill="#14171C" />
      <path d="M1046 88L1101 94" stroke="#C9CED6" strokeWidth="1.5" />
      <path d="M1092 98L1103 99L1104 176L1095 178Z" fill="url(#hs-t-glass)" />
      {/* door + window */}
      <path d="M966 92L1062 88Q1073 88 1075 98L1079 264H966Z" fill="none" stroke="#4F5967" strokeWidth="1.5" />
      <rect x="982" y="184" width="24" height="6" rx="3" fill="#4F5967" />
      <path d="M974 98L1060 94Q1069 94 1070 103L1071 172L974 176Z" fill="url(#hs-t-glass)" stroke="#0C0F14" strokeWidth="2.5" />
      <path d="M988 100L1018 98L983 172H976Z" fill="#fff" opacity=".13" />
      <path d="M1030 97L1041 96L1008 174H1000Z" fill="#FFD2A0" opacity=".16" />
      {[228, 254].map((y) => (
        <g key={y}>
          <rect x="998" y={y} width="60" height="7" rx="2" fill="#24272C" />
          <rect x="1000" y={y + 6} width="56" height="1.5" fill="#FFE9B0" opacity=".6" />
        </g>
      ))}
      {/* bumper, headlight, grille, mirrors */}
      <path d="M1036 264L1106 252Q1112 272 1106 294H1036Z" fill="#7D8797" />
      <path d="M1046 282L1107 279" stroke="#25282E" strokeWidth="3" />
      <rect x="1094" y="262" width="12" height="6" rx="2" fill="#FFB347" />
      <path d="M1076 212L1106 206L1107 238L1082 240Z" fill="#1A1D23" />
      <path d="M1084 216L1101 213L1090 234" stroke="#EEF6FF" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <circle cx="1102" cy="226" r="28" fill="url(#hs-t-lamp)" opacity=".9" />
      <rect x="1099" y="118" width="7" height="88" rx="1" fill="#30343C" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x="1099" y={122 + i * 8} width="7" height="2" fill="#A7AFBA" />
      ))}
      <path d="M1074 104L1108 98" stroke="#22252B" strokeWidth="4" strokeLinecap="round" />
      <rect x="1105" y="90" width="15" height="62" rx="6" fill="#1B1E24" />
      <rect x="1108" y="94" width="4" height="52" rx="2" fill="#6B7583" />
      <rect x="1106" y="156" width="13" height="22" rx="5" fill="#1B1E24" />
      {[1036, 1044, 1052].map((x) => (
        <rect key={x} x={x} y="58" width="5" height="3" rx="1" fill="#FFB347" />
      ))}
      <Wheel cx={795} r={44} dual />
      <Wheel cx={1032} r={44} />
    </g>
  );
}
