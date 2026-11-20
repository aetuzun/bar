import { Illustration } from "./Art";
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
  const explicit = pourStyles.find(style => style === item.kind && style !== "Whisky");
  if (item.group === "Wine & sparkling" && explicit) return { name: item.name, style: explicit };
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
const artByStyle: Record<Pour["style"], string> = {
  Whisky: "whisky",
  "Red wine": "red-wine",
  "White wine": "white-wine",
  Rosé: "rose",
  "Sparkling wine": "sparkling-wine",
  Wine: "wine",
};
export function PourArt({ style }: { style: Pour["style"] }) {
  return <Illustration id={artByStyle[style]} />;
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
