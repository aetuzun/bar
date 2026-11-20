import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  availability,
  measure,
  families,
  groups,
  recipes,
  seed, ingredientKinds, kindGroup, onShoppingList, releaseShopping,
  statuses,
  type Item,
  type Recipe,
} from "./data";
import { describe, eligible, inStock, PourRow, type Pour } from "./pours";
import {
  publishSnapshot,
  defaultFooter, animations, type Scene,
  guestMenu,
  guestUrl,
  storage,
  type BarState,
} from "./store";
import { Glass } from "./Art";
import "./style.css";

const byId = (id: string) => recipes.find((r) => r.id === id)!;
const tabs = ["Bar", "Recipes", "Menu"] as const;
const slug = (s: string) => s.toLowerCase().replaceAll(" ", "-");
function Header({ route, guest = false, scene = "shaker" }: { route: string; guest?: boolean; scene?: Scene }) {
  const [intro, setIntro] = useState(() => guest && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!intro) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => setIntro(false);
    motion.addEventListener("change", stop);
    if (motion.matches) stop();
    return () => motion.removeEventListener("change", stop);
  }, [intro]);
  return (
    <header className={intro ? "guest-header" : undefined}>
      <div className="header-inner">
        <div className="brand">The Home Bar</div>
        {!guest && (
          <nav aria-label="Primary">
            {tabs.map((t) => (
              <a
                key={t}
                href={"#" + slug(t)}
                aria-current={route === slug(t) ? "page" : undefined}
              >
                {t}
              </a>
            ))}
          </nav>
        )}
      </div>
      {intro && (
        <button
          type="button"
          className="guest-island"
          aria-label="Dismiss guest animation"
          onClick={() => setIntro(false)}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && event.animationName === "guest-island") setIntro(false);
          }}
        >
          <span className={scene === "shaker" ? "guest-pour" : "people-sprite " + scene} aria-hidden="true" />
        </button>
      )}
    </header>
  );
}
const nyDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "long",
  day: "numeric",
  year: "numeric",
});
function Footer({ message = defaultFooter }: { message?: string }) {
  const footerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      document.documentElement.classList.toggle("footer-visible", entry.isIntersecting);
    });
    if (footerRef.current) observer.observe(footerRef.current);
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("footer-visible");
    };
  }, []);
  const [date, setDate] = useState(() => nyDate.format(Date.now()));
  useEffect(() => {
    const tick = () => setDate(nyDate.format(Date.now()));
    const timer = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, []);
  return (
    <footer ref={footerRef}>
      <div className="foot-inner">
        <span>{message}</span>
        <time>{date}</time>
      </div>
    </footer>
  );
}
function Editor({
  item,
  save,
  close,
}: {
  item: Item;
  save: (i: Item) => void;
  close: () => void;
}) {
  const [form, setForm] = useState(item);
  const [custom, setCustom] = useState(!!item.kind && !ingredientKinds.includes(item.kind));
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function field<K extends keyof Item>(key: K, value: Item[K]) {
    setForm({ ...form, [key]: value });
  }
  return (
    <dialog
      aria-label={item.name ? "Edit item" : "Add item"}
      ref={dialog}
      onCancel={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.name.trim() && form.kind.trim())
            save({ ...form, name: form.name.trim(), kind: form.kind.trim() });
        }}
      >
        <h2 tabIndex={-1} autoFocus>{item.name ? "Edit item" : "Add item"}</h2>
        <label>
          Item name
          <input
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              const known = !form.kind && seed.find(i => i.name.toLowerCase() === name.trim().toLowerCase());
              setForm(known ? { ...form, name, kind: known.kind, group: known.group } : { ...form, name });
            }}
          />
        </label>
        <label>
          Category
          <select
            aria-label="Category"
            value={form.group}
            onChange={(e) => field("group", e.target.value as Item["group"])}
          >
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label>
          Ingredient type
          <select aria-label="Ingredient type" required value={custom ? "__custom" : form.kind} onChange={e => {
            const kind = e.target.value;
            setCustom(kind === "__custom");
            setForm({ ...form, kind: kind === "__custom" ? "" : kind, group: kind === "__custom" ? form.group : kindGroup(kind) });
          }}>
            <option value="" disabled>Choose a type…</option>
            {groups.map(group => <optgroup key={group} label={group}>
              {ingredientKinds.filter(kind => kindGroup(kind) === group).map(kind => <option key={kind}>{kind}</option>)}
            </optgroup>)}
            <option value="__custom">Custom type…</option>
          </select>
        </label>
        {custom && <label>Custom ingredient type<input required maxLength={80} value={form.kind} onChange={e => field("kind", e.target.value)} /></label>}
        {(form.openedOn || ["Wine & sparkling", "Vermouth & fortified wine", "Aperitifs & liqueurs"].includes(form.group)) &&
          <label>Opened on (optional)<input type="date" value={form.openedOn || ""} onChange={e => field("openedOn", e.target.value)} /></label>}
        <label>
          Status
          <select
            aria-label="Status"
            value={form.status}
            onChange={(e) => field("status", e.target.value as Item["status"])}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <div className="actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="solid">Save item</button>
        </div>
      </form>
    </dialog>
  );
}
function Bar({
  state,
  update,
}: {
  state: BarState;
  update: (state: BarState) => void;
}) {
  const [edit, setEdit] = useState<Item | null>(null);
  const [filter, setFilter] = useState("All");
  return (
    <>
      <div className="pagehead">
        <h1>Bar</h1>
      </div>
      <section className="inventory">
        <div className="filters">
          {["All", ...groups, "Shopping list"].map((g) => (
            <button
              key={g}
              aria-pressed={filter === g}
              onClick={() => setFilter(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="inventory-list">
          {[...groups, "Shopping list"].map((g) => {
            const rows = state.items.filter(
              (i) =>
                (g === "Shopping list"
                  ? onShoppingList(i)
                  : i.group === g && !onShoppingList(i)) &&
                (filter === "All" || g === filter),
            );
            if (!rows.length && !(g === "Shopping list" && filter === g)) return null;
            return (
              <section className={g === "Shopping list" ? "group shopping-group" : "group"} key={g}>
                <div className="group-title">
                  <h3>{g}</h3>
                </div>
                <div>
                  {!rows.length && <p>Your shopping list is empty.</p>}
                  {rows.map((i) => (
                    <button
                      className="stockrow"
                      key={i.id}
                      aria-label={"Edit " + i.name + ", " + i.status}
                      onClick={() => setEdit(i)}
                    >
                      <span>{i.name}{i.openedOn && !onShoppingList(i) && <small className="opened-date">Opened {i.openedOn}</small>}</span>
                      <span className={"status dotted " + slug(i.status)}>
                        {i.status}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <button
          className="text-action add"
          onClick={() =>
            setEdit({
              id: crypto.randomUUID(),
              name: "",
              group: groups.find((g) => g === filter) || "Spirits",
              kind: "",
              status: filter === "Shopping list" ? "Planned" : "Available",
            })
          }
        >
          Add item
        </button>
        <p className="storage-note">Saved in this browser. Changes don’t sync between devices.</p>
      </section>
      {edit && (
        <Editor
          item={edit}
          close={() => setEdit(null)}
          save={(edited) => {
            const item = { ...edited };
            // Saving a stock row makes it a manual inventory entry.
            delete item.shoppingOrigin;
            if (!onShoppingList(item) || item.kind !== edit.kind) delete item.shoppingRecipes;
            update({
              ...state,
              items: state.items.some((i) => i.id === item.id)
                ? state.items.map((i) => (i.id === item.id ? item : i))
                : [...state.items, item],
            });
            setEdit(null);
          }}
        />
      )}
    </>
  );
}
function Availability({
  result,
  id,
}: {
  result: ReturnType<typeof availability>;
  id?: string;
}) {
  const { ready, missing, low } = result;
  return (
    <p
      id={id}
      className={
        "availability dotted " +
        (ready ? "available" : missing.length === 1 ? "low" : "unavailable")
      }
    >
      {ready
        ? "Ready now" + (low.length ? " · Low on " + low.join(", ") : "")
        : "Missing " + missing.join(", ")}
    </p>
  );
}
function OrderTools({name, index, count, move, remove}: {
  name: string; index: number; count: number; move: (offset: number) => void; remove: () => void;
}) {
  return (
              <div className="actions order-tools">
                {[
                  [-1, "up"],
                  [1, "down"],
                ].map(([offset, label]) => (
                  <button
                    key={label}
                    disabled={
                      index + Number(offset) < 0 ||
                      index + Number(offset) >= count
                    }
                    aria-label={"Move " + name + " " + label}
                    onClick={() => move(Number(offset))}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" style={{ transform: offset === 1 ? "rotate(180deg)" : undefined }}><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                ))}
                <button
                  aria-label={"Remove " + name}
                  onClick={remove}
                >
                  ×
                </button>
              </div>
  );
}
function RecipeEntry({
  r, controls,
  state,
  toggle, shop,
}: {
  shop: (recipeId: string, kinds: string[], remove: boolean) => void;
  r: Recipe; controls: React.ReactNode;
  state: BarState;
  toggle: (id: string) => void;
}) {
  const result = availability(r, state.items),
    selected = state.draft.includes(r.id);
  const shopping = result.missing.every(kind => state.items.some(i => i.kind === kind && onShoppingList(i) && i.shoppingRecipes?.includes(r.id)));
  return (
    <article className="recipe">
      {controls}
      <div className="drink-art">
        <Glass recipe={r} />
      </div>
      <div className="recipe-heading">
        <h2>{r.name}</h2>
        <p className="flavor">{r.style}</p>
      </div>
      <section className="measures">
        <div className="label-row">
          <h3>Ingredients</h3>
          <span>Serves 1</span>
        </div>
        <ul className="ingredients">
          {r.ingredients.map(([kind, amount, unit]) => (
            <li key={kind}>
              <span>{unit === "ml" && (kind === "Lime" || kind === "Lemon") ? kind + " juice" : kind}</span>
              <span>{measure(amount, unit)}</span>
            </li>
          ))}
          <li>
            <span>Ice</span>
            <span>As needed</span>
          </li>
        </ul>
      </section>
      <section className="method">
        <h3>Method</h3>
        <ol>
          {r.steps.split(". ").map((step) => (
            <li key={step}>{step.replace(/\.$/, "")}.</li>
          ))}
        </ol>
        <div className="garnish">
          <h3>Garnish</h3>
          <p>{r.garnish}</p>
        </div>
      </section>
      <div className="recipe-tools">
        <Availability id={"stock-" + r.id} result={result} />
        {result.ready ? (
          <button className="menu-toggle" aria-pressed={selected} aria-label={"Menu, " + r.name}
            onClick={() => toggle(r.id)}><span aria-hidden="true" />Menu</button>
        ) : (
          <button className="menu-toggle shopping-action" aria-pressed={shopping}
            aria-label={(shopping ? "Remove " : "Add ") + r.name + (shopping ? " from shopping list" : " to shopping list")}
            onClick={() => shop(r.id, result.missing, shopping)}>
            <span aria-hidden="true" />Shopping list
          </button>
        )}
      </div>
    </article>
  );
}
function Recipes({
  state,
  toggle, shop, setOrder,
}: {
  state: BarState;
  setOrder: (ids: string[]) => void;
  shop: (recipeId: string, kinds: string[], remove: boolean) => void;
  toggle: (id: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const list = state.recipeOrder.map(byId).filter(
    (r) =>
      filter === "All" ||
      families[r.id] === filter ||
      (filter === "Ready now" && availability(r, state.items).ready) ||
      (filter === "Missing 1" &&
        availability(r, state.items).missing.length === 1),
  );
  const remaining = recipes.filter(r => !state.recipeOrder.includes(r.id)).sort((a,b) => a.name.localeCompare(b.name));
  const choices = [
    { label: "Ready now", dot: "🟢", drinks: [] as Recipe[] },
    { label: "Missing 1 ingredient", dot: "🟡", drinks: [] as Recipe[] },
    { label: "Missing 2 or more ingredients", dot: "🟠", drinks: [] as Recipe[] },
  ];
  for (const recipe of remaining) {
    const { missing } = availability(recipe, state.items);
    choices[Math.min(missing.length, 2)].drinks.push(recipe);
  }
  function move(index: number, offset: number) {
    const order = [...state.recipeOrder];
    const a = order.indexOf(list[index].id), b = order.indexOf(list[index + offset].id);
    [order[a], order[b]] = [order[b], order[a]];
    setOrder(order);
  }
  return (
    <>
      <div className="pagehead">
        <h1>Recipes</h1>
      </div>
      <div className="filters">
        {[
          "All",
          "Ready now",
          "Missing 1",
          ...new Set(Object.values(families)),
        ].map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {list.map((r, index) => (
        <RecipeEntry controls={<OrderTools name={r.name} index={index} count={list.length}
          move={offset => move(index, offset)} remove={() => setOrder(state.recipeOrder.filter(id => id !== r.id))} />} shop={shop} key={r.id} r={r} state={state} toggle={toggle} />
      ))}
      {!list.length && <p>{state.recipeOrder.length ? "No matching recipes." : "Choose a cocktail to start your list."}</p>}
      <label className="title-field"><span>Add cocktail</span>
        <select value="" disabled={!remaining.length} onChange={e => {
          if (e.target.value) { setOrder([...state.recipeOrder, e.target.value]); setFilter("All"); }
        }}>
          <option value="">{remaining.length ? "Choose a cocktail…" : "All cocktails added"}</option>
          {choices.filter(group => group.drinks.length > 0).map(({ label, dot, drinks }) => (
            <optgroup key={label} label={label}>
              {drinks.map(r => <option key={r.id} value={r.id}>{dot} {r.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
    </>
  );
}
function MenuDrink({ r }: { r: Recipe }) {
  return (
    <>
      <div className="drink-art">
        <Glass recipe={r} />
      </div>
      <div>
        <h2>{r.name}</h2>
        <p className="flavor">{r.style}</p>
        <p className="composition">
          {r.ingredients.map(([kind]) => kind).join(" · ")}
        </p>
      </div>
    </>
  );
}
function useMenuFilter(ids: string[], category: (id: string) => string) {
  const [choice, setChoice] = useState("All");
  const options = [...new Set(ids.map(category))];
  const active =
    options.length > 1 && options.includes(choice) ? choice : "All";
  const visible =
    active === "All" ? ids : ids.filter((id) => category(id) === active);
  const filters =
    options.length > 1 ? (
      <div className="filters" role="group" aria-label="Filter menu">
        {["All", ...options].map((f) => (
          <button
            key={f}
            aria-pressed={active === f}
            onClick={() => setChoice(f)}
          >
            {f}
          </button>
        ))}
      </div>
    ) : null;
  return { visible, filters };
}
function pourCategory(style: Pour["style"]) {
  return style === "Whisky" ? "Whisky pours" : "Wine";
}
function GuestList({
  ids,
  title,
  pours = [],
}: {
  ids: string[];
  title: string;
  pours?: Pour[];
}) {
  const { visible, filters } = useMenuFilter(
    ids,
    (id) => families[id] || pourCategory(pours[Number(id.slice(1))].style),
  );
  return (
    <>
      <div className="pagehead">
        <h1>{title}</h1>
      </div>
      {filters}
      <div className="guest-list">
        {visible.map((id) => (
          <article className="menurow" key={id}>
            {byId(id) ? (
              <MenuDrink r={byId(id)} />
            ) : (
              <PourRow pour={pours[Number(id.slice(1))]} />
            )}
          </article>
        ))}
      </div>
      {!ids.length && <p>No drinks on this menu.</p>}
    </>
  );
}
function Menu({
  state,
  update,
  toggle,
}: {
  state: BarState;
  update: (s: BarState) => void;
  toggle: (id: string) => void;
}) {
  const [notice, setNotice] = useState("");
  const draftUrl = guestUrl(publishSnapshot(state));
  const published = !!state.published && guestUrl(state.published) === draftUrl;
  const [copiedUrl, setCopiedUrl] = useState("");
  useEffect(() => { setCopiedUrl(""); setNotice(""); }, [draftUrl]);
  const bottle = (id: string) => state.items.find((i) => "pour:" + i.id === id);
  const { visible, filters } = useMenuFilter(
    state.draft,
    (id) => families[id] || pourCategory(describe(bottle(id)!).style),
  );
  const unavailable = state.draft.some((id) => {
    const item = bottle(id);
    return item ? !inStock(item) : !availability(byId(id), state.items).ready;
  });
  function move(index: number, offset: number) {
    const draft = [...state.draft];
    const from = draft.indexOf(visible[index]),
      to = draft.indexOf(visible[index + offset]);
    [draft[from], draft[to]] = [draft[to], draft[from]];
    update({ ...state, draft });
    setNotice("");
  }
  async function copy() {
    if (!state.published || !published) return;
    try {
      await navigator.clipboard.writeText(guestUrl(state.published));
      setCopiedUrl(draftUrl);
      setNotice("Guest link copied.");
    } catch {
      setNotice("Copy failed. Allow clipboard access and try again.");
    }
  }
  return (
    <>
      <div className="pagehead">
        <h1>Menu</h1>
      </div>
      {filters}{" "}
      {visible.map((id, index) => {
        const item = bottle(id),
          r = item || byId(id),
          result = item
            ? { ready: inStock(item), missing: [item.name], low: [] }
            : availability(byId(id), state.items);
        return (
          <article className="menurow curator" key={id}>
            {item ? (
              <PourRow pour={describe(item)} />
            ) : (
              <MenuDrink r={byId(id)} />
            )}
            <div className="curator-tools">
              {!result.ready && <Availability result={result} />}
              <OrderTools name={r.name} index={index} count={visible.length} move={offset => move(index, offset)}
                remove={() => { toggle(id); setNotice(""); }} />
            </div>
          </article>
        );
      })}
      {!state.draft.length && (
        <p>
          Your selection is empty. <a href="#recipes">Browse recipes</a>
        </p>
      )}
      <label className="title-field pour-picker">
        <span>Whisky &amp; wine</span>
        <select
          aria-label="Add whisky or wine to menu"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              toggle(e.target.value);
              setNotice("");
            }
          }}
        >
          <option value="">Choose a pour…</option>
          {["Whiskies", "Wine & sparkling"].map((group) => (
            <optgroup key={group} label={group}>
              {state.items
                .filter((item) => eligible(item) && item.group === group)
                .map((item) => {
                  const id = "pour:" + item.id,
                    selected = state.draft.includes(id);
                  return (
                    <option
                      value={id}
                      key={id}
                      disabled={selected || !inStock(item)}
                    >
                      {item.name}
                      {selected
                        ? " · On menu"
                        : !inStock(item)
                          ? " · " + item.status
                          : ""}
                    </option>
                  );
                })}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="title-field"><span>Guest animation</span>
        <select value={state.scene || "shaker"} onChange={e => update({ ...state, scene: e.target.value as Scene })}>
          {Object.entries(animations).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label className="title-field">
        <span>Menu title</span>
        <input
          maxLength={80}
          placeholder="Menu"
          value={state.title}
          onChange={(e) => {
            update({ ...state, title: e.target.value });
            setNotice("");
          }}
        />
      </label>
      <label className="title-field">
        <span>Footer message</span>
        <input
          maxLength={100}
          value={state.footer}
          onChange={(e) => {
            update({ ...state, footer: e.target.value });
            setNotice("");
          }}
        />
      </label>
      <section className="publish">
        <h2>Guest link</h2>
        <div className="actions">
          <button
            className="menu-toggle"
            data-complete={published}
            disabled={unavailable || !state.draft.length}
            onClick={() => {
              if (unavailable || !state.draft.length) return;
              update({
                ...state,
                published: publishSnapshot(state),
              });
              setNotice("Published. Copy the guest link to share.");
            }}
          >
            <span aria-hidden="true" />
            Publish
          </button>
          <button
            className="menu-toggle"
            data-complete={published && copiedUrl === draftUrl}
            disabled={!published}
            onClick={copy}
          >
            <span aria-hidden="true" />
            Copy guest link
          </button>
        </div>
        {unavailable && (
          <p className="feedback">
            Confirm missing ingredients in Bar or remove unavailable drinks to
            publish.
          </p>
        )}
        <p role="status" className={notice.startsWith("Copy failed") ? "feedback" : "visually-hidden"}>{notice}</p>
      </section>
    </>
  );
}
function Manager({ route }: { route: string }) {
  const [state, setState] = useState(storage.load);
  const [error, setError] = useState(false);
  function update(next: BarState) {
    setState(next);
    try {
      storage.save(next);
      setError(false);
    } catch {
      setError(true);
    }
  }
  function shop(recipeId: string, kinds: string[], remove: boolean) {
    if (remove) {
      update({ ...state, items: releaseShopping(state.items, recipeId) });
      return;
    }
    const items = [...state.items];
    for (const kind of new Set(kinds)) {
      let index = items.findIndex(i => i.kind === kind && onShoppingList(i));
      if (index < 0) index = items.findIndex(i => i.kind === kind && i.status === "Needs confirmation");
      if (index < 0) {
        items.push({ id: crypto.randomUUID(), name: kind, kind, group: kindGroup(kind), status: "Planned",
          shoppingOrigin: "created", shoppingRecipes: [recipeId] });
      } else {
        const item = items[index];
        items[index] = { ...item, shoppingRecipes: [...new Set([...(item.shoppingRecipes || []), recipeId])],
          ...(item.status === "Needs confirmation" ? { status: "Planned", shoppingOrigin: "unconfirmed" } : {}) };
      }
    }
    update({ ...state, items });
  }
  function toggle(id: string) {
    update({
      ...state,
      draft: state.draft.includes(id)
        ? state.draft.filter((v) => v !== id)
        : [...state.draft, id],
    });
  }
  return (
    <>
      <Header route={route} />
      <main>
        {error && (
          <p role="alert">
            Browser storage is unavailable. Changes will last for this session
            only.
          </p>
        )}
        {route === "recipes" ? (
          <Recipes setOrder={recipeOrder => {
            const removed = state.recipeOrder.find(id => !recipeOrder.includes(id));
            update({ ...state, recipeOrder, items: removed ? releaseShopping(state.items, removed) : state.items });
          }} shop={shop} state={state} toggle={toggle} />
        ) : route === "menu" ? (
          <Menu state={state} update={update} toggle={toggle} />
        ) : (
          <Bar state={state} update={update} />
        )}
      </main>
      <Footer message={state.footer} />
    </>
  );
}
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const changed = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  if (hash === "#guest" || hash.startsWith("#guest/")) {
    const snapshot = guestMenu(hash);
    return (
      <>
        <Header key={hash} route="" guest scene={snapshot.scene} />
        <main>
          <GuestList {...snapshot} />
        </main>
        <Footer message={snapshot.footer} />
      </>
    );
  }
  return (
    <Manager
      route={["#recipes", "#menu"].includes(hash) ? hash.slice(1) : "bar"}
    />
  );
}
createRoot(document.getElementById("root")!).render(<App />);
