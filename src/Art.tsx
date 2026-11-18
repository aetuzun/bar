import type { Recipe } from "./data";
export function Glass({ recipe: r }: { recipe: Recipe }) {
  const c = r.color;
  return (
    <svg viewBox="0 0 230 190" className="glass" aria-hidden="true">
      {r.glass === "martini" ? (
        <>
          <path
            d="M49 37H181L120 105Q117 109 117 117V160Q117 166 140 167Q151 170 114 170Q78 170 89 167Q112 166 112 160V117Q112 109 108 105Z"
            fill="#e8e5e3"
            stroke="#c7c3c1"
          />
          <path d="M61 50H169L117 105Z" fill="#d7d6d0" />
          <path d="m82 22 58 85" stroke="#996126" strokeWidth="3" />
          {[
            [94, 40],
            [108, 61],
            [122, 82],
          ].map(([x, y]) => (
            <g key={x}>
              <ellipse cx={x} cy={y} rx="10" ry="8" fill="#898b31" />
              <ellipse cx={x + 3} cy={y + 1} rx="3" ry="3.5" fill="#b84220" />
            </g>
          ))}
        </>
      ) : r.glass === "spritz" ? (
        <>
          <path
            d="M84 20Q55 94 83 116Q94 125 112 130V164Q112 172 88 172Q78 177 115 177Q151 177 142 172Q118 172 118 164V130Q138 124 147 115Q171 87 145 20Z"
            fill="#f2f0e9"
            stroke="#ccc9c3"
          />
          <path d="M73 61Q60 113 115 129Q167 109 156 61Z" fill="#e6ef9a" />
          <path d="m87 70 28-5 5 25-27 6z" fill="#ffffe8" />
          <path
            d="M120 90l26-15q9 23-9 28q-12 2-17-13"
            fill="#d7ed5e"
            stroke="#93ab2c"
            strokeWidth="3"
          />
          <path
            d="M115 56Q87 44 93 32Q113 32 116 51Q113 25 139 20Q142 42 115 56"
            fill="#84ae35"
          />
        </>
      ) : (
        <g
          transform={
            r.glass === "tall" ? "translate(31,-32) scale(.73,1.22)" : ""
          }
        >
          <path
            d="M56 48Q115 32 174 48V151Q117 167 56 151Z"
            fill="#e5e2e3"
            stroke="#c5c1c1"
          />
          <ellipse
            cx="115"
            cy="48"
            rx="59"
            ry="6.6"
            fill="#efecec"
            stroke="#d6d2d1"
          />
          <path d="M57 80Q115 90 173 80V143Q117 157 57 143Z" fill={c} />
          <ellipse cx="115" cy="80" rx="58" ry="7" fill={c} />
          <path d="m83 80 24-9 45 8-21 11z" fill="#ffdbad" opacity=".85" />
          <path d="m83 80 48 10-6 49-45-11z" fill="#ffddbb" opacity=".65" />
          <path d="m131 90 21-11-5 48-22 12z" fill="#f7cba7" opacity=".7" />
          <path
            d="M109 78C120 59 152 58 151 30L163 42C157 65 133 76 122 80Z"
            fill="#efa32c"
          />
        </g>
      )}
    </svg>
  );
}
