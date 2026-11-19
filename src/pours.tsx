import type { Item } from "./data";
export const pourStyles = [
  "Whisky",
  "Red wine",
  "White wine",
  "Rosé",
  "Sparkling wine",
  "Wine",
] as const;
export type Pour = { name: string; style: (typeof pourStyles)[number] };
export const eligible = (item: Item) =>
  item.group === "Whiskies" || item.group === "Wine & sparkling";
export const inStock = (item: Item) =>
  eligible(item) && (item.status === "Available" || item.status === "Low");
export function describe(item: Item): Pour {
  const text = (item.kind + " " + item.name).toLowerCase();
  const style =
    item.group === "Whiskies"
      ? "Whisky"
      : /prosecco|sparkling|champagne|cava|crémant/.test(text)
        ? "Sparkling wine"
        : /rosé|\brose\b/.test(text)
          ? "Rosé"
          : /\bred\b|pinot noir|cabernet|merlot|syrah/.test(text)
            ? "Red wine"
            : /\bwhite\b|chardonnay|sauvignon blanc|riesling/.test(text)
              ? "White wine"
              : "Wine";
  return { name: item.name, style };
}
export function PourArt({ style }: { style: Pour["style"] }) {
  const sparkling = style === "Sparkling wine";
  const color = {
    Whisky: "#b8712c",
    "Red wine": "#853b4b",
    "White wine": "#e1d295",
    Rosé: "#dfa197",
    "Sparkling wine": "#dfd5a0",
    Wine: "#cec4aa",
  }[style];
  return (
    <svg className="glass" viewBox="0 0 240 190" aria-hidden="true">
      {style === "Whisky" ? (
        <>
          <path
            d="M93 53H147Q146 71 160 101Q173 136 139 148L144 159H96L101 148Q67 136 80 101Q94 71 93 53Z"
            fill="#dedfda"
          />
          <path d="M78 112H162Q166 142 120 148Q75 142 78 112Z" fill={color} />
          <path
            d="M87 110Q82 125 91 133"
            fill="none"
            stroke="#f5e9cf"
            strokeWidth="3"
          />
        </>
      ) : (
        <>
          <path
            d={
              sparkling
                ? "M100 30H140L136 98Q135 116 123 124V159Q123 164 142 166V169H98V166Q117 164 117 159V124Q105 116 104 98Z"
                : "M85 43H155L163 84Q168 115 124 128V156Q124 164 146 166V169H94V166Q117 164 117 156V128Q73 115 77 84Z"
            }
            fill="#dedfda"
          />
          <path
            d={
              sparkling
                ? "M103 66H137L134 99Q132 113 120 120Q108 113 106 99Z"
                : "M79 87H161Q163 112 120 124Q77 112 79 87Z"
            }
            fill={color}
          />
          {sparkling && (
            <g fill="#fff9e1">
              <circle cx="119" cy="102" r="2" />
              <circle cx="125" cy="88" r="2" />
              <circle cx="118" cy="76" r="1.8" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}
export function PourRow({ pour }: { pour: Pour }) {
  return (
    <>
      <div className="drink-art">
        <PourArt style={pour.style} />
      </div>
      <div>
        <h2>{pour.name}</h2>
        <p className="flavor">{pour.style}</p>
      </div>
    </>
  );
}
