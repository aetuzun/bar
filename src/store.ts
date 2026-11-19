import {
  demoMenu,
  groups,
  recipes,
  seed,
  availability,
  type Group,
  type Item,
} from "./data";
import { describe, pourStyles, type Pour } from "./pours";
export type Snapshot = {
  ids: string[];
  title: string;
  footer?: string;
  pours?: Pour[];
};
export type BarState = {
  items: Item[];
  draft: string[];
  title: string;
  footer: string;
  published: Snapshot | null;
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
  return {
    ids: validIds(
      ids,
      pours.map((_, i) => "p" + i),
    ),
    title: titleOf(title),
    ...(typeof footer === "string" ? { footer: footer.slice(0, 100) } : {}),
    ...(pours.length ? { pours } : {}),
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
  return readSnapshot(ids, state.title, pours, state.footer);
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
  return readSnapshot(ids.split(","), params.get("t"), pours, params.get("f"));
}
export function guestUrl(snapshot: Snapshot) {
  const url = new URL(location.href);
  url.search = "";
  const params = new URLSearchParams();
  if (snapshot.title !== "Menu") params.set("t", snapshot.title);
  if (snapshot.footer !== undefined)
    params.set("f", snapshot.footer);
  if (snapshot.pours?.length) params.set("p", JSON.stringify(snapshot.pours));
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
      draft: demoMenu.filter(
        (id) =>
          availability(
            recipes.find((r) => r.id === id)!,
            seed,
          ).ready,
      ),
      title: "Menu",
      footer: defaultFooter,
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
          ? readSnapshot(
              data.published.ids,
              data.published.title,
              data.published.pours,
              data.published.footer,
            )
          : null;
      return {
        items: data.items.map((item: Item) => ({
          ...item,
          group: migratedGroup(item),
        })),
        draft: validIds(
          data.draft,
          data.items.map((i: Item) => "pour:" + i.id),
        ),
        title: typeof data.title === "string" ? data.title : "Menu",
        footer:
          typeof data.footer !== "string" ||
          (!data.footerVersion && data.footer === "No rush.")
            ? defaultFooter
            : data.footer,
        published,
      };
    } catch {
      return initial;
    }
  },
  save(state: BarState) {
    localStorage.setItem(key, JSON.stringify({ ...state, footerVersion: 2 }));
  },
};
