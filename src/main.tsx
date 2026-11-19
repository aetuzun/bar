import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  availability,
  measure,
  families,
  groups,
  recipes,
  seed,
  statuses,
  type Item,
  type Recipe,
} from "./data";
import { describe, eligible, inStock, PourRow, type Pour } from "./pours";
import {
  publishSnapshot,
  defaultFooter,
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
function Header({ route, guest = false }: { route: string; guest?: boolean }) {
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
          data-iphone={/\biPhone\b/.test(navigator.userAgent) || undefined}
          aria-label="Dismiss cocktail animation"
          onClick={() => setIntro(false)}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && event.animationName === "guest-island") setIntro(false);
          }}
        >
          <svg className="island-crown" viewBox="0 0 360 64" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d="M0 64C0 47 18 40 42 33C70 25 85 15 102 8C116 2 126 0 139 0H221C234 0 244 2 258 8C275 15 290 25 318 33C342 40 360 47 360 64Z" />
          </svg>
          <span className="guest-pour" aria-hidden="true" />
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
    <footer>
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
        <h2>{item.name ? "Edit item" : "Add item"}</h2>
        <label>
          Item name
          <input
            autoFocus
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
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
          <input
            list="kinds"
            required
            maxLength={80}
            value={form.kind}
            onChange={(e) => field("kind", e.target.value)}
          />
        </label>
        <datalist id="kinds">
          {[...new Set(seed.map((i) => i.kind))].sort().map((k) => (
            <option key={k}>{k}</option>
          ))}
        </datalist>
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
        <small className="storage-note">
          Inventory is saved only in this browser.
        </small>
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
          {["All", ...groups, "Planned"].map((g) => (
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
          {[...groups, "Planned"].map((g) => {
            const rows = state.items.filter(
              (i) =>
                (g === "Planned"
                  ? i.status === "Planned"
                  : i.group === g && i.status !== "Planned") &&
                (filter === "All" || g === filter),
            );
            if (!rows.length) return null;
            return (
              <section className="group" key={g}>
                <div className="group-title">
                  <h3>{g}</h3>
                </div>
                <div>
                  {rows.map((i) => (
                    <button
                      className="stockrow"
                      key={i.id}
                      aria-label={"Edit " + i.name + ", " + i.status}
                      onClick={() => setEdit(i)}
                    >
                      <span>{i.name}</span>
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
              status: filter === "Planned" ? "Planned" : "Available",
            })
          }
        >
          Add item
        </button>
      </section>
      {edit && (
        <Editor
          item={edit}
          close={() => setEdit(null)}
          save={(item) => {
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
  r,
  state,
  toggle,
}: {
  r: Recipe;
  state: BarState;
  toggle: (id: string) => void;
}) {
  const result = availability(r, state.items),
    selected = state.draft.includes(r.id);
  return (
    <article className="recipe">
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
              <span>{kind}</span>
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
        <button
          className="menu-toggle"
          aria-pressed={selected}
          aria-label={"Menu, " + r.name}
          aria-describedby={"stock-" + r.id}
          disabled={!result.ready}
          onClick={() => toggle(r.id)}
        >
          <span aria-hidden="true" />
          Menu
        </button>
      </div>
    </article>
  );
}
function Recipes({
  state,
  toggle,
}: {
  state: BarState;
  toggle: (id: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const list = recipes.filter(
    (r) =>
      filter === "All" ||
      families[r.id] === filter ||
      (filter === "Ready now" && availability(r, state.items).ready) ||
      (filter === "Missing 1" &&
        availability(r, state.items).missing.length === 1),
  );
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
          "Aperitivo",
          "Whiskey",
          "Spritz",
          "Martini",
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
      {list.map((r) => (
        <RecipeEntry key={r.id} r={r} state={state} toggle={toggle} />
      ))}
      {!list.length && <p>No matching recipes.</p>}
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
    if (!state.published) return;
    try {
      await navigator.clipboard.writeText(guestUrl(state.published));
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
              <div className="actions">
                {[
                  [-1, "up", "↑"],
                  [1, "down", "↓"],
                ].map(([offset, label, icon]) => (
                  <button
                    key={label}
                    disabled={
                      index + Number(offset) < 0 ||
                      index + Number(offset) >= visible.length
                    }
                    aria-label={"Move " + r.name + " " + label}
                    onClick={() => move(index, Number(offset))}
                  >
                    {icon}
                  </button>
                ))}
                <button
                  aria-label={"Remove " + r.name}
                  onClick={() => {
                    toggle(id);
                    setNotice("");
                  }}
                >
                  ×
                </button>
              </div>
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
            disabled={!state.published}
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
        <p role="status">{notice}</p>
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
          <Recipes state={state} toggle={toggle} />
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
        <Header key={hash} route="" guest />
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
