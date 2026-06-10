//chat-post-view.js

function stripRichTextTags(text) {
  return String(text ?? "").replace(/<\/?(b|i|u|s|br|rb|rt|f1|f2|f3|f4|f5|f6|f7)>/g, "");
}

function getPreviewText(text) {
  const plainText = stripRichTextTags(text);
  const length = plainText.length;

  if (length <= 5) {
    return plainText;
  }

  if (length <= 24) {
    return plainText.slice(0, length - 5) + "……";
  }

  return plainText.slice(0, 20) + "……";
}

function formatReplyTargetLabel(target = {}) {
  const eno =
    typeof target?.eno === "number" && target.eno > 0
      ? target.eno
      : null;

  const name =
    typeof target?.name === "string"
      ? target.name.trim()
      : "";

  if (name && eno) {
    return `${name}(Eno.${eno})`;
  }

  if (name) {
    return name;
  }

  if (eno) {
    return `Eno.${eno}`;
  }

  return "不明";
}
