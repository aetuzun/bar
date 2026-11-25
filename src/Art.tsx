/// <reference types="vite/client" />
import { useId } from "react";
import type { Recipe } from "./data";

const plates = import.meta.glob<string>("./plates/*.svg", { query: "?raw", import: "default", eager: true });

export function Illustration({ id }: { id: string }) {
  // These SVGs are bundled source assets. Scope their paint and clip IDs per card.
  const instance = useId();
  const svg = plates[`./plates/${id}.svg`];
  if (!svg?.includes('class="art-')) {
    return <img className="glass" alt="" src={new URL(`./plates/${id}.svg`, import.meta.url).href} />;
  }
  const markup = svg.replace(/id="([^"]+)"|url\(#([^)]+)\)/g, (_, definition, reference) =>
    definition ? `id="${instance}-${definition}"` : `url(#${instance}-${reference})`,
  );
  return (
    <div className="glass animated-glass" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export function Glass({ recipe }: { recipe: Recipe }) {
  return <Illustration id={recipe.id.startsWith("custom-") ? "martini" : recipe.id} />;
}
