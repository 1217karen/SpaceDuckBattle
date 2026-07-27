// notice-rich-text.js

import { renderRichText } from "../common/rich-text.js";

const LINK_PATTERN = /\[link=([^\]]+)\]([\s\S]*?)\[\/link\]/g;

function getSafeLinkUrl(value) {
  const rawUrl = String(value ?? "").trim();

  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl, window.location.href);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return rawUrl;
  } catch {
    return null;
  }
}

function appendRichText(target, text) {
  if (!text) return;

  const fragmentContainer = document.createElement("span");
  renderRichText(fragmentContainer, text, { preset: "notice" });

  while (fragmentContainer.firstChild) {
    target.appendChild(fragmentContainer.firstChild);
  }
}

export function renderNoticeRichText(target, text) {
  if (!target) return;

  const source = typeof text === "string" ? text : "";
  target.innerHTML = "";

  let cursor = 0;

  for (const match of source.matchAll(LINK_PATTERN)) {
    const matchIndex = match.index ?? 0;
    appendRichText(target, source.slice(cursor, matchIndex));

    const safeUrl = getSafeLinkUrl(match[1]);

    if (safeUrl) {
      const link = document.createElement("a");
      link.className = "noticeBodyLink";
      link.href = safeUrl;
      link.textContent = match[2];
      target.appendChild(link);
    } else {
      appendRichText(target, match[2]);
    }

    cursor = matchIndex + match[0].length;
  }

  appendRichText(target, source.slice(cursor));
}
