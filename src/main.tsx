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
import { guestMenu, guestUrl, storage, type BarState } from "./store";
import { Glass } from "./Art";
import "./style.css";

const byId = (id: string) => recipes.find((r) => r.id === id)!;
const tabs = ["Bar", "Recipes", "Menu"] as const;
const slug = (s: string) => s.toLowerCase().replaceAll(" ", "-");
function Header({ route, guest = false }: { route: string; guest?: boolean }) {
  return (
    <header>
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
        {guest && <span className="edition">Guest menu</span>}
      </div>
    </header>
  );
}
const nyDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "long",
  day: "numeric",
  year: "numeric",
});
function Footer() {
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
        <strong>No rush.</strong>
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
          <span aria-hidden="true">{selected ? "✓" : "+"}</span>Menu
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
function GuestList({ ids, title }: { ids: string[]; title: string }) {
  return (
    <>
      <div className="pagehead">
        <h1>{title}</h1>
      </div>
      <div className="guest-list">
        {ids.map((id) => (
          <article className="menurow" key={id}>
            <MenuDrink r={byId(id)} />
          </article>
        ))}
      </div>
      {!ids.length && <p>No cocktails on this menu.</p>}
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
  const unavailable = state.draft.some(
    (id) => !availability(byId(id), state.items).ready,
  );
  function move(index: number, offset: number) {
    const draft = [...state.draft];
    [draft[index], draft[index + offset]] = [
      draft[index + offset],
      draft[index],
    ];
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
      {state.draft.map((id, index) => {
        const r = byId(id),
          result = availability(r, state.items);
        return (
          <article className="menurow curator" key={id}>
            <MenuDrink r={r} />
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
                      index + Number(offset) >= state.draft.length
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
      <section className="publish">
        <h2>Guest link</h2>
        <div className="actions">
          <button
            className="solid"
            disabled={unavailable || !state.draft.length}
            onClick={() => {
              if (unavailable || !state.draft.length) return;
              update({
                ...state,
                published: {
                  ids: [...state.draft],
                  title: state.title.trim() || "Menu",
                },
              });
              setNotice("Published. Copy the guest link to share.");
            }}
          >
            Publish
          </button>
          <button disabled={!state.published} onClick={copy}>
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
      <small className="storage-note">
        Drafts stay in this browser. Each published link shares a fixed menu.
      </small>
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
      <Footer />
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
  if (hash === "#guest" || hash.startsWith("#guest/"))
    return (
      <>
        <Header route="" guest />
        <main>
          <GuestList {...guestMenu(hash)} />
        </main>
        <Footer />
      </>
    );
  return (
    <Manager
      route={["#recipes", "#menu"].includes(hash) ? hash.slice(1) : "bar"}
    />
  );
}
createRoot(document.getElementById("root")!).render(<App />);
