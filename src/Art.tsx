import { type Recipe } from "./data";
export function Illustration({ id }: { id: string }) {
  return (
    <img
      className="glass"
      alt=""
      src={new URL(`./plates/${id}.svg`, import.meta.url).href}
    />
  );
}
export function Glass({ recipe }: { recipe: Recipe }) {
  return <Illustration id={recipe.id} />;
}
