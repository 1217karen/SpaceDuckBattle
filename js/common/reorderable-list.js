// reorderable-list.js

const cleanupByContainer = new WeakMap();

function getReorderableItems(container, itemSelector) {
  return Array.from(container.querySelectorAll(itemSelector));
}

function getPointerTargetItem(container, itemSelector, draggingItem, pointerY) {
  const items = getReorderableItems(container, itemSelector)
    .filter(item => item !== draggingItem);

  return items.find(item => {
    const rect = item.getBoundingClientRect();
    return pointerY >= rect.top && pointerY <= rect.bottom;
  }) || null;
}

function moveDraggingItem({ container, itemSelector, draggingItem, pointerY }) {
  const targetItem = getPointerTargetItem(
    container,
    itemSelector,
    draggingItem,
    pointerY
  );

  if (!targetItem) {
    return;
  }

  const rect = targetItem.getBoundingClientRect();
  const insertAfter = pointerY > rect.top + rect.height / 2;

  if (insertAfter) {
    container.insertBefore(draggingItem, targetItem.nextSibling);
  } else {
    container.insertBefore(draggingItem, targetItem);
  }
}

export function bindReorderableList({
  container,
  itemSelector,
  handleSelector,
  draggingClass = "is-dragging",
  onReorder = null
} = {}) {
  if (!container || !itemSelector || !handleSelector) {
    return () => {};
  }

  const previousCleanup = cleanupByContainer.get(container);

  if (typeof previousCleanup === "function") {
    previousCleanup();
  }

  let draggingItem = null;
  let activePointerId = null;

  function finishDrag() {
    if (!draggingItem) {
      return;
    }

    const finishedItem = draggingItem;

    finishedItem.classList.remove(draggingClass);
    draggingItem = null;
    activePointerId = null;

    if (typeof onReorder === "function") {
      onReorder({
        container,
        draggedItem: finishedItem,
        items: getReorderableItems(container, itemSelector)
      });
    }
  }

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    const handle = event.target.closest(handleSelector);

    if (!handle || !container.contains(handle) || handle.disabled) {
      return;
    }

    const item = handle.closest(itemSelector);

    if (!item || !container.contains(item)) {
      return;
    }

    event.preventDefault();

    draggingItem = item;
    activePointerId = event.pointerId;
    draggingItem.classList.add(draggingClass);

    if (typeof handle.setPointerCapture === "function") {
      handle.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event) {
    if (!draggingItem || event.pointerId !== activePointerId) {
      return;
    }

    event.preventDefault();

    moveDraggingItem({
      container,
      itemSelector,
      draggingItem,
      pointerY: event.clientY
    });
  }

  function handlePointerUp(event) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    event.preventDefault();
    finishDrag();
  }

  container.addEventListener("pointerdown", handlePointerDown);
  container.addEventListener("pointermove", handlePointerMove);
  container.addEventListener("pointerup", handlePointerUp);
  container.addEventListener("pointercancel", handlePointerUp);

  const cleanup = () => {
    container.removeEventListener("pointerdown", handlePointerDown);
    container.removeEventListener("pointermove", handlePointerMove);
    container.removeEventListener("pointerup", handlePointerUp);
    container.removeEventListener("pointercancel", handlePointerUp);
    cleanupByContainer.delete(container);
  };

  cleanupByContainer.set(container, cleanup);

  return cleanup;
}
