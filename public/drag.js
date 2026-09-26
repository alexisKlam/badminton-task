import { LONG_PRESS_MS, DRAG_THRESHOLD_PX } from "./config.js";

// Drag a `.card[data-id]` onto any `[data-status]` element (columns on desktop, tabs on mobile).
// Mouse: drag starts after a small move. Touch: drag starts after a long press.
export function enableDrag(onDrop) {
  let pending = null;
  let drag = null;
  let suppressClick = false;

  function dropTargetAt(x, y) {
    return document.elementFromPoint(x, y)?.closest("[data-status]");
  }

  function highlight(target) {
    document.querySelectorAll(".drop-target").forEach((node) => node.classList.remove("drop-target"));
    target?.classList.add("drop-target");
  }

  function start(x, y) {
    const card = pending.card;
    const rect = card.getBoundingClientRect();
    const ghost = card.cloneNode(true);
    ghost.classList.add("ghost-card");
    ghost.style.width = `${rect.width}px`;
    document.body.append(ghost);
    card.classList.add("dragging");
    document.body.classList.add("is-dragging");
    drag = { card, ghost, offsetX: x - rect.left, offsetY: y - rect.top };
    move(x, y);
    navigator.vibrate?.(20);
  }

  function move(x, y) {
    drag.ghost.style.transform = `translate(${x - drag.offsetX}px, ${y - drag.offsetY}px)`;
    highlight(dropTargetAt(x, y));
  }

  function reset() {
    clearTimeout(pending?.timer);
    pending = null;
    if (drag) {
      drag.ghost.remove();
      drag.card.classList.remove("dragging");
      document.body.classList.remove("is-dragging");
      highlight(null);
      drag = null;
    }
  }

  document.addEventListener("pointerdown", (e) => {
    const card = e.target.closest(".card");
    if (card && e.target.closest(".next-status") === null) {
      pending = { card, x: e.clientX, y: e.clientY, isTouch: e.pointerType === "touch" };
      if (pending.isTouch) pending.timer = setTimeout(() => start(pending.x, pending.y), LONG_PRESS_MS);
    }
  });

  document.addEventListener("pointermove", (e) => {
    if (drag) {
      move(e.clientX, e.clientY);
    } else if (pending) {
      const moved = Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > DRAG_THRESHOLD_PX;
      if (moved && pending.isTouch) reset();
      if (moved && pending?.isTouch === false) start(e.clientX, e.clientY);
    }
  });

  document.addEventListener("pointerup", (e) => {
    if (drag) {
      const target = dropTargetAt(e.clientX, e.clientY);
      const id = drag.card.dataset.id;
      // Swallows the click that may follow this pointerup (mouse), but never a later one (touch has none).
      suppressClick = true;
      setTimeout(() => { suppressClick = false; });
      if (target) onDrop(id, target.dataset.status);
    }
    reset();
  });

  document.addEventListener("pointercancel", reset);

  // Keeps the page from scrolling while a card is dragged on touch screens.
  document.addEventListener("touchmove", (e) => { if (drag) e.preventDefault(); }, { passive: false });
  document.addEventListener("contextmenu", (e) => { if (e.target.closest(".card")) e.preventDefault(); });

  document.addEventListener("click", (e) => {
    if (suppressClick) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}
