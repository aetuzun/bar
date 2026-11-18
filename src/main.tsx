import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  availability,
  families,
  groups,
  recipes,
  seed,
  statuses,
  type Item,
  type Recipe,
} from "./data";
import { guestIds, guestUrl, storage, type BarState } from "./store";
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
function Footer({ guest = false }: { guest?: boolean }) {
  return (
    <footer>
      <span>The Home Bar</span>
      <span>
        {guest
          ? "Guest edition"
          : "Saved in this browser only. Changes do not sync between devices."}
      </span>
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
    <dialog ref={dialog} onCancel={close}>
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
        <p>
          Update the bottles at home and the recipes page responds
          automatically.
        </p>
      </div>
      <section className="inventory">
        <div className="filters">
          {["All", ...groups, "Planned"].map((g) => (
            <button
              key={g}
              aria-pressed={filter === g}
              onClick={() => setFilter(g)}
            >
              {g === "Liqueurs/Aperitifs" ? "Liqueurs & Aperitifs" : g}
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
                      aria-label={"Edit " + i.name}
                      onClick={() => setEdit(i)}
                    >
                      <span>{i.name}</span>
                      <span className="status">{i.status}</span>
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
function RecipeEntry({
  r,
  state,
  toggle,
}: {
  r: Recipe;
  state?: BarState;
  toggle?: (id: string) => void;
}) {
  const a = state && availability(r, state.items);
  return (
    <article className="recipe">
      <div className="drink-art">
        <Glass recipe={r} />
      </div>
      <div>
        <h2>{r.name}</h2>
        <p className="flavor">{r.style}</p>
        <div className="details">
          <div>
            <h4>Serves 1</h4>
            <h4>Ingredients</h4>
            <ul className="ingredients">
              {r.ingredients.map(([name, q]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <h4>Garnish</h4>
            <p>{r.garnish}</p>
          </div>
          <div>
            <h4>Method</h4>
            <ol>
              {r.steps.split(". ").map((step) => (
                <li key={step}>{step.replace(/\.$/, "")}.</li>
              ))}
            </ol>
            {a && (
              <strong
                className={"availability " + (a.ready ? "ready" : "missing")}
              >
                {a.ready
                  ? "Ready now" + (a.low.length ? " · Low stock" : "")
                  : "Missing " + a.missing.join(", ")}
              </strong>
            )}
          </div>
        </div>
        {toggle && (
          <button className="text-action" onClick={() => toggle(r.id)}>
            {state?.draft.includes(r.id) ? "Remove from menu" : "Add to menu"}
          </button>
        )}
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
function GuestList({ ids }: { ids: string[] }) {
  const [filter, setFilter] = useState("All");
  return (
    <>
      <div className="pagehead">
        <h1>Menu</h1>
        <p>Tonight at The Home Bar</p>
      </div>
      <div className="filters">
        {["All", ...new Set(ids.map((id) => families[id]))].map((f) => (
          <button
            key={f}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {ids
        .filter((id) => filter === "All" || families[id] === filter)
        .map((id) => (
          <article className="menurow" key={id}>
            <MenuDrink r={byId(id)} />
          </article>
        ))}
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
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  function move(index: number, offset: number) {
    const draft = [...state.draft];
    [draft[index], draft[index + offset]] = [
      draft[index + offset],
      draft[index],
    ];
    update({ ...state, draft });
  }
  return preview ? (
    <>
      <button className="back" onClick={() => setPreview(false)}>
        Close preview
      </button>
      <GuestList ids={state.draft} />
    </>
  ) : (
    <>
      <div className="pagehead">
        <h1>Menu</h1>
        <p>Tonight at The Home Bar</p>
      </div>
      <div className="sectionhead">
        <h2>Draft selection</h2>
        <button onClick={() => setPreview(true)}>Preview menu</button>
      </div>
      {state.draft.map((id, index) => (
        <div className="menurow" key={id}>
          <MenuDrink r={byId(id)} />
          <div className="actions">
            <button
              disabled={!index}
              aria-label={"Move " + byId(id).name + " up"}
              onClick={() => move(index, -1)}
            >
              Up
            </button>
            <button
              disabled={index === state.draft.length - 1}
              aria-label={"Move " + byId(id).name + " down"}
              onClick={() => move(index, 1)}
            >
              Down
            </button>
            <button
              onClick={() => toggle(id)}
              aria-label={"Remove " + byId(id).name}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {!state.draft.length && (
        <p>
          Your selection is empty. <a href="#recipes">Browse recipes</a>
        </p>
      )}
      <div className="publish">
        <h2>Guest link</h2>
        <p>
          Publish a snapshot of this selection. Earlier links keep their
          original order and recipes.
        </p>
        <button
          className="solid"
          onClick={() => {
            update({ ...state, published: [...state.draft] });
            setNotice("Guest link published.");
          }}
        >
          Publish menu
        </button>{" "}
        {state.published && (
          <>
            <a
              href={guestUrl(state.published)}
              target="_blank"
              rel="noreferrer"
            >
              Open published menu
            </a>{" "}
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    guestUrl(state.published!),
                  );
                  setNotice("Guest link copied.");
                } catch {
                  setNotice("Copy the address from Open published menu.");
                }
              }}
            >
              Copy link
            </button>
          </>
        )}
        <p role="status">{notice}</p>
        <a href="#guest" target="_blank" rel="noreferrer">
          View public demo menu
        </a>
      </div>
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
          <GuestList ids={guestIds(hash)} />
        </main>
        <Footer guest />
      </>
    );
  return (
    <Manager
      route={["#recipes", "#menu"].includes(hash) ? hash.slice(1) : "bar"}
    />
  );
}
createRoot(document.getElementById("root")!).render(<App />);
