import type { ReactNode } from "react";
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function CardList({ order, visible, save, children }: {
  order: string[]; visible: string[]; save: (ids: string[]) => void; children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 280, tolerance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active, over}) => {
    if (!over || active.id === over.id) return;
    const from = visible.indexOf(String(active.id)), to = visible.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const moved = arrayMove(visible, from, to);
    let index = 0;
    save(order.map(id => visible.includes(id) ? moved[index++] : id));
  }}>
    <SortableContext items={visible} strategy={verticalListSortingStrategy}>{children}</SortableContext>
  </DndContext>;
}

export function SortCard({ id, name, className, remove, children }: {
  id: string; name: string; className: string; remove: () => void; children: ReactNode;
}) {
  const {setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging} = useSortable({id});
  const interactive = (target: EventTarget) => target instanceof Element && !!target.closest("button, a, input, select, textarea");
  return <article ref={setNodeRef} className={className + " sort-card"} data-dragging={isDragging}
    style={{transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, transition}}
    onMouseDown={e => { if (!interactive(e.target)) listeners?.onMouseDown?.(e); }}
    onTouchStart={e => { if (!interactive(e.target)) listeners?.onTouchStart?.(e); }}
    onDragStart={e => e.preventDefault()}>
    <div className="actions order-tools">
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={"Reorder " + name} title="Drag to reorder, or press Space and use arrow keys">
        <svg aria-hidden="true" width="14" height="12" viewBox="0 0 14 12"><path d="M1 4h12M1 8h12" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
      <button aria-label={"Remove " + name} onClick={remove}>×</button>
    </div>{children}
  </article>;
}
