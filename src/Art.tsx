import { recipes, type Recipe } from "./data";
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
  return (
    <>
      <span className="plate-caption" aria-hidden="true">
        <span>{recipe.name}</span>
        <span>#{String(recipes.indexOf(recipe) + 1).padStart(2, "0")}</span>
      </span>
      <Illustration id={recipe.id} />
    </>
  );
}
