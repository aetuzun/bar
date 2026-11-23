import { useEffect, useId, useRef, useState } from "react";

type Choice = { value: string; label: string; disabled?: boolean };
type ChoiceGroup = { label?: string; options: Choice[] };

export function ControlIcon({ kind }: { kind: "add" | "remove" }) {
  return (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M12 5v14" transform={kind === "remove" ? "rotate(45 12 12)" : undefined} />
    </svg>
  );
}

export function Picker({ id, label, placeholder, groups, value, choose, add = false, invalid = false }: {
  id?: string;
  label: string;
  placeholder?: string;
  groups: ChoiceGroup[];
  value?: string;
  choose: (value: string) => void;
  add?: boolean;
  invalid?: boolean;
}) {
  const popupId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const focusLast = useRef(false);
  const selected = groups.flatMap(group => group.options).find(option => option.value === value);
  const visibleGroups = groups.filter(group => group.options.length > 0);

  function enabledOptions() {
    return Array.from(popup.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
  }

  function positionPopup() {
    if (!trigger.current || !popup.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const width = Math.min(add ? 320 : Math.max(220, rect.width), viewportWidth - 24);
    const left = Math.max(12, Math.min(add ? rect.right - width : rect.left, viewportWidth - width - 12));
    const below = viewportHeight - rect.bottom - 18;
    const above = rect.top - 18;
    const opensAbove = below < 220 && above > below;
    Object.assign(popup.current.style, {
      width: width + "px",
      left: left + "px",
      top: opensAbove ? "auto" : rect.bottom + 6 + "px",
      bottom: opensAbove ? viewportHeight - rect.top + 6 + "px" : "auto",
      maxHeight: Math.min(340, Math.max(64, opensAbove ? above : below)) + "px",
    });
  }

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", positionPopup);
    window.addEventListener("scroll", positionPopup, true);
    return () => {
      window.removeEventListener("resize", positionPopup);
      window.removeEventListener("scroll", positionPopup, true);
    };
  }, [open, add]);

  function close() {
    popup.current?.hidePopover();
    trigger.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <button
        id={id}
        ref={trigger}
        type="button"
        className={add ? "filter-add" : "picker-field"}
        aria-label={add ? label : label + (selected ? ", " + selected.label : "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={popupId}
        aria-invalid={invalid || undefined}
        popoverTarget={popupId}
        title={add ? label : undefined}
        onClick={positionPopup}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            focusLast.current = event.key === "ArrowUp";
            trigger.current?.click();
          }
        }}
      >
        {add ? <ControlIcon kind="add" /> : <>
          <span>{selected?.label ?? placeholder}</span>
          <svg viewBox="0 0 12 8" aria-hidden="true"><path d="m2 2 4 4 4-4" /></svg>
        </>}
      </button>
      <div
        id={popupId}
        ref={popup}
        popover="auto"
        className="picker-popup"
        role="listbox"
        aria-label={label}
        tabIndex={-1}
        onToggle={event => {
          const expanded = event.newState === "open";
          setOpen(expanded);
          if (!expanded) return;
          const options = enabledOptions();
          const target = focusLast.current ? options.at(-1)
            : options.find(option => option.getAttribute("aria-selected") === "true") ?? options[0];
          focusLast.current = false;
          (target ?? popup.current)?.focus();
        }}
        onKeyDown={event => {
          if (event.key === "Tab") {
            close();
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
          }
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const options = enabledOptions();
          const current = options.findIndex(option => option === document.activeElement);
          const next = event.key === "Home" ? 0
            : event.key === "End" ? options.length - 1
            : event.key === "ArrowDown" ? Math.min(current + 1, options.length - 1)
            : Math.max(current - 1, 0);
          options[next]?.focus();
        }}
      >
        {!visibleGroups.length && <div className="picker-empty" role="option" aria-disabled="true">{placeholder}</div>}
        {visibleGroups.map(group => (
          <div key={group.label ?? label} role="group" aria-label={group.label} className="picker-group">
            {group.label && <div className="picker-heading" aria-hidden="true">{group.label}</div>}
            {group.options.map(option => (
              <button key={option.value} type="button" role="option" className="picker-option"
                aria-selected={option.value === value} tabIndex={-1} disabled={option.disabled}
                onClick={() => {
                  close();
                  choose(option.value);
                }}
              >{option.label}</button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
