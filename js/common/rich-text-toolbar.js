//rich-text-toolbar.js

function getSafeSelectionRange(textarea) {
  if (!textarea) {
    return { start: 0, end: 0 };
  }

  const value = textarea.value ?? "";
  const hasSelection =
    typeof textarea.selectionStart === "number" &&
    typeof textarea.selectionEnd === "number";

  if (!hasSelection) {
    const end = value.length;
    return { start: end, end };
  }

  if (document.activeElement !== textarea) {
    const end = value.length;
    return { start: end, end };
  }

  return {
    start: textarea.selectionStart,
    end: textarea.selectionEnd
  };
}

function replaceTextareaRange(textarea, start, end, insertedText, caretStart, caretEnd = caretStart) {
  const value = textarea.value ?? "";

  textarea.value =
    value.slice(0, start) +
    insertedText +
    value.slice(end);

  textarea.focus();
  textarea.setSelectionRange(caretStart, caretEnd);
}

function insertPairTag(textarea, openTag, closeTag) {
  if (!textarea) return;

  const value = textarea.value ?? "";
  const { start, end } = getSafeSelectionRange(textarea);
  const selectedText = value.slice(start, end);
  const insertedText = `${openTag}${selectedText}${closeTag}`;

  const caretPos =
    selectedText.length > 0
      ? start + openTag.length + selectedText.length
      : start + openTag.length;

  replaceTextareaRange(
    textarea,
    start,
    end,
    insertedText,
    caretPos
  );
}

function insertCustomText(textarea, insertText, caretOffset) {
  if (!textarea) return;

  const { start, end } = getSafeSelectionRange(textarea);
  const safeText = String(insertText ?? "");
  const safeOffset =
    typeof caretOffset === "number"
      ? caretOffset
      : safeText.length;

  replaceTextareaRange(
    textarea,
    start,
    end,
    safeText,
    start + safeOffset
  );
}

function bindToolbarButton(textarea, button) {
  if (!textarea || !button) return;

  const openTag = button.dataset.insertOpenTag;
  const closeTag = button.dataset.insertCloseTag;
  const insertText = button.dataset.insertText;
  const caretOffset = Number(button.dataset.caretOffset);

  button.addEventListener("click", () => {
    if (typeof openTag === "string" && typeof closeTag === "string") {
      insertPairTag(textarea, openTag, closeTag);
      return;
    }

    if (typeof insertText === "string") {
      insertCustomText(
        textarea,
        insertText,
        Number.isNaN(caretOffset) ? undefined : caretOffset
      );
    }
  });
}

export function bindRichTextToolbar(root, textarea) {
  if (!root || !textarea) return;

  const buttons = root.querySelectorAll("[data-insert-open-tag], [data-insert-text]");

  buttons.forEach(button => {
    bindToolbarButton(textarea, button);
  });
}
