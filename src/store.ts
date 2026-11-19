import {
  demoMenu,
  groups,
  recipes,
  seed,
  availability,
  type Group,
  type Item,
} from "./data";
type Snapshot = { ids: string[]; title: string };
export type BarState = {
  items: Item[];
  draft: string[];
  title: string;
  published: Snapshot | null;
};
const key = "the-home-bar.beta.v1";
const validIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string =>
              typeof id === "string" && recipes.some((r) => r.id === id),
          ),
        ),
      ]
    : [];
const titleOf = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? Array.from(value.trim()).slice(0, 80).join("")
    : "Menu";
export function guestMenu(hash: string): Snapshot {
  if (hash === "#guest") return { ids: demoMenu, title: "Menu" };
  const [ids, query] = hash.slice("#guest/".length).split("?");
  return {
    ids: validIds(ids.split(",")),
    title: titleOf(new URLSearchParams(query).get("t")),
  };
}
export function guestUrl(snapshot: Snapshot) {
  const url = new URL(location.href);
  url.search = "";
  const title = titleOf(snapshot.title);
  url.hash =
    "guest/" +
    validIds(snapshot.ids).join(",") +
    (title === "Menu"
      ? ""
      : "?" + new URLSearchParams({ t: title }).toString());
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
      draft: demoMenu.filter(
        (id) =>
          availability(
            recipes.find((r) => r.id === id)!,
            seed,
          ).ready,
      ),
      title: "Menu",
      published: null,
    };
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.items)) return initial;
      const published = Array.isArray(data.published)
        ? { ids: validIds(data.published), title: "Menu" }
        : data.published
          ? {
              ids: validIds(data.published.ids),
              title: titleOf(data.published.title),
            }
          : null;
      return {
        items: data.items.map((item: Item) => ({
          ...item,
          group: migratedGroup(item),
        })),
        draft: validIds(data.draft),
        title: typeof data.title === "string" ? data.title : "Menu",
        published,
      };
    } catch {
      return initial;
    }
  },
  save(state: BarState) {
    localStorage.setItem(key, JSON.stringify(state));
  },
};
