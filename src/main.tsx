import { Dropdown, readGroups } from "./Dropdown";
import { CardList, SortCard } from "./CardOrder";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { MouseEvent, RefObject } from "react";
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
  type Snapshot,
} from "./store";
import { Glass, Illustration } from "./Art";
import "./style.css";

const libraryRecipe = (id: string) => recipes.find(r => r.id === id);
const tabs = ["Bar", "Recipes", "Menu"] as const;
const slug = (s: string) => s.toLowerCase().replaceAll(" ", "-");
function Wordmark() {
  return (
    <span className="brand-letters" aria-hidden="true">
            T<span className="brand-fold"><span>he&nbsp;</span></span>H<span className="brand-fold"><span>ome</span></span>
            <span className="brand-dot" />B<span className="brand-fold"><span>ar</span></span>
          </span>
  );
}
function Header({ route, guest = false, scene = "shaker", appPath = "" }: { route: string; guest?: boolean; scene?: Scene; appPath?: string }) {
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
        <a className="brand" href={guest ? location.hash : appPath + "#bar"} aria-label="The Home · Bar"
          onClick={event => {
            if (guest || route === "bar") {
              event.preventDefault();
              window.scrollTo(0, 0);
            }
          }}>
          <Wordmark />
        </a>
        {!guest && (
          <nav aria-label="Primary">
            {tabs.map((t) => (
              <a
                key={t}
                href={appPath + "#" + slug(t)}
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
const introKey = "the-home-bar.intro.v1";
let introSeen = false;
function BarIntro() {
  const [visible, setVisible] = useState(() => {
    if (introSeen || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    try { return !sessionStorage.getItem(introKey); } catch { return true; }
  });
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    introSeen = true;
    try { sessionStorage.setItem(introKey, "1"); } catch { /* Use the in-memory flag. */ }
    if (!visible) return;
    const finish = () => setVisible(false);
    const foldTimer = window.setTimeout(() => setCompact(true), 1300);
    const timer = window.setTimeout(finish, 3600);
    window.addEventListener("pointerdown", finish, { once: true });
    window.addEventListener("keydown", finish, { once: true });
    return () => {
      clearTimeout(foldTimer);
      clearTimeout(timer);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, [visible]);
  return visible ? <div className="bar-intro" data-compact={compact} aria-hidden="true">
    <div><Illustration id="martini" /><strong><Wordmark /></strong></div>
  </div> : null;
}
function Footer({ message = defaultFooter, page, guest = false }: { message?: string; page?: string; guest?: boolean }) {
  const footer = useRef<HTMLElement>(null);
  useEffect(() => {
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const original = theme?.content;
    const observer = new IntersectionObserver(([entry]) => {
      document.documentElement.classList.toggle("footer-visible", entry.isIntersecting);
      if (theme && original) theme.content = entry.isIntersecting ? getComputedStyle(entry.target).backgroundColor : original;
    });
    if (footer.current) observer.observe(footer.current);
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("footer-visible");
      if (theme && original) theme.content = original;
    };
  }, []);
  return <footer ref={footer}><div className="foot-inner">
    <div className="footer-signoff">
      {message.trim() && message !== defaultFooter && <span>{message}</span>}
      <a className="brand footer-wordmark" data-compact="true" href="./#bar" aria-label="The Home · Bar"><Wordmark /></a>
      <p className="footer-purpose">Track your bottles, mix cocktails, and share a menu.</p>
    </div>
    {!guest && <div className="footer-links" role="navigation" aria-label="Site information">
      {["About", "Help", "Privacy"].map(label => (
        <a key={label} href={`./${slug(label)}.html`} aria-current={page === slug(label) ? "page" : undefined}>{label}</a>
      ))}
    </div>}
    <small className="footer-copyright">© 2026 The Home.Bar</small>
  </div></footer>;
}
function dismissOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
  const dialog = event.currentTarget;
  if (event.target !== dialog) return;
  const { left, top, right, bottom } = dialog.getBoundingClientRect();
  const { clientX, clientY } = event;
  if (clientX < left || clientX > right || clientY < top || clientY > bottom) dialog.close();
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
    heading.current?.focus();
  }, []);
  function field<K extends keyof Item>(key: K, value: Item[K]) {
    setForm({ ...form, [key]: value });
  }
  return (
    <dialog
      className="entry-sheet" aria-label={item.name ? "Edit item" : "Add to bar"}
      ref={dialog}
      onClose={close}
      onClick={dismissOnBackdrop}
    >
      <form onSubmit={e => {
        e.preventDefault();
        if ((!adding || step === 3) && form.name.trim() && form.kind.trim())
          save({ ...form, name: form.name.trim(), kind: form.kind.trim() });
      }}>
        <div className="entry-sheet-head">
        <div className="wizard-nav">
          {adding && step > 1 && <button type="button" aria-label="Back" onClick={() => setStep(step - 1)}>←</button>}
          <p className="step-count">{adding ? `Add to bar · ${step} of 3` : "Bar"}</p>
          <button type="button" className="card-remove" aria-label="Close" onClick={() => dialog.current?.close()}><span /></button>
        </div>
        <h2 ref={heading} tabIndex={-1} autoFocus>{adding ? ["Choose a category", "Choose a type", "Bottle details"][step - 1] : "Edit item"}</h2>
        </div>
        <div className="entry-sheet-body">
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
          <div className="actions"><button className="solid" disabled={!form.kind.trim() || !form.name.trim()}>{adding ? "Add to bar" : "Save changes"}</button></div>
        </>}
        </div>
      </form>
    </dialog>
  );
}
function AddPicker({ label, caption, placeholder, choose, create, children }: {
  label: string;
  caption: string;
  placeholder: string;
  choose: (id: string) => void;
  create?: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const groups = readGroups(children);
  return <>
    <button className="filter-add" aria-label={label} aria-haspopup="dialog" onClick={() => {
      dialog.current?.showModal();
      heading.current?.focus();
    }}><span aria-hidden="true">+</span>{caption}</button>
    <dialog className="entry-sheet picker-sheet" ref={dialog} aria-label={label} onClick={dismissOnBackdrop}>
      <div className="picker-head entry-sheet-head">
        <h2 tabIndex={-1} ref={heading}>{label}</h2>
        <button className="card-remove" aria-label="Close" onClick={() => dialog.current?.close()}><span /></button>
      </div>
      <div className="entry-sheet-body">
      {groups.map(group => <section key={group.label}>
        <h3>{group.label}</h3>
        <div className="wizard-choices">{group.options.map(o =>
          <button key={o.value} disabled={o.disabled} onClick={() => { dialog.current?.close(); choose(o.value); }}>{o.label}</button>
        )}</div>
      </section>)}
      {!groups.length && <p>{placeholder}</p>}
      {create && <button type="button" className="picker-create" onClick={() => {
        dialog.current?.close();
        create();
      }}>Create a custom cocktail</button>}
      </div>
    </dialog>
  </>;
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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchControl = useRef<HTMLDivElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!searchOpen) return;
    const dismiss = (event: Event) => {
      if (!(event.target instanceof Node) || searchControl.current?.contains(event.target)) return;
      setSearchOpen(false);
      setQuery("");
    };
    document.addEventListener("click", dismiss);
    return () => document.removeEventListener("click", dismiss);
  }, [searchOpen]);
  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
    searchButton.current?.focus();
  }
  const [expanded, setExpanded] = useState<string[]>(["Whiskies"]);
  const [notice, setNotice] = useState("");
  const [previous, setPrevious] = useState<Item | null>(null);
  useEffect(() => {
    if (!previous) return;
    const timer = window.setTimeout(() => {
      setPrevious(null);
      setNotice("");
    }, 3500);
    return () => clearTimeout(timer);
  }, [previous]);
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
        <div className="filter-bar stock-filter-bar">
        <div className="filters">
          {["All", "Shopping list"].map((g) => (
            <button
              key={g}
              aria-pressed={filter === g}
              onClick={() => setFilter(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div ref={searchControl} className="stock-search-control" data-open={searchOpen} onBlur={e => {
          if (searchOpen && !query && !e.currentTarget.contains(e.relatedTarget)) {
            setSearchOpen(false);
            setQuery("");
          }
        }} onKeyDown={e => {
          if (e.key === "Escape" && searchOpen) closeSearch();
        }}>
          <input ref={searchInput} id="stock-search" type="search" className="stock-search"
            aria-label="Search inventory" placeholder="Find a bottle or ingredient"
            tabIndex={searchOpen ? 0 : -1} aria-hidden={!searchOpen}
            value={query} onChange={e => setQuery(e.target.value)} />
          <button ref={searchButton} type="button" aria-label={searchOpen ? "Close search" : "Search inventory"}
            aria-controls="stock-search" aria-expanded={searchOpen}
            onPointerDown={e => { if (searchOpen) e.preventDefault(); }}
            onClick={() => {
              if (searchOpen) {
                closeSearch();
                return;
              }
              flushSync(() => setSearchOpen(true));
              searchInput.current?.focus();
            }}>
            <span className={searchOpen ? "search-close" : "search-icon"} aria-hidden="true" />
          </button>
        </div>
        <button
          className="filter-add"
          aria-label="Add to bar"
          title="Add to bar"
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
          Bottle
        </button>
        </div>
        <div className="inventory-list">
          {[...groups, "Shopping list"].map((g) => {
            const rows = state.items.filter(
              (i) =>
                (g === "Shopping list"
                  ? onShoppingList(i)
                  : i.group === g && !onShoppingList(i)) &&
                matches(i) && (filter === "All" || g === filter),
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
        {filter === "All" && !state.items.some(matches) && <p>{query ? "No matching ingredients." : "Use + to add your first ingredient."}</p>}
        <p className="stock-notice" data-undo={!!previous} role="status">{notice}{previous && <button className="undo-stock" onClick={() => {
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
function CocktailEditor({ recipe, items, close, save }: {
  recipe?: Recipe;
  items: Item[];
  close: () => void;
  save: (recipe: Recipe) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ingredients, setIngredients] = useState<Recipe["ingredients"]>(recipe?.ingredients || [["", 30, "ml"]]);
  const kinds = [...new Set([...ingredientKinds, ...items.map(item => item.kind),
    ...ingredients.map(([kind]) => kind)].filter(Boolean))].sort();
  useEffect(() => { dialog.current?.showModal(); }, []);
  function setIngredient(index: number, ingredient: Recipe["ingredients"][number]) {
    setIngredients(rows => rows.map((row, i) => index === i ? ingredient : row));
  }
  return <dialog ref={dialog} className="entry-sheet" aria-label={recipe ? "Edit cocktail" : "Create cocktail"}
    onClose={close} onClick={dismissOnBackdrop}>
    <form onSubmit={event => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      const field = (key: string) => String(fields.get(key) || "").trim();
      if (!field("name") || !field("steps") || ingredients.some(([kind, quantity]) => !kind || !Number.isFinite(quantity) || quantity <= 0)) return;
      save({ id: recipe?.id || "custom-" + crypto.randomUUID(), name: field("name"), style: field("style"),
        glass: "martini", color: "#d9cf9d", ingredients, steps: field("steps"), garnish: field("garnish") || "None" });
    }}>
      <div className="picker-head entry-sheet-head">
        <h2>{recipe ? "Edit cocktail" : "Create cocktail"}</h2>
        <button type="button" className="card-remove" aria-label="Close" onClick={() => dialog.current?.close()}><span /></button>
      </div>
      <div className="entry-sheet-body">
        <label>Name<input name="name" required maxLength={80} defaultValue={recipe?.name} /></label>
        <label>Tasting note (optional)<input name="style" maxLength={120} defaultValue={recipe?.style} /></label>
        <fieldset className="custom-ingredients"><legend>Ingredients</legend>
          {ingredients.map(([kind, quantity, unit], index) => <div className="custom-ingredient" key={index}>
            <select aria-label={`Ingredient ${index + 1}`} value={kind} required onChange={e => setIngredient(index, [e.target.value, quantity, unit])}>
              <option value="">Choose an ingredient</option>
              {kinds.map(option => <option key={option}>{option}</option>)}
            </select>
            <input aria-label={`Quantity ${index + 1}`} type="number" min=".01" max="10000" step="any" required
              value={quantity || ""} onChange={e => setIngredient(index, [kind, e.target.valueAsNumber, unit])} />
            <select aria-label={`Unit ${index + 1}`} value={unit} onChange={e => setIngredient(index, [kind, quantity, e.target.value as typeof unit])}>
              {["ml", "leaves", "wedge", "dashes"].map(option => <option key={option}>{option}</option>)}
            </select>
            <button type="button" aria-label={`Remove ingredient ${index + 1}`} disabled={ingredients.length === 1}
              onClick={() => setIngredients(rows => rows.filter((_, i) => i !== index))}>×</button>
          </div>)}
          <button type="button" className="collection-action" disabled={ingredients.length >= 12}
            onClick={() => setIngredients(rows => [...rows, ["", 30, "ml"]])}>+ Ingredient</button>
        </fieldset>
        <label>Method<textarea name="steps" required maxLength={1200} defaultValue={recipe?.steps} rows={3} /></label>
        <label>Garnish (optional)<input name="garnish" maxLength={100} defaultValue={recipe?.garnish} /></label>
        <div className="actions"><button className="solid">Save cocktail</button></div>
      </div>
    </form>
  </dialog>;
}
function RecipeSheet({ r, dialog, edit, onClose }: {
  r: Recipe;
  dialog: RefObject<HTMLDialogElement | null>;
  edit?: () => void;
  onClose?: () => void;
}) {
  return <dialog className="prep-sheet" ref={dialog} aria-label={r.name + " recipe"}
    onClose={onClose} onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}>
        <div className="prep-body">
        <button className="card-remove" aria-label="Close recipe" onClick={() => dialog.current?.close()}><span /></button>
        <div className="prep-art"><Glass recipe={r} /></div>
        <h2>{r.name}</h2>
        {edit && <div className="recipe-personal-actions">
          <button onClick={() => { dialog.current?.close(); edit(); }}>Edit recipe</button>
        </div>}
      <section className="measures">
        <div className="label-row">
          <h3>Ingredients</h3>
          <span>Serves 1</span>
        </div>
        <ul className="ingredients">
          {r.ingredients.map(([kind, amount, unit], index) => (
            <li key={index}>
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
      </dialog>;
}

function RecipeEntry({
  r, remove,
  state, favorite, edit,
  toggle, shop,
}: {
  shop: (recipeId: string, kinds: string[], remove: boolean) => void;
  r: Recipe; remove: () => void;
  state: BarState;
  favorite: () => void;
  edit?: () => void;
  toggle: (id: string) => void;
}) {
  const result = availability(r, state.items),
    selected = state.draft.includes(r.id);
  const saved = state.favorites.includes(r.id);
  const dialog = useRef<HTMLDialogElement>(null);
  const openRecipe = () => dialog.current?.showModal();
  const shopping = result.missing.every(kind => state.items.some(i => i.kind === kind && onShoppingList(i) && i.shoppingRecipes?.includes(r.id)));
  return (
    <SortCard id={r.id} name={r.name} remove={remove} className="recipe recipe-preview" open={openRecipe}>
      <button className="recipe-heart" type="button" aria-label={"Save " + r.name}
        aria-pressed={saved} title={saved ? "Remove from Saved" : "Save recipe"} onClick={favorite}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.4 13a4.7 4.7 0 0 1 6.6-6.7L12 7.4l1.1-1.1a4.7 4.7 0 0 1 6.6 6.7Z" /></svg>
      </button>
      <div className="drink-art">
        <Glass recipe={r} />
      </div>
      <div className="recipe-heading">
        <h2><button aria-label={"View " + r.name + " recipe"} onClick={openRecipe}>{r.name}</button></h2>
        <p className="flavor">{r.style}</p>
        <p className="composition">{r.ingredients.map(([kind]) => kind).join(" · ")}</p>
      </div>
      <RecipeSheet r={r} dialog={dialog} edit={edit} />
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
  toggle, shop, setOrder, update, remove,
}: {
  state: BarState;
  update: (state: BarState) => void;
  remove: (recipe: Recipe, collection: "recipeOrder" | "favorites") => void;
  setOrder: (ids: string[]) => void;
  shop: (recipeId: string, kinds: string[], remove: boolean) => void;
  toggle: (id: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<Recipe | "new" | null>(null);
  const library = [...recipes, ...state.customRecipes];
  const list = (filter === "Saved" ? state.favorites : state.recipeOrder)
    .map(id => library.find(recipe => recipe.id === id)!).filter(
    (r) =>
      filter === "All" ||
      filter === "Saved" ||
      families[r.id] === filter ||
      (filter === "Ready now" && availability(r, state.items).ready) ||
      (filter === "Missing 1" &&
        availability(r, state.items).missing.length === 1),
  );
  const remaining = library.filter(r => !state.recipeOrder.includes(r.id)).sort((a,b) => a.name.localeCompare(b.name));
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
          "Saved",
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
        <AddPicker label="Add cocktail" caption="Cocktail" create={() => setEditing("new")}
          placeholder={remaining.length ? "Choose a cocktail…" : "All cocktails added"} choose={id => {
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
      <CardList order={filter === "Saved" ? state.favorites : state.recipeOrder} visible={list.map(r => r.id)}
        save={ids => filter === "Saved" ? update({ ...state, favorites: ids }) : setOrder(ids)}>
        {list.map(r => <RecipeEntry key={r.id} r={r} state={state} toggle={toggle} shop={shop}
          edit={r.id.startsWith("custom-") ? () => setEditing(r) : undefined}
          favorite={() => state.favorites.includes(r.id) ? remove(r, "favorites")
            : update({ ...state, favorites: [...state.favorites, r.id] })}
          remove={() => remove(r, filter === "Saved" ? "favorites" : "recipeOrder")} />)}
      </CardList>
      {!list.length && <p>{filter === "Saved" ? "Tap a heart on a cocktail to save it here." : state.recipeOrder.length ? "No matching recipes." : "Choose a cocktail to start your list."}</p>}
      {editing && <CocktailEditor recipe={editing === "new" ? undefined : editing} items={state.items} close={() => setEditing(null)}
        save={recipe => {
          update({ ...state, customRecipes: editing === "new" ? [...state.customRecipes, recipe] :
            state.customRecipes.map(item => item.id === recipe.id ? recipe : item),
            recipeOrder: state.recipeOrder.includes(recipe.id) ? state.recipeOrder : [...state.recipeOrder, recipe.id] });
          setFilter("All");
          setEditing(null);
        }} />}

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
function GuestCustomDrink({ drink }: { drink: NonNullable<Snapshot["cocktails"]>[number] }) {
  return <>
    <div className="drink-art"><Illustration id="martini" /></div>
    <div>
      <h2>{drink.name}</h2>
      <p className="flavor">{drink.style}</p>
      <p className="composition">{drink.ingredients.join(" · ")}</p>
    </div>
  </>;
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
  for (const id of ids) sections[libraryRecipe(id) || id.startsWith("custom-") ? 0 : pour(id).style === "Whisky" ? 1 : 2].ids.push(id);
  return sections.filter(section => section.ids.length);
}
function GuestList({
  ids,
  title,
  pours = [],
  cocktails = [],
}: {
  ids: string[];
  title: string;
  pours?: Pour[];
  cocktails?: NonNullable<Snapshot["cocktails"]>;
}) {
  const { visible, filters } = useMenuFilter(
    ids,
    (id) => families[id] || (id.startsWith("custom-") ? "Custom" : pourCategory(pours[Number(id.slice(1))].style)),
  );
  return (
    <>
      <div className="pagehead"><h1>{title}</h1></div>
      {filters}
      <div className="guest-list">
        {menuSections(visible, id => pours[Number(id.slice(1))]).map(section => <section className="menu-section" key={section.name}>
          <h2>{section.name}</h2>
          <div className="menu-track" tabIndex={0} role="region" aria-label={section.name}>{section.ids.map((id) => (
          <article className="menurow" key={id}>
            {libraryRecipe(id) ? (
              <MenuDrink r={libraryRecipe(id)!} />
            ) : id.startsWith("custom-") ? (
              <GuestCustomDrink drink={cocktails.find(drink => drink.id === id)!} />
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
  toggle, remove, loadDraft, removeSaved,
}: {
  state: BarState;
  update: (s: BarState) => void;
  toggle: (id: string) => void;
  remove: (id: string, name: string) => void;
  loadDraft: (state: BarState) => void;
  removeSaved: (menu: BarState["savedMenus"][number]) => void;
}) {
  const [notice, setNotice] = useState("");
  const [savedName, setSavedName] = useState("");
  const savedMenus = state.savedMenus.filter(menu => menu.savedByUser || menu.name !== (menu.title || "Menu") + " (previous draft)");
  function savedMenuRow(menu: BarState["savedMenus"][number]) {
    return <div className="saved-menu-row" key={menu.id}>
      <span>{menu.name}</span>
      <div className="saved-menu-actions">
        <button className="collection-action" onClick={() => {
          loadDraft({ ...state, draft: menu.draft, title: menu.title, footer: menu.footer, scene: menu.scene });
          resetFilter();
        }}>Load as draft</button>
        <button className="saved-menu-remove" aria-label={"Remove saved menu " + menu.name}
          title="Remove saved menu" onClick={() => removeSaved(menu)}>×</button>
      </div>
    </div>;
  }
  const menuLibrary = [...recipes, ...state.customRecipes];
  const byId = (id: string) => menuLibrary.find(recipe => recipe.id === id)!;
  const draftUrl = guestUrl(publishSnapshot(state));
  const published = !!state.published && guestUrl(state.published) === draftUrl;
  useEffect(() => setNotice(""), [draftUrl]);
  const bottle = (id: string) => state.items.find((i) => "pour:" + i.id === id);
  const { visible, filters, resetFilter } = useMenuFilter(
    state.draft,
    (id) => families[id] || (id.startsWith("custom-") ? "Custom" : pourCategory(describe(bottle(id)!).style)),
  );
  const unavailable = state.draft.some((id) => {
    const item = bottle(id);
    return item ? !inStock(item) : !availability(byId(id), state.items).ready;
  });
  return (
    <>
      <div className="pagehead">
        <h1>Menu</h1>
      </div>
      <div className="filter-bar">
        {filters || <div className="filters"><button aria-pressed="true">All</button></div>}
        <AddPicker label="Add to menu" caption="Drink" placeholder="Choose a cocktail or pour…" choose={id => {
          toggle(id);
          resetFilter();
        }}>
          <optgroup label="Cocktails">
            {menuLibrary.filter(recipe => !state.draft.includes(recipe.id) && availability(recipe, state.items).ready)
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
          <SortCard className="menurow curator" key={id} id={id} name={r.name} remove={() => remove(id, r.name)}>
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

      <details className="menu-settings"><summary>Saved menus</summary>
        <div className="saved-menus">
          <form onSubmit={event => {
            event.preventDefault();
            const name = savedName.trim();
            if (!name) return;
            const { draft, title, footer, scene } = state;
            update({ ...state, savedMenus: [...state.savedMenus, { id: crypto.randomUUID(), name, draft, title, footer, scene, savedByUser: true }] });
            setSavedName("");
          }}>
            <label className="visually-hidden" htmlFor="saved-menu-name">Menu collection name</label>
            <input id="saved-menu-name" value={savedName} onChange={event => setSavedName(event.target.value)}
              required maxLength={80} placeholder="Name this draft" />
            <button className="collection-action">Save a copy</button>
          </form>
          {savedMenus.map(savedMenuRow)}
        </div>
      </details>
      <details className="menu-settings"><summary>Menu options</summary><div className="settings-fields">
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
        <span>Guest message</span>
        <input
          maxLength={100}
          value={state.footer}
          onChange={(e) => {
            update({ ...state, footer: e.target.value });
            setNotice("");
          }}
        />
      </label>
      </div></details>
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
              setNotice("Guest menu published.");
            }}
          >
            <span aria-hidden="true" />
            Publish
          </button>
          {["Open", "QR"].map(label => published
            ? <a key={label} className="share-link" target="_blank" rel="noopener noreferrer"
                href={label === "Open" ? draftUrl : draftUrl.replace("#guest/", "#qr/")}>{label}</a>
            : <button key={label} className="share-link" disabled>{label}</button>)}
        </div>
        {unavailable && (
          <p className="feedback">
            Confirm missing ingredients in Bar or remove unavailable drinks to
            publish.
          </p>
        )}
        <p role="status" className="visually-hidden">{notice}</p>
      </section>
    </>
  );
}
function Manager({ route }: { route: string }) {
  const [state, setState] = useState(storage.load);
  const [error, setError] = useState(false);
  const [removal, setRemoval] = useState<{
    route: string;
    message: string;
    restore: (current: BarState) => BarState;
  } | null>(null);
  useEffect(() => {
    if (!removal) return;
    const timer = window.setTimeout(() => setRemoval(null), 5000);
    return () => clearTimeout(timer);
  }, [removal]);
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
    if (state.draft.includes(id)) {
      const recipe = libraryRecipe(id) || state.customRecipes.find(item => item.id === id);
      if (recipe) removeFrom("draft", id, recipe.name);
      return;
    }
    update({
      ...state,
      draft: [...state.draft, id],
    });
  }
  function removeFrom(collection: "recipeOrder" | "favorites" | "draft", id: string, label: string) {
    const index = state[collection].indexOf(id);
    const items = collection === "recipeOrder" ? releaseShopping(state.items, id) : state.items;
    const shopping = collection === "recipeOrder" ? state.items.filter(item => item.shoppingRecipes?.includes(id)) : [];
    update({ ...state, [collection]: state[collection].filter(entry => entry !== id), items });
    setRemoval({ route, message: "Removed " + label, restore: current => {
      const order = [...current[collection]];
      if (!order.includes(id)) order.splice(index, 0, id);
      const restoredItems = [...current.items];
      for (const original of shopping) {
        const afterRemoval = items.find(item => item.id === original.id);
        const currentIndex = restoredItems.findIndex(item => item.id === original.id);
        if (currentIndex === -1 && !afterRemoval) restoredItems.push(original);
        else if (restoredItems[currentIndex] === afterRemoval && currentIndex >= 0) restoredItems[currentIndex] = original;
      }
      return { ...current, [collection]: order, items: restoredItems };
    } });
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
          <Recipes setOrder={recipeOrder => update({ ...state, recipeOrder })}
            remove={(recipe, collection) => removeFrom(collection, recipe.id, recipe.name)}
            shop={shop} state={state} toggle={toggle} update={update} />
        ) : route === "menu" ? (
          <Menu state={state} update={update} toggle={toggle} remove={(id, name) => removeFrom("draft", id, name)}
            removeSaved={menu => {
              const position = state.savedMenus.indexOf(menu);
              update({ ...state, savedMenus: state.savedMenus.filter(item => item.id !== menu.id) });
              setRemoval({ route, message: "Removed " + menu.name, restore: current => {
                const savedMenus = [...current.savedMenus];
                if (!savedMenus.some(item => item.id === menu.id)) savedMenus.splice(position, 0, menu);
                return { ...current, savedMenus };
              } });
            }}
            loadDraft={next => {
              const { draft, title, footer, scene } = state;
              update(next);
              setRemoval({ route, message: "Loaded saved menu",
                restore: current => ({ ...current, draft, title, footer, scene }) });
            }} />
        ) : (
          <><BarIntro /><Bar state={state} update={update} /></>
        )}
        {removal?.route === route && <div className="stock-notice" data-undo="true">
          <span role="status">{removal.message}</span>
          <button className="undo-stock" onClick={() => {
            update(removal.restore(state));
            setRemoval(null);
          }}>Undo</button>
        </div>}
      </main>
      <Footer />
    </>
  );
}
function AboutGallery() {
  const viewport = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const mouseOver = useRef(false);
  const resumeAfter = useRef(0);
  const [selected, setSelected] = useState<Recipe | null>(null);

  useEffect(() => {
    const scroller = viewport.current;
    const firstRun = scroller?.firstElementChild?.firstElementChild;
    if (!scroller || !firstRun || selected) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let frame = 0;
    let previousTime = 0;
    let distance = 0;

    const advance = (time: number) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0;
      previousTime = time;
      if (!mouseOver.current && !scroller.querySelector(":focus-visible") && time >= resumeAfter.current) {
        distance += elapsed * 0.028;
        const pixels = Math.floor(distance);
        if (pixels) {
          const runWidth = firstRun.getBoundingClientRect().width;
          if (runWidth) scroller.scrollLeft = (scroller.scrollLeft + pixels) % runWidth;
          distance -= pixels;
        }
      }
      frame = requestAnimationFrame(advance);
    };
    const updateMotion = () => {
      cancelAnimationFrame(frame);
      previousTime = 0;
      if (inView && !motion.matches) frame = requestAnimationFrame(advance);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateMotion();
    });
    observer.observe(scroller);
    motion.addEventListener("change", updateMotion);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updateMotion);
      cancelAnimationFrame(frame);
    };
  }, [selected]);

  const pauseForBrowsing = () => { resumeAfter.current = performance.now() + 1800; };
  const openRecipe = (recipe: Recipe) => {
    flushSync(() => setSelected(recipe));
    dialog.current?.showModal();
  };

  return <section className="about-gallery" aria-label="Cocktail gallery">
    <div className="about-gallery-window" ref={viewport}
      onPointerEnter={event => { if (event.pointerType === "mouse") mouseOver.current = true; }}
      onPointerLeave={event => { if (event.pointerType === "mouse") mouseOver.current = false; }}
      onPointerDown={pauseForBrowsing} onPointerUp={pauseForBrowsing}
      onPointerCancel={pauseForBrowsing} onWheel={pauseForBrowsing}>
      <div className="about-gallery-track">
        {[false, true].map(copy => <div className="about-gallery-run" key={String(copy)} aria-hidden={copy || undefined}>
          {recipes.map(recipe => <button className="about-gallery-card" type="button" key={recipe.id}
            aria-label={recipe.name} tabIndex={copy ? -1 : undefined} onClick={() => openRecipe(recipe)}>
            <Glass recipe={recipe} />
          </button>)}
        </div>)}
      </div>
    </div>
    {selected && <RecipeSheet r={selected} dialog={dialog} onClose={() => setSelected(null)} />}
  </section>;
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
  if (hash.startsWith("#qr/")) {
    const guestHash = hash.replace("#qr/", "#guest/");
    const url = new URL(guestHash, location.href).href;
    return <main className="qr-page"><h1>{guestMenu(guestHash).title}</h1>
      {new TextEncoder().encode(url).length <= 2953
        ? <QRCodeSVG value={url} level="L" size={384} marginSize={4} title="Scan for the guest menu" />
        : <p>This menu is too large for a QR code. Share the guest link instead.</p>}
      <a href={url}>Open guest menu</a></main>;
  }
  if (hash === "#guest" || hash.startsWith("#guest/")) {
    const snapshot = guestMenu(hash);
    return (
      <>
        <Header key={hash} route="" guest scene={snapshot.scene} />
        <main>
          <GuestList {...snapshot} />
        </main>
        <Footer message={snapshot.footer} guest />
      </>
    );
  }
  return (
    <Manager
      route={["#recipes", "#menu"].includes(hash) ? hash.slice(1) : "bar"}
    />
  );
}
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  const header = document.getElementById("info-header");
  const footer = document.getElementById("info-footer");
  const gallery = document.getElementById("about-gallery");
  if (header && footer) {
    createRoot(header).render(<Header route="" appPath="./" />);
    createRoot(footer).render(<Footer page={document.body.dataset.page} />);
  }
  if (gallery) createRoot(gallery).render(<AboutGallery />);
}
