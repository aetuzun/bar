/// <reference types="vite/client" />
import { useId } from "react";
import type { Recipe } from "./data";

const plates = import.meta.glob<string>("./plates/*.svg", { query: "?raw", import: "default", eager: true });

function animateDrink(plate: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  plate.querySelectorAll(".art-ice, .art-garnish, .art-bubble, .art-pour").forEach((part, index) => {
    if (part.getAnimations().length) return;
    if (part.classList.contains("art-bubble")) {
      const extra = part.classList.contains("art-bubble-extra");
      part.animate([
        { translate: "0 0", opacity: extra ? 0 : 1 },
        { opacity: 0.8, offset: 0.3 },
        { translate: "1px -23px", opacity: 0, offset: 0.78 },
        { translate: "0 0", opacity: 0, offset: 0.8 },
        { translate: "0 0", opacity: extra ? 0 : 1 },
      ], { duration: 1750, delay: index % 4 * 135, easing: "ease-in-out" });
    } else {
      const ice = part.classList.contains("art-ice");
      const liquid = part.classList.contains("art-pour");
      part.animate([
        { translate: "0 0", rotate: "0deg" },
        { translate: ice ? "1px -3px" : "0 0", rotate: liquid ? "1deg" : ice ? "4deg" : "-5deg" },
        { translate: "0 0", rotate: "0deg" },
      ], { duration: 1550, easing: "ease-in-out" });
    }
  });
}

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
      onPointerEnter={event => {
        if (event.pointerType === "mouse") animateDrink(event.currentTarget);
      }}
      onClick={event => animateDrink(event.currentTarget)}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export function Glass({ recipe }: { recipe: Recipe }) {
  return <Illustration id={recipe.id} />;
}
