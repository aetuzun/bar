import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";

type Option = { label: string; value: string; disabled?: boolean };
type Group = { label?: string; options: Option[] };
type OptionProps = { label?: string; value?: string; disabled?: boolean; children?: ReactNode };

export function readGroups(children: ReactNode): Group[] {
  const groups: Group[] = [];
  Children.forEach(children, child => {
    if (!isValidElement<OptionProps>(child)) return;
    const { label, value, disabled, children: content } = child.props;
    if (child.type === "optgroup") {
      const options = readGroups(content).flatMap(group => group.options);
      if (options.length) groups.push({ label, options });
    } else if (child.type === "option" && (value ?? content) !== "") {
      const option = { label: Children.toArray(content).join(""), value: value ?? String(content), disabled };
      const last = groups.at(-1);
      if (last && !last.label) last.options.push(option);
      else groups.push({ options: [option] });
    }
  });
  return groups;
}

export function Dropdown({ label, value = "", placeholder, onChange, children, add = false }: {
  label: string;
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  children: ReactNode;
  add?: boolean;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const [open, setOpen] = useState(false);
  const groups = readGroups(children);
  const selected = groups.flatMap(group => group.options).find(option => option.value === value);

  function close(restoreFocus = false) {
    clearTimeout(timer.current);
    if (popup.current?.matches(":popover-open")) popup.current.hidePopover();
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  function show(focus?: "first" | "last") {
    clearTimeout(timer.current);
    const panel = popup.current;
    const bounds = trigger.current?.getBoundingClientRect();
    if (!panel || !bounds) return;
    if (!panel.matches(":popover-open")) {
      document.dispatchEvent(new CustomEvent("dropdown-open", { detail: panel }));
      const width = Math.min(Math.max(add ? 270 : 220, bounds.width), window.innerWidth - 32);
      const left = Math.min(Math.max(16, add ? bounds.right - width : bounds.left), window.innerWidth - width - 16);
      const below = window.innerHeight - bounds.bottom - 20;
      const above = bounds.top - 20;
      const upward = below < 220 && above > below;
      Object.assign(panel.style, {
        width: width + "px", left: left + "px",
        top: upward ? "auto" : bounds.bottom + "px",
        bottom: upward ? window.innerHeight - bounds.top + "px" : "auto",
        maxHeight: Math.min(420, Math.max(upward ? above : below, 60)) + 6 + "px",
      });
      panel.dataset.upward = String(upward);
      panel.showPopover();
      setOpen(true);
    }
    if (focus) {
      const options = panel.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      (focus === "last" ? options[options.length - 1] : options[0])?.focus();
    }
  }

  useEffect(() => {
    if (!open) return;
    const outside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) close();
    };
    const scroll = (event: Event) => {
      if (event.target instanceof Node && popup.current?.contains(event.target)) return;
      close();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close(!!popup.current?.contains(document.activeElement));
    };
    const otherOpened = (event: Event) => {
      if ((event as CustomEvent).detail !== popup.current) close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    document.addEventListener("dropdown-open", otherOpened);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", scroll);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
      document.removeEventListener("dropdown-open", otherOpened);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", scroll);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function leave(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!popup.current?.contains(document.activeElement)) close();
    }, 200);
  }

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    const options = Array.from(popup.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: options.length - 1 }[event.key];
    if (event.key === "Tab") {
      close(true);
    } else if (next !== undefined && options.length) {
      event.preventDefault();
      options[(next + options.length) % options.length].focus();
    }
  }

  return <>
    <button ref={trigger} type="button" className={add ? "filter-add dropdown-add" : "dropdown-trigger"}
      aria-label={label} aria-expanded={open} aria-haspopup="menu" aria-controls={id}
      onClick={event => {
        if (!open) show(event.detail === 0 ? "first" : undefined);
        else if (event.nativeEvent instanceof PointerEvent && event.nativeEvent.pointerType === "mouse" &&
          !popup.current?.contains(document.activeElement)) show("first");
        else close();
      }}
      onPointerEnter={event => {
        if (event.pointerType !== "mouse") return;
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => show(), 100);
      }}
      onPointerLeave={leave}
      onKeyDown={event => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        show(event.key === "ArrowUp" ? "last" : "first");
      }}>
      {add ? <span aria-hidden="true">+</span> : <><span>{selected?.label ?? placeholder}</span><span className="dropdown-chevron" aria-hidden="true" /></>}
    </button>
    <div id={id} ref={popup} className="dropdown-popover" popover="manual"
      onPointerEnter={() => clearTimeout(timer.current)} onPointerLeave={leave} onKeyDown={moveFocus}>
      <div className="dropdown-panel" role="menu" aria-label={label}>
        {groups.map((group, index) => (
          <div className="dropdown-group" key={group.label ?? index} role="group" aria-label={group.label}>
            {group.label && <div className="dropdown-caption" aria-hidden="true">{group.label}</div>}
            {group.options.map(option => (
              <button type="button" key={option.value} role={add ? "menuitem" : "menuitemradio"}
                aria-checked={add ? undefined : option.value === value} disabled={option.disabled} tabIndex={-1}
                onClick={() => { close(true); onChange(option.value); }}>
                {option.label}
              </button>
            ))}
          </div>
        ))}
        {!groups.length && <p className="dropdown-caption">{placeholder}</p>}
      </div>
    </div>
  </>;
}
