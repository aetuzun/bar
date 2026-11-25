import {
  cocktailIllustration,
  demoMenu,
  groups,
  recipes,
  seed,
  type Group,
  type Item,
  type Recipe,
} from "./data";
import { describe, pourStyles, type Pour } from "./pours";
export const animations = { shaker: "Cocktail shaker", bartender: "Behind the bar", toast: "A toast for two", dance: "Dance partners", friends: "Cheers with friends", family: "Family high-five" } as const;
export type Scene = keyof typeof animations;
const sceneOf = (value: unknown): Scene =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(animations, value) ? value as Scene : "shaker";
export type Snapshot = {
  ids: string[];
  title: string;
  footer?: string;
  scene?: Scene;
  pours?: Pour[];
  cocktails?: GuestCocktail[];
};
export type GuestCocktail = { id: string; name: string; style: string; ingredients: string[]; illustration?: Recipe["illustration"] };
export type SavedMenu = Pick<BarState, "draft" | "title" | "footer" | "scene"> & { id: string; name: string; savedByUser?: true };
export type BarState = {
  items: Item[];
  draft: string[];
  recipeOrder: string[];
  title: string;
  footer: string;
  scene?: Scene;
  published: Snapshot | null;
  customRecipes: Recipe[];
  favorites: string[];
  savedMenus: SavedMenu[];
};
const key = "the-home-bar.beta.v1";
export const defaultFooter = "Enjoy!";
const validIds = (value: unknown, extra: string[] = []): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string =>
              typeof id === "string" &&
              (extra.includes(id) || recipes.some((r) => r.id === id)),
          ),
        ),
      ]
    : [];
const titleOf = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? Array.from(value.trim()).slice(0, 80).join("")
    : "Menu";
function readSnapshot(
  ids: unknown,
  title: unknown,
  raw: unknown,
  footer?: unknown,
  scene?: unknown,
  custom?: unknown,
): Snapshot {
  const pours: Pour[] =
    Array.isArray(raw) &&
    raw.every(
      (p) =>
        p &&
        typeof p.name === "string" &&
        p.name.length <= 100 &&
        pourStyles.includes(p.style),
    )
      ? raw.map((p) => ({ name: p.name, style: p.style }))
      : [];
  const cocktails: GuestCocktail[] = Array.isArray(custom) ? custom.slice(0, 100).filter(drink =>
    drink && typeof drink.id === "string" && /^custom-[\da-f-]{36}$/.test(drink.id) &&
    typeof drink.name === "string" && typeof drink.style === "string" &&
    Array.isArray(drink.ingredients) && drink.ingredients.every((kind: unknown) => typeof kind === "string")
  ).map(drink => ({ id: drink.id, name: drink.name.slice(0, 80), style: drink.style.slice(0, 120),
    illustration: cocktailIllustration(drink.illustration),
    ingredients: drink.ingredients.slice(0, 12).map((kind: string) => kind.slice(0, 80)) })) : [];
  return {
    ids: validIds(
      ids,
      [...pours.map((_, i) => "p" + i), ...cocktails.map(drink => drink.id)],
    ),
    title: titleOf(title),
    scene: sceneOf(scene),
    ...(typeof footer === "string" ? { footer: footer.slice(0, 100) } : {}),
    ...(pours.length ? { pours } : {}),
    ...(cocktails.length ? { cocktails } : {}),
  };
}
export function publishSnapshot(state: BarState): Snapshot {
  const pours: Pour[] = [];
  const ids = state.draft.map((id) => {
    if (!id.startsWith("pour:")) return id;
    const item = state.items.find((i) => i.id === id.slice(5))!;
    pours.push(describe(item));
    return "p" + (pours.length - 1);
  });
  const cocktails = state.customRecipes.filter(recipe => ids.includes(recipe.id)).map(recipe => ({
    illustration: recipe.illustration,
    id: recipe.id, name: recipe.name, style: recipe.style, ingredients: recipe.ingredients.map(([kind]) => kind),
  }));
  return readSnapshot(ids, state.title, pours, state.footer, state.scene, cocktails);
}
export function guestMenu(hash: string): Snapshot {
  if (hash === "#guest") return { ids: demoMenu, title: "Menu" };
  const [ids, query] = hash.slice(7).split("?");
  const params = new URLSearchParams(query);
  let pours: unknown;
  try {
    pours = JSON.parse(params.get("p") || "[]");
  } catch {
    pours = [];
  }
  let cocktails: unknown;
  try { cocktails = JSON.parse(params.get("c") || "[]"); } catch { cocktails = []; }
  return readSnapshot(ids.split(","), params.get("t"), pours, params.get("f"), params.get("a"), cocktails);
}
export function guestUrl(snapshot: Snapshot) {
  const url = new URL(location.href);
  url.search = "";
  const params = new URLSearchParams();
  if (snapshot.title !== "Menu") params.set("t", snapshot.title);
  if (snapshot.footer !== undefined)
    params.set("f", snapshot.footer);
  if (snapshot.scene && snapshot.scene !== "shaker") params.set("a", snapshot.scene);
  if (snapshot.pours?.length) params.set("p", JSON.stringify(snapshot.pours));
  if (snapshot.cocktails?.length) params.set("c", JSON.stringify(snapshot.cocktails));
  url.hash =
    "guest/" + snapshot.ids.join(",") + (params.size ? "?" + params : "");
  return url.href;
}
function migratedGroup(item: Item): Group {
  const old = String(item.group);
  if (groups.includes(item.group)) return item.group;
  if (old === "Liqueurs/Aperitifs") return "Aperitifs & liqueurs";
  if (old === "Vermouth") return "Vermouth & fortified wine";
  const kind = (item.kind + " " + item.name).toLowerCase();
  if (/vermouth|sherry|port wine|lillet|madeira/.test(kind))
    return "Vermouth & fortified wine";
  if (/wine|sparkling|prosecco|champagne|rosé|cava/.test(kind))
    return "Wine & sparkling";
  if (/syrup|bitters|agave|sugar|honey/.test(kind)) return "Bitters & syrups";
  if (/juice|tonic|soda|water|cola|ginger beer|ginger ale/.test(kind))
    return "Mixers";
  if (/olive|lemon|lime|mint|herb|basil|ice|orange|cherr/.test(kind))
    return "Fresh & garnishes";
  return old === "Non-alcoholic" ? "Mixers" : "Fresh & garnishes";
}
export const storage = {
  load(): BarState {
    const initial = {
      items: seed,
      recipeOrder: ["hugo", "negroni", "martini", "old-fashioned", "margarita", "daiquiri", "aperol-spritz", "whiskey-sour"],
      draft: ["hugo", "negroni", "old-fashioned", "pour:hibiki", "pour:white", "pour:red"],
      title: "Menu",
      footer: defaultFooter,
      published: null,
      customRecipes: [],
      favorites: [],
      savedMenus: [],
    };
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.items)) return initial;
      const customRecipes: Recipe[] = Array.isArray(data.customRecipes) ? data.customRecipes : [];
      const customIds = customRecipes.map(recipe => recipe.id);
      const menuIds = [...customIds, ...data.items.map((i: Item) => "pour:" + i.id)];
      const published = Array.isArray(data.published)
        ? { ids: validIds(data.published), title: "Menu" }
        : data.published
          ? readSnapshot(
              data.published.ids,
              data.published.title,
              data.published.pours,
              data.published.footer,
              data.published.scene,
              data.published.cocktails,
            )
          : null;
      return {
        items: data.items.map((item: Item) => ({
          ...item,
          status: String(item.status) === "Needs confirmation" ? "Unavailable" : item.status,
          shoppingOrigin: String(item.shoppingOrigin) === "unconfirmed" ? "unavailable" : item.shoppingOrigin,
          group: migratedGroup(item),
        })),
        recipeOrder: Array.isArray(data.recipeOrder) ? validIds(data.recipeOrder, customIds)
          : validIds([...initial.recipeOrder, ...validIds(data.draft)]),
        draft: validIds(
          data.draft,
          menuIds,
        ),
        title: typeof data.title === "string" ? data.title : "Menu",
        footer:
          typeof data.footer !== "string" ||
          (!data.footerVersion && data.footer === "No rush.")
            ? defaultFooter
            : data.footer,
        scene: sceneOf(data.scene),
        published,
        customRecipes,
        favorites: validIds(data.favorites, customIds),
        savedMenus: Array.isArray(data.savedMenus) ? data.savedMenus.map((menu: SavedMenu) => ({
          ...menu, draft: validIds(menu.draft, menuIds),
        })) : [],
      };
    } catch {
      return initial;
    }
  },
  save(state: BarState) {
    localStorage.setItem(key, JSON.stringify({ ...state, footerVersion: 2 }));
  },
};
