//rich-text-toolbar.js

function clampRange(value, start, end) {
  const length = value.length;
  const safeStart = Math.max(0, Math.min(start, length));
  const safeEnd = Math.max(safeStart, Math.min(end, length));

  return {
    start: safeStart,
    end: safeEnd
  };
}

function createSelectionMemory(textarea) {
  let lastRange = {
    start: (textarea?.value ?? "").length,
    end: (textarea?.value ?? "").length
  };

  function saveCurrentSelection() {
    if (!textarea) return;

    const value = textarea.value ?? "";
    const hasSelection =
      typeof textarea.selectionStart === "number" &&
      typeof textarea.selectionEnd === "number";

    if (!hasSelection) {
      const end = value.length;
      lastRange = { start: end, end };
      return;
    }

    lastRange = clampRange(
      value,
      textarea.selectionStart,
      textarea.selectionEnd
    );
  }

  textarea.addEventListener("select", saveCurrentSelection);
  textarea.addEventListener("click", saveCurrentSelection);
  textarea.addEventListener("keyup", saveCurrentSelection);
  textarea.addEventListener("focus", saveCurrentSelection);
  textarea.addEventListener("input", saveCurrentSelection);

  saveCurrentSelection();

  return {
    get() {
      return clampRange(
        textarea?.value ?? "",
        lastRange.start,
        lastRange.end
      );
    },
    set(start, end) {
      const value = textarea?.value ?? "";
      lastRange = clampRange(value, start, end);
    },
    saveCurrentSelection
  };
}

function replaceTextareaRange(
  textarea,
  selectionMemory,
  start,
  end,
  insertedText,
  caretStart,
  caretEnd = caretStart
) {
  const value = textarea.value ?? "";

  textarea.value =
    value.slice(0, start) +
    insertedText +
    value.slice(end);

  textarea.focus();
  textarea.setSelectionRange(caretStart, caretEnd);
  selectionMemory.set(caretStart, caretEnd);
}

function insertPairTag(textarea, selectionMemory, openTag, closeTag) {
  if (!textarea) return;

  const value = textarea.value ?? "";
  const { start, end } = selectionMemory.get();
  const selectedText = value.slice(start, end);
  const insertedText = `${openTag}${selectedText}${closeTag}`;

  const caretPos =
    selectedText.length > 0
      ? start + openTag.length + selectedText.length
      : start + openTag.length;

  replaceTextareaRange(
    textarea,
    selectionMemory,
    start,
    end,
    insertedText,
    caretPos
  );
}

function insertCustomText(textarea, selectionMemory, insertText, caretOffset) {
  if (!textarea) return;

  const { start, end } = selectionMemory.get();
  const safeText = String(insertText ?? "");
  const safeOffset =
    typeof caretOffset === "number"
      ? caretOffset
      : safeText.length;

  replaceTextareaRange(
    textarea,
    selectionMemory,
    start,
    end,
    safeText,
    start + safeOffset
  );
}

function bindToolbarButton(textarea, selectionMemory, button) {
  if (!textarea || !button) return;

  const openTag = button.dataset.insertOpenTag;
  const closeTag = button.dataset.insertCloseTag;
  const insertText = button.dataset.insertText;
  const caretOffset = Number(button.dataset.caretOffset);

  button.addEventListener("mousedown", e => {
    e.preventDefault();
  });

  button.addEventListener("click", () => {
    if (typeof openTag === "string" && typeof closeTag === "string") {
      insertPairTag(textarea, selectionMemory, openTag, closeTag);
      return;
    }

    if (typeof insertText === "string") {
      insertCustomText(
        textarea,
        selectionMemory,
        insertText,
        Number.isNaN(caretOffset) ? undefined : caretOffset
      );
    }
  });
}

export function bindRichTextToolbar(root, textarea) {
  if (!root || !textarea) return;

  const selectionMemory = createSelectionMemory(textarea);

  const buttons = root.querySelectorAll(
    "[data-insert-open-tag], [data-insert-text]"
  );

  buttons.forEach(button => {
    bindToolbarButton(textarea, selectionMemory, button);
  });
}
