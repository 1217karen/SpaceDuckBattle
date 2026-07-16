import { getCurrentAccount, loadCharacter, saveCharacter } from "../services/storage-service.js";
import { getPlaceLabel } from "./chat-place-utils.js";

const VALID_CHAT_VIEWS = new Set([
  "chat",
  "here",
  "reply",
  "message",
  "favorite",
  "self",
  "eno"
]);

export function normalizeChatView(view, fallback = "chat") {
  return VALID_CHAT_VIEWS.has(view) ? view : fallback;
}

export function normalizeChatPage(page, fallback = 1) {
  const normalizedPage = Number(page);

  if (!Number.isFinite(normalizedPage)) {
    return fallback;
  }

  const integerPage = Math.trunc(normalizedPage);

  return integerPage > 0 ? integerPage : fallback;
}

export function buildChatUrl(options = {}) {
  const {
    placeId = "",
    view = "chat",
    page = 1,
    eno = null,
    filterEno = null
  } = options;

  const params = new URLSearchParams();

  if (placeId) {
    params.set("placeId", placeId);
  }

  params.set("view", normalizeChatView(view));
  params.set("page", String(normalizeChatPage(page)));

  const normalizedEno = Number(eno || 0);
  if (Number.isInteger(normalizedEno) && normalizedEno > 0) {
    params.set("eno", String(normalizedEno));
  }

  const normalizedFilterEno = Number(filterEno || 0);
  if (Number.isInteger(normalizedFilterEno) && normalizedFilterEno > 0) {
    params.set("filterEno", String(normalizedFilterEno));
  }

  return `./chat.html?${params.toString()}`;
}

export function buildChatPlaceUrl(placeId) {
  return buildChatUrl({
    placeId,
    view: "chat",
    page: 1
  });
}

export function navigateToChatPlace(placeId, options = {}) {
  const {
    withToast = true
  } = options;

  if (!placeId) {
    return;
  }

  if (withToast) {
    const placeLabel = getPlaceLabel(placeId);

    sessionStorage.setItem(
      "chatToastMessage",
      JSON.stringify({
        message: `${placeLabel}に移動しました`,
        type: "info"
      })
    );
  }

  window.location.href = buildChatPlaceUrl(placeId);
}

export function moveToChatPlace(placeId, options = {}) {
  const {
    onBeforeMove = null
  } = options;

  if (!placeId) {
    return false;
  }

  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return false;
  }

  const eno = account.eno;
  const character = loadCharacter(eno) || {};

  if (typeof onBeforeMove === "function") {
    onBeforeMove();
  }

  saveCharacter(eno, {
    ...character,
    currentPlaceId: placeId
  });

  navigateToChatPlace(placeId);

  return true;
}

export function getPlaceIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("placeId");
}

export function getChatViewFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return normalizeChatView(params.get("view"));
}

export function getChatPageFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return normalizeChatPage(params.get("page"));
}

export function getChatAuthorEnoFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const eno = Number(params.get("eno") || 0);

  return Number.isInteger(eno) && eno > 0 ? eno : null;
}

export function getChatMessageFilterEnoFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const eno = Number(params.get("filterEno") || 0);

  return Number.isInteger(eno) && eno > 0 ? eno : null;
}
