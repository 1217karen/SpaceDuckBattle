// js/rich-text.js

// ========================================
// 装飾テキスト 共通設定
// ========================================

// f4 を基準サイズ 1.0 とした段階倍率
export const FONT_SCALE_MAP = {
  f1: 0.4,
  f2: 0.6,
  f3: 0.8,
  f4: 1.0,
  f5: 1.5,
  f6: 2.0,
  f7: 3.0
};

// 現時点で扱うタグ一覧
export const RICH_TEXT_TAGS = {
  b: { type: "style" },
  i: { type: "style" },
  u: { type: "style" },
  s: { type: "style" },
  br: { type: "single" },
  rb: { type: "ruby-base" },
  rt: { type: "ruby-text" },
  f1: { type: "style" },
  f2: { type: "style" },
  f3: { type: "style" },
  f4: { type: "style" },
  f5: { type: "style" },
  f6: { type: "style" },
  f7: { type: "style" }
};

// 表示場所ごとの許可タグセット
export const RICH_TEXT_PRESETS = {
  plain: new Set(),
  name: new Set(),
  message: new Set([
    "b",
    "i",
    "u",
    "s",
    "br",
    "rb",
    "rt",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7"
  ])
};

// ========================================
// ユーティリティ
// ========================================

export function getFontScale(tagName) {
  return FONT_SCALE_MAP[tagName] ?? 1.0;
}

export function isKnownRichTextTag(tagName) {
  return Object.prototype.hasOwnProperty.call(RICH_TEXT_TAGS, tagName);
}

export function isAllowedRichTextTag(tagName, allowedTags) {
  if (!allowedTags) return false;
  return allowedTags.has(tagName);
}

// ========================================
// トークン化
// ========================================

function tokenizeRichText(text) {
  const source = typeof text === "string" ? text : "";
  const tokens = [];

  let cursor = 0;

  while (cursor < source.length) {
    const tagStart = source.indexOf("<", cursor);

    if (tagStart === -1) {
      tokens.push({
        type: "text",
        value: source.slice(cursor)
      });
      break;
    }

    if (tagStart > cursor) {
      tokens.push({
        type: "text",
        value: source.slice(cursor, tagStart)
      });
    }

    const tagEnd = source.indexOf(">", tagStart + 1);

    if (tagEnd === -1) {
      tokens.push({
        type: "text",
        value: source.slice(tagStart)
      });
      break;
    }

    const rawInside = source.slice(tagStart + 1, tagEnd).trim();

    if (!rawInside) {
      tokens.push({
        type: "text",
        value: source.slice(tagStart, tagEnd + 1)
      });
      cursor = tagEnd + 1;
      continue;
    }

    if (rawInside === "br") {
      tokens.push({
        type: "tag",
        raw: `<${rawInside}>`,
        tagName: "br",
        kind: "single"
      });
      cursor = tagEnd + 1;
      continue;
    }

    if (rawInside.startsWith("/")) {
      const tagName = rawInside.slice(1).trim();

      if (isKnownRichTextTag(tagName)) {
        tokens.push({
          type: "tag",
          raw: `<${rawInside}>`,
          tagName,
          kind: "close"
        });
      } else {
        tokens.push({
          type: "text",
          value: source.slice(tagStart, tagEnd + 1)
        });
      }

      cursor = tagEnd + 1;
      continue;
    }

    if (isKnownRichTextTag(rawInside)) {
      tokens.push({
        type: "tag",
        raw: `<${rawInside}>`,
        tagName: rawInside,
        kind: "open"
      });
      cursor = tagEnd + 1;
      continue;
    }

    tokens.push({
      type: "text",
      value: source.slice(tagStart, tagEnd + 1)
    });

    cursor = tagEnd + 1;
  }

  return tokens;
}

// ========================================
// DOM反映
// ========================================

function createStyledSpan(text, activeTags) {
  const span = document.createElement("span");
  span.textContent = text;

  if (activeTags.has("b")) {
    span.style.fontWeight = "bold";
  }

  if (activeTags.has("i")) {
    span.style.fontStyle = "italic";
  }

  const decorations = [];

  if (activeTags.has("u")) {
    decorations.push("underline");
  }

  if (activeTags.has("s")) {
    decorations.push("line-through");
  }

  if (decorations.length > 0) {
    span.style.textDecoration = decorations.join(" ");
    span.style.textDecorationSkipInk = "none";
  }

  let fontScale = 1.0;

  for (const tagName of ["f1", "f2", "f3", "f4", "f5", "f6", "f7"]) {
    if (activeTags.has(tagName)) {
      fontScale = getFontScale(tagName);
    }
  }

  span.style.fontSize = `${fontScale}em`;

  return span;
}

function createRubyNode(baseText, rubyText, activeTags) {
  const ruby = document.createElement("ruby");
  const baseSpan = createStyledSpan(baseText, activeTags);
  const rt = document.createElement("rt");

  rt.textContent = rubyText;

  if (activeTags.has("b")) {
    rt.style.fontWeight = "bold";
  }

  if (activeTags.has("i")) {
    rt.style.fontStyle = "italic";
  }

  const decorations = [];

  if (activeTags.has("u")) {
    decorations.push("underline");
  }

  if (activeTags.has("s")) {
    decorations.push("line-through");
  }

  if (decorations.length > 0) {
    rt.style.textDecoration = decorations.join(" ");
    rt.style.textDecorationSkipInk = "none";
  }

  let fontScale = 1.0;

  for (const tagName of ["f1", "f2", "f3", "f4", "f5", "f6", "f7"]) {
    if (activeTags.has(tagName)) {
      fontScale = getFontScale(tagName);
    }
  }

  rt.style.fontSize = `${fontScale * 0.55}em`;

  ruby.appendChild(baseSpan);
  ruby.appendChild(rt);

  return ruby;
}

// ========================================
// 共通描画
// ========================================

function tokenizedRbText(tokens, startIndex) {
  const rbTextToken = tokens[startIndex + 1];

  if (rbTextToken?.type === "text") {
    return rbTextToken.value;
  }

  return "";
}

export function renderRichText(targetEl, text, options = {}) {
  if (!targetEl) return;

  const {
    preset = "plain"
  } = options;

  const allowedTags =
    RICH_TEXT_PRESETS[preset] || RICH_TEXT_PRESETS.plain;

  targetEl.innerHTML = "";
  targetEl.dataset.richTextPreset = preset;
  targetEl.dataset.richTextAllowedTags =
    [...allowedTags].join(",");

  const tokens = tokenizeRichText(text);
  const activeTags = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (token.type === "text") {
      if (!token.value) continue;

      const span = createStyledSpan(
        token.value,
        new Set(activeTags)
      );

      targetEl.appendChild(span);
      continue;
    }

    if (token.type !== "tag") continue;

    if (!isAllowedRichTextTag(token.tagName, allowedTags)) {
      const span = createStyledSpan(
        token.raw,
        new Set(activeTags)
      );
      targetEl.appendChild(span);
      continue;
    }

    if (token.kind === "single" && token.tagName === "br") {
      targetEl.appendChild(document.createElement("br"));
      continue;
    }

    if (
      token.kind === "open" &&
      token.tagName === "rb"
    ) {
      const rbTextToken = tokens[index + 1];
      const closeRb = tokens[index + 2];
      const openRt = tokens[index + 3];
      const rubyTextToken = tokens[index + 4];
      const closeRt = tokens[index + 5];

      const isValidRubyPair =
        rbTextToken?.type === "text" &&
        closeRb?.type === "tag" &&
        closeRb.kind === "close" &&
        closeRb.tagName === "rb" &&
        openRt?.type === "tag" &&
        openRt.kind === "open" &&
        openRt.tagName === "rt" &&
        rubyTextToken?.type === "text" &&
        closeRt?.type === "tag" &&
        closeRt.kind === "close" &&
        closeRt.tagName === "rt";

      if (
        isValidRubyPair &&
        isAllowedRichTextTag("rb", allowedTags) &&
        isAllowedRichTextTag("rt", allowedTags)
      ) {
        const rubyNode = createRubyNode(
          tokenizedRbText(tokens, index),
          rubyTextToken.value,
          new Set(activeTags)
        );

        targetEl.appendChild(rubyNode);
        index += 4;
        continue;
      }

      const span = createStyledSpan(
        token.raw,
        new Set(activeTags)
      );
      targetEl.appendChild(span);
      continue;
    }

    if (token.kind === "open") {
      activeTags.push(token.tagName);
      continue;
    }

    if (token.kind === "close") {
      for (let i = activeTags.length - 1; i >= 0; i--) {
        if (activeTags[i] === token.tagName) {
          activeTags.splice(i, 1);
          break;
        }
      }
    }
  }
}
