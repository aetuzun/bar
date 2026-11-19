import type { Recipe } from "./data";
const glass = "#dedfda";
function Cube({
  x,
  y,
  angle = 0,
  size = 38,
}: {
  x: number;
  y: number;
  angle?: number;
  size?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size / 38})`}>
      <path d="M0 6 26 0 39 7 14 14Z" fill="#fffaed" opacity=".74" />
      <path d="M0 6 14 14 13 40 1 32Z" fill="#fff4de" opacity=".30" />
      <path d="M14 14 39 7 36 33 13 40Z" fill="#fff5e5" opacity=".52" />
    </g>
  );
}
function Rock({ id }: { id: string }) {
  const old = id === "old-fashioned",
    white = id === "white-negroni",
    boulevard = id === "boulevardier";
  const liquid = old
    ? "#c77929"
    : white
      ? "#c9c469"
      : boulevard
        ? "#963f31"
        : "#c13326";
  return (
    <g>
      <path
        d={old ? "M64 66H179L168 166H76Z" : "M62 64H182L178 166H66Z"}
        fill={glass}
      />
      <path
        d={old ? "M68 84H176L168 155H75Z" : "M64 87H180L177 156H66Z"}
        fill={liquid}
      />
      {old ? (
        <>
          <path d="M74 119Q117 103 172 116L168 155H76Z" fill="#bd6621" />
          <Cube x={92} y={87} angle={-12} size={51} />
          <path
            d="M136 91Q151 72 127 62Q100 51 108 33L120 34Q112 48 137 58Q164 69 147 91Z"
            fill="#e88a20"
          />
        </>
      ) : white ? (
        <>
          <Cube x={82} y={90} angle={8} />
          <path
            d="M143 95Q130 75 151 49L163 46Q140 73 157 91Z"
            fill="#e8a69c"
          />
        </>
      ) : boulevard ? (
        <>
          <Cube x={102} y={86} angle={19} />
          <path d="M81 87Q90 60 118 56L112 65Q95 71 92 91Z" fill="#f2a142" />
        </>
      ) : (
        <>
          <Cube x={77} y={84} angle={-9} size={52} />
          <Cube x={125} y={111} angle={8} size={34} />
          <path
            d="M111 85 143 52 155 29 165 34 151 64 124 88Z"
            fill="#f29421"
          />
          <path d="m111 85-16-15 12-2 17 20z" fill="#d56c19" />
        </>
      )}
      <path d="M69 159H175" stroke="#c5c6c1" strokeWidth="1.5" />
    </g>
  );
}
function Martini() {
  return (
    <>
      <path
        d="M43 43H199L128 114Q124 120 124 128V158Q124 167 152 169V172H89V169Q118 166 118 158V128Q118 119 112 112Z"
        fill={glass}
      />
      <path d="M58 56H184L123 112Z" fill="#c6cbc6" />
      <path d="m142 20-39 80" stroke="#926f4b" strokeWidth="3" />
      <g transform="rotate(26 125 57)">
        <rect x="115" y="43" width="22" height="26" rx="10" fill="#828d3a" />
        <ellipse cx="125" cy="48" rx="6" ry="4" fill="#b95b3c" />
      </g>
      <path d="M48 44H194" stroke="#fbfaf8" strokeWidth="2" />
    </>
  );
}
function Spritz() {
  return (
    <>
      <path
        d="M79 42H163L174 89Q180 121 134 132Q124 135 124 143V159Q124 167 150 169V171H92V169Q117 166 117 159V143Q117 135 108 132Q64 122 68 92Z"
        fill={glass}
      />
      <path
        d="M73 72H169L173 91Q176 120 121 130Q66 123 70 92Z"
        fill="#d8e28c"
      />
      <Cube x={83} y={80} angle={-13} size={32} />
      <path
        d="M128 104 158 77A27 27 0 0 1 128 104Z"
        fill="#94b54e"
        stroke="#819e40"
        strokeWidth="3"
      />
      <path
        d="M126 77Q129 47 149 30"
        stroke="#416944"
        strokeWidth="2"
        fill="none"
      />
      <path d="M135 57Q125 36 131 24Q147 37 135 57Z" fill="#678650" />
      <path d="M139 48Q141 26 161 25Q154 43 139 48Z" fill="#46704c" />
      <path d="M130 68Q110 60 113 45Q128 50 130 68Z" fill="#90a867" />
    </>
  );
}
function Tall({ americano }: { americano: boolean }) {
  return (
    <>
      <path d="M83 31H158L154 168H87Z" fill={glass} />
      <path
        d="M85 55H156L153 158H88Z"
        fill={americano ? "#c3644d" : "#d3b17b"}
      />
      <Cube x={95} y={57} angle={-8} size={32} />
      <Cube x={112} y={99} angle={9} size={30} />
      {americano ? (
        <path
          d="M114 42H174A30 30 0 0 1 114 42Z"
          fill="#ed9d49"
          stroke="#d97828"
          strokeWidth="3"
        />
      ) : (
        <path
          d="M137 75Q102 62 135 44Q156 32 144 20L154 21Q171 36 145 53Q121 66 147 72Z"
          fill="#e5bd42"
        />
      )}
    </>
  );
}
export function Glass({ recipe: r }: { recipe: Recipe }) {
  return (
    <svg className="glass" viewBox="0 0 240 190" aria-hidden="true">
      {r.glass === "spritz" ? (
        <Spritz />
      ) : r.glass === "martini" ? (
        <Martini />
      ) : r.glass === "tall" ? (
        <Tall americano={r.id === "americano"} />
      ) : (
        <Rock id={r.id} />
      )}
    </svg>
  );
}
