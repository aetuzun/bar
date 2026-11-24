import { Dropdown } from "./Dropdown";
import { CardList, SortCard } from "./CardOrder";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  availability,
  measure,
  families,
  groups,
  recipes,
  ingredientKinds, kindGroup, onShoppingList, releaseShopping,
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
  const [compact, setCompact] = useState(() => window.scrollY > 48);
  useEffect(() => {
    const update = () => setCompact(window.scrollY > 48);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [route]);
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
    <header className={intro ? "site-header guest-header" : "site-header"} data-compact={compact}>
      <div className="header-inner">
        <a className="brand" href={guest ? location.hash : "#bar"} aria-label="The Home · Bar"
          onClick={event => {
            if (guest || route === "bar") {
              event.preventDefault();
              window.scrollTo(0, 0);
            }
          }}>
          <span className="brand-letters" aria-hidden="true">
            T<span className="brand-fold"><span>he&nbsp;</span></span>H<span className="brand-fold"><span>ome</span></span>
            <span className="brand-dot">·</span>B<span className="brand-fold"><span>ar</span></span>
          </span>
        </a>
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
  const adding = !item.name;
  const [step, setStep] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
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
      <form onSubmit={e => {
        e.preventDefault();
        if ((!adding || step === 3) && form.name.trim() && form.kind.trim())
          save({ ...form, name: form.name.trim(), kind: form.kind.trim() });
      }}>
        <div className="wizard-nav">
          {adding && step > 1 && <button type="button" aria-label="Back" onClick={() => setStep(step - 1)}>←</button>}
          <button type="button" className="card-remove" aria-label="Close" onClick={close}><span /></button>
        </div>
        {adding && <p className="step-count">Add item · {step} of 3</p>}
        <h2 ref={heading} tabIndex={-1} autoFocus>{adding ? ["Choose a category", "Choose a type", "Bottle details"][step - 1] : "Edit item"}</h2>
        {adding && step === 1 && <div className="wizard-choices">{groups.map(group =>
          <button key={group} type="button" onClick={() => {
            if (group !== form.group) { setForm({ ...item, group }); setCustom(false); }
            setStep(2);
          }}>{group}</button>)}</div>}
        {adding && step === 2 && <div className="wizard-choices">{[...ingredientKinds.filter(kind => kindGroup(kind) === form.group), "Custom type…"].map(kind =>
          <button key={kind} type="button" onClick={() => {
            const other = kind === "Custom type…";
            setCustom(other);
            if ((!other && form.kind !== kind) || (other && !custom))
              setForm({ ...form, kind: other ? "" : kind, name: other ? "" : kind });
            setStep(3);
          }}>{kind}</button>)}</div>}
        {(!adding || step === 3) && <>
          <label>Item name<input required maxLength={100} value={form.name} onChange={e => field("name", e.target.value)} /></label>
          {!adding && <>
            <div className="editor-field"><span>Category</span>
              <Dropdown label="Category" value={form.group} onChange={value => field("group", value as Item["group"])}>
                {groups.map(group => <option key={group}>{group}</option>)}
              </Dropdown>
            </div>
            <div className="editor-field"><span>Ingredient type</span>
              <Dropdown label="Ingredient type" value={custom ? "__custom" : form.kind} onChange={value => {
                setCustom(value === "__custom");
                setForm({ ...form, kind: value === "__custom" ? "" : value, group: value === "__custom" ? form.group : kindGroup(value) });
              }}>
                {groups.map(group => <optgroup key={group} label={group}>{ingredientKinds.filter(kind => kindGroup(kind) === group).map(kind => <option key={kind}>{kind}</option>)}</optgroup>)}
                <option value="__custom">Custom type…</option>
              </Dropdown>
            </div>
          </>}
          {custom && <label>Custom ingredient type<input required maxLength={80} value={form.kind} onChange={e => field("kind", e.target.value)} /></label>}
          {(form.openedOn || ["Wine & sparkling", "Vermouth & fortified wine", "Aperitifs & liqueurs"].includes(form.group)) &&
            <label>Opened on (optional)<input type="date" value={form.openedOn || ""} onChange={e => field("openedOn", e.target.value)} /></label>}
          <div className="editor-field"><span>Status</span><Dropdown label="Status" value={form.status} onChange={v => field("status", v as Item["status"])}>
            {statuses.map(status => <option key={status}>{status}</option>)}
          </Dropdown></div>
          <div className="actions"><button className="solid" disabled={!form.kind.trim() || !form.name.trim()}>Save item</button></div>
        </>}
      </form>
    </dialog>
  );
}
function AddPicker({ label, placeholder, choose, children }: {
  label: string;
  placeholder: string;
  choose: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Dropdown add label={label} placeholder={placeholder} onChange={choose}>
      {children}
    </Dropdown>
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
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>(["Whiskies"]);
  const [notice, setNotice] = useState("");
  const [previous, setPrevious] = useState<Item | null>(null);
  const matches = (i: Item) => (i.name + " " + i.kind).toLowerCase().includes(query.trim().toLowerCase());
  const nextStatus = (i: Item) => i.status === "Available" ? "Low" : i.status === "Low" ? "Unavailable" : "Available";
  function cycle(i: Item) {
    setPrevious(i);
    const status = nextStatus(i);
    const changed = { ...i, status } as Item;
    delete changed.shoppingOrigin;
    if (!onShoppingList(changed)) delete changed.shoppingRecipes;
    update({ ...state, items: state.items.map(row => row.id === i.id ? changed : row) });
    setNotice(i.name + " · " + status);
  }
  return (
    <>
      <div className="pagehead">
        <h1>Bar</h1>
      </div>
      <section className="inventory">
        <input type="search" className="stock-search" aria-label="Search inventory" placeholder="Find a bottle or ingredient" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="filter-bar">
        <div className="filters">
          {["All", "Low", "Shopping list"].map((g) => (
            <button
              key={g}
              aria-pressed={filter === g}
              onClick={() => setFilter(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <button
          className="filter-add"
          aria-label="Add item"
          title="Add item"
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
          <span aria-hidden="true">+</span>
        </button>
        </div>
        <div className="inventory-list">
          {[...groups, "Shopping list"].map((g) => {
            const rows = state.items.filter(
              (i) =>
                (g === "Shopping list"
                  ? onShoppingList(i)
                  : i.group === g && !onShoppingList(i)) &&
                matches(i) && (filter === "All" || g === filter || (filter === "Low" && i.status === "Low")),
            );
            if (!rows.length && !(g === "Shopping list" && filter === g)) return null;
            const expandable = !query.trim() && filter === "All";
            const open = !expandable || expanded.includes(g);
            const label = <>{g} <small>{rows.length}</small></>;
            return (
              <section className={"stock-section" + (g === "Shopping list" ? " shopping-section" : "")} key={g}>
                <h2>{expandable ? <button aria-expanded={open} onClick={() => setExpanded(open ? expanded.filter(name => name !== g) : [...expanded, g])}>
                  {label}<span className="disclosure" aria-hidden="true">{open ? "−" : "+"}</span>
                </button> : label}</h2>
                {open && <div>
                  {!rows.length && <p>Your shopping list is empty.</p>}
                  {rows.map(i => <div className="stockrow" key={i.id}>
                    <button className="stock-name" aria-label={"Edit " + i.name + ", " + i.status} onClick={() => setEdit(i)}>
                      {i.name}<small>{i.kind !== i.name ? i.kind : ""}{i.openedOn && " · Opened " + i.openedOn}</small>
                    </button>
                    <button className={"status dotted " + slug(i.status)} onClick={() => cycle(i)}
                      aria-label={i.name + ": " + i.status + ". Mark " + nextStatus(i)}>{i.status}</button>
                  </div>)}
                </div>}
              </section>
            );
          })}
        </div>
        {!state.items.some(i => matches(i) && (filter === "All" || (filter === "Low" ? i.status === "Low" : onShoppingList(i)))) && filter !== "Shopping list" && <p>{query ? "No matching ingredients." : filter === "Low" ? "Nothing is running low." : "Use + to add your first ingredient."}</p>}
        <p className="stock-notice" role="status">{notice || "Tap a status to update stock. Tap a name to edit."}{previous && <button className="undo-stock" onClick={() => {
          update({ ...state, items: state.items.map(i => i.id === previous.id ? previous : i) });
          setNotice(previous.name + " · " + previous.status);
          setPrevious(null);
        }}>Undo</button>}</p>
        <p className="storage-note">Saved in this browser. Changes don’t sync between devices.</p>
      </section>
      {edit && (
        <Editor
          item={edit}
          close={() => setEdit(null)}
          save={(edited) => {
            setPrevious(null);
            setNotice("");
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
function RecipeEntry({
  r, remove,
  state,
  toggle, shop,
}: {
  shop: (recipeId: string, kinds: string[], remove: boolean) => void;
  r: Recipe; remove: () => void;
  state: BarState;
  toggle: (id: string) => void;
}) {
  const result = availability(r, state.items),
    selected = state.draft.includes(r.id);
  const dialog = useRef<HTMLDialogElement>(null);
  const openRecipe = () => dialog.current?.showModal();
  const shopping = result.missing.every(kind => state.items.some(i => i.kind === kind && onShoppingList(i) && i.shoppingRecipes?.includes(r.id)));
  return (
    <SortCard id={r.id} name={r.name} remove={remove} className="recipe recipe-preview" open={openRecipe}>
      <div className="drink-art">
        <Glass recipe={r} />
      </div>
      <div className="recipe-heading">
        <h2><button aria-label={"View " + r.name + " recipe"} onClick={openRecipe}>{r.name}</button></h2>
        <p className="flavor">{r.style}</p>
        <p className="composition">{r.ingredients.map(([kind]) => kind).join(" · ")}</p>
      </div>
      <dialog className="prep-sheet" ref={dialog} aria-label={r.name + " recipe"} onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}>
        <div className="prep-body">
        <button className="card-remove" aria-label="Close recipe" onClick={() => dialog.current?.close()}><span /></button>
        <div className="prep-art"><Glass recipe={r} /></div>
        <h2>{r.name}</h2>
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
        </div>
      </dialog>
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
    </SortCard>
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
    { label: "Ready now", drinks: [] as Recipe[] },
    { label: "Missing 1", drinks: [] as Recipe[] },
    { label: "Missing 2 or more", drinks: [] as Recipe[] },
  ];
  for (const recipe of remaining) {
    const { missing } = availability(recipe, state.items);
    choices[Math.min(missing.length, 2)].drinks.push(recipe);
  }
  return (
    <>
      <div className="pagehead">
        <h1>Recipes</h1>
      </div>
      <div className="filter-bar">
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
        <AddPicker label="Add cocktail" placeholder={remaining.length ? "Choose a cocktail…" : "All cocktails added"} choose={id => {
          setOrder([...state.recipeOrder, id]);
          setFilter("All");
        }}>
          {choices.filter(group => group.drinks.length > 0).map(({ label, drinks }) => (
            <optgroup key={label} label={label}>
              {drinks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </optgroup>
          ))}
        </AddPicker>
      </div>
      <CardList order={state.recipeOrder} visible={list.map(r => r.id)} save={setOrder}>
        {list.map(r => <RecipeEntry key={r.id} r={r} state={state} toggle={toggle} shop={shop}
          remove={() => setOrder(state.recipeOrder.filter(id => id !== r.id))} />)}
      </CardList>
      {!list.length && <p>{state.recipeOrder.length ? "No matching recipes." : "Choose a cocktail to start your list."}</p>}

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
  return { visible, filters, resetFilter: () => setChoice("All") };
}
function pourCategory(style: Pour["style"]) {
  return style === "Whisky" ? "Whisky pours" : "Wine";
}
function menuSections(ids: string[], pour: (id: string) => Pour) {
  const sections = ["Cocktails", "Whisky", "Wine"].map(name => ({ name, ids: [] as string[] }));
  for (const id of ids) sections[byId(id) ? 0 : pour(id).style === "Whisky" ? 1 : 2].ids.push(id);
  return sections.filter(section => section.ids.length);
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
        {menuSections(visible, id => pours[Number(id.slice(1))]).map(section => <section className="menu-section" key={section.name}>
          <h2>{section.name}</h2>
          <div className="menu-track" tabIndex={0} role="region" aria-label={section.name}>{section.ids.map((id) => (
          <article className="menurow" key={id}>
            {byId(id) ? (
              <MenuDrink r={byId(id)} />
            ) : (
              <PourRow pour={pours[Number(id.slice(1))]} />
            )}
          </article>
        ))}</div></section>)}
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
  const [qrUrl, setQrUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState("");
  useEffect(() => { setCopiedUrl(""); setQrUrl(""); setNotice(""); }, [draftUrl]);
  const bottle = (id: string) => state.items.find((i) => "pour:" + i.id === id);
  const { visible, filters, resetFilter } = useMenuFilter(
    state.draft,
    (id) => families[id] || pourCategory(describe(bottle(id)!).style),
  );
  const unavailable = state.draft.some((id) => {
    const item = bottle(id);
    return item ? !inStock(item) : !availability(byId(id), state.items).ready;
  });
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
      <div className="filter-bar">
        {filters || <div className="filters"><button aria-pressed="true">All</button></div>}
        <AddPicker label="Add to menu" placeholder="Choose a cocktail or pour…" choose={id => {
          toggle(id);
          resetFilter();
        }}>
          <optgroup label="Cocktails">
            {recipes.filter(recipe => !state.draft.includes(recipe.id) && availability(recipe, state.items).ready)
              .map(recipe => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
          </optgroup>
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
        </AddPicker>
      </div>
      {menuSections(visible, id => describe(bottle(id)!)).map(section => <section className="menu-section" key={section.name}>
      <h2>{section.name}</h2>
      <div className="menu-track" tabIndex={0} role="region" aria-label={section.name}><CardList horizontal order={state.draft} visible={section.ids} save={draft => update({ ...state, draft })}>
      {section.ids.map(id => {
        const item = bottle(id),
          r = item || byId(id),
          result = item
            ? { ready: inStock(item), missing: [item.name], low: [] }
            : availability(byId(id), state.items);
        return (
          <SortCard className="menurow curator" key={id} id={id} name={r.name} remove={() => toggle(id)}>
            {item ? (
              <PourRow pour={describe(item)} />
            ) : (
              <MenuDrink r={byId(id)} />
            )}
            <div className="curator-tools">
              {!result.ready && <Availability result={result} />}

            </div>
          </SortCard>
        );
      })}
      </CardList></div></section>)}
      {!state.draft.length && (
        <p>
          Your selection is empty. <a href="#recipes">Browse recipes</a>
        </p>
      )}

      <div className="title-field guest-animation-field"><span>Guest animation</span>
        <Dropdown label="Guest animation" value={state.scene || "shaker"} onChange={scene => update({ ...state, scene: scene as Scene })}>
          {Object.entries(animations).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </Dropdown>
      </div>
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
              setNotice("Published. Copy the link or show the QR code to share.");
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
            Copy link
          </button>
          <button className="menu-toggle" disabled={!published} aria-expanded={published && qrUrl === draftUrl}
            onClick={() => setQrUrl(qrUrl === draftUrl ? "" : draftUrl)}>
            <span aria-hidden="true" /> QR code
          </button>
        </div>
        {published && qrUrl === draftUrl && (new TextEncoder().encode(qrUrl).length <= 2953
          ? <figure className="guest-qr"><QRCodeSVG value={qrUrl} level="L" size={320} marginSize={4} title="Scan to open the published guest menu" /><figcaption>Scan for the guest menu</figcaption></figure>
          : <p>This menu link is too long for a QR code. Use Copy link to share it.</p>)}
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
      if (index < 0) index = items.findIndex(i => i.kind === kind && i.status === "Unavailable");
      if (index < 0) {
        items.push({ id: crypto.randomUUID(), name: kind, kind, group: kindGroup(kind), status: "Planned",
          shoppingOrigin: "created", shoppingRecipes: [recipeId] });
      } else {
        const item = items[index];
        items[index] = { ...item, shoppingRecipes: [...new Set([...(item.shoppingRecipes || []), recipeId])],
          ...(item.status === "Unavailable" ? { status: "Planned", shoppingOrigin: "unavailable" } : {}) };
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
